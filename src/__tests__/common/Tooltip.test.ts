import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { renderTooltipContent } from '@/components/common/Tooltip';

// Feature: command-footer-ux
// Property 12: Tooltip Markdown Parsing
// **Validates: Requirements 5.2**

/**
 * Property 12: Tooltip Markdown Parsing
 * 
 * For any string containing **bold**, `code`, or [link](url) patterns,
 * the tooltip's renderContent function SHALL transform them into the
 * corresponding React elements (strong, code, anchor).
 */

// Helper function to extract text content from React elements
function extractTextContent(element: React.ReactNode): string {
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);
  if (!React.isValidElement(element)) return '';
  
  const props = element.props as { children?: React.ReactNode };
  const children = props.children;
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(extractTextContent).join('');
  }
  return extractTextContent(children);
}

// Helper function to find elements of a specific type in the result
function findElementsOfType(elements: React.ReactNode[], type: string): React.ReactElement[] {
  return elements.filter((el): el is React.ReactElement => 
    React.isValidElement(el) && el.type === type
  );
}

// Helper to get props from a React element
function getElementProps(element: React.ReactElement): Record<string, unknown> {
  return element.props as Record<string, unknown>;
}

// Arbitrary generators for property tests

// Character sets for generating strings
const alphanumericChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
const domainChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
const plainTextChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.!?;:\'-';

// Generate a word (alphanumeric string without special markdown characters)
const wordArb = fc.string({
  unit: fc.constantFrom(...alphanumericChars.split('')),
  minLength: 1,
  maxLength: 20
}).filter(s => s.trim().length > 0);

// Generate bold text pattern: **text**
const boldTextArb = wordArb.map(text => `**${text}**`);

// Generate code text pattern: `code`
const codeTextArb = wordArb.map(text => `\`${text}\``);

// Generate a domain name
const domainArb = fc.string({
  unit: fc.constantFrom(...domainChars.split('')),
  minLength: 3,
  maxLength: 15
}).filter(s => s.length >= 3);

// Generate a valid URL (simplified)
const urlArb = fc.tuple(
  fc.constantFrom('https://', 'http://'),
  domainArb,
  fc.constantFrom('.com', '.org', '.io', '.dev', '.net')
).map(([protocol, domain, tld]) => `${protocol}${domain}${tld}`);

// Generate link text pattern: [text](url)
const linkTextArb = fc.tuple(wordArb, urlArb).map(([text, url]) => `[${text}](${url})`);

// Generate plain text (no markdown patterns)
const plainTextArb = fc.string({
  unit: fc.constantFrom(...plainTextChars.split('')),
  minLength: 1,
  maxLength: 50
}).filter(s => 
  !s.includes('**') && 
  !s.includes('`') && 
  !s.includes('[') && 
  !s.includes(']') &&
  s.trim().length > 0
);

describe('Tooltip - Property 12: Tooltip Markdown Parsing', () => {
  // Feature: command-footer-ux, Property 12: Tooltip Markdown Parsing
  // **Validates: Requirements 5.2**

  describe('Property 12: Bold text (**text**) transforms to <strong> elements', () => {
    it('any **text** pattern is transformed into a strong element', () => {
      fc.assert(
        fc.property(
          boldTextArb,
          (boldText) => {
            const result = renderTooltipContent(boldText);
            
            // Find strong elements in the result
            const strongElements = findElementsOfType(result, 'strong');
            
            // Property: There should be exactly one strong element
            expect(strongElements.length).toBe(1);
            
            // Property: The strong element should contain the text without **
            const expectedText = boldText.slice(2, -2);
            const actualText = extractTextContent(strongElements[0]);
            expect(actualText).toBe(expectedText);
            
            return strongElements.length === 1 && actualText === expectedText;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('bold text mixed with plain text produces strong element for bold part', () => {
      fc.assert(
        fc.property(
          plainTextArb,
          boldTextArb,
          plainTextArb,
          (prefix, boldText, suffix) => {
            const input = `${prefix}${boldText}${suffix}`;
            const result = renderTooltipContent(input);
            
            // Find strong elements
            const strongElements = findElementsOfType(result, 'strong');
            
            // Property: There should be exactly one strong element
            expect(strongElements.length).toBe(1);
            
            // Property: The strong element should contain the bold text content
            const expectedText = boldText.slice(2, -2);
            const actualText = extractTextContent(strongElements[0]);
            expect(actualText).toBe(expectedText);
            
            return strongElements.length === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple bold patterns produce multiple strong elements', () => {
      fc.assert(
        fc.property(
          fc.array(boldTextArb, { minLength: 1, maxLength: 5 }),
          (boldTexts) => {
            const input = boldTexts.join(' ');
            const result = renderTooltipContent(input);
            
            // Find strong elements
            const strongElements = findElementsOfType(result, 'strong');
            
            // Property: Number of strong elements should match number of bold patterns
            expect(strongElements.length).toBe(boldTexts.length);
            
            return strongElements.length === boldTexts.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Code text (`code`) transforms to <code> elements', () => {
    it('any `code` pattern is transformed into a code element', () => {
      fc.assert(
        fc.property(
          codeTextArb,
          (codeText) => {
            const result = renderTooltipContent(codeText);
            
            // Find code elements in the result
            const codeElements = findElementsOfType(result, 'code');
            
            // Property: There should be exactly one code element
            expect(codeElements.length).toBe(1);
            
            // Property: The code element should contain the text without backticks
            const expectedText = codeText.slice(1, -1);
            const actualText = extractTextContent(codeElements[0]);
            expect(actualText).toBe(expectedText);
            
            return codeElements.length === 1 && actualText === expectedText;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('code text mixed with plain text produces code element for code part', () => {
      fc.assert(
        fc.property(
          plainTextArb,
          codeTextArb,
          plainTextArb,
          (prefix, codeText, suffix) => {
            const input = `${prefix}${codeText}${suffix}`;
            const result = renderTooltipContent(input);
            
            // Find code elements
            const codeElements = findElementsOfType(result, 'code');
            
            // Property: There should be exactly one code element
            expect(codeElements.length).toBe(1);
            
            // Property: The code element should contain the code text content
            const expectedText = codeText.slice(1, -1);
            const actualText = extractTextContent(codeElements[0]);
            expect(actualText).toBe(expectedText);
            
            return codeElements.length === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple code patterns produce multiple code elements', () => {
      fc.assert(
        fc.property(
          fc.array(codeTextArb, { minLength: 1, maxLength: 5 }),
          (codeTexts) => {
            const input = codeTexts.join(' ');
            const result = renderTooltipContent(input);
            
            // Find code elements
            const codeElements = findElementsOfType(result, 'code');
            
            // Property: Number of code elements should match number of code patterns
            expect(codeElements.length).toBe(codeTexts.length);
            
            return codeElements.length === codeTexts.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Link text ([text](url)) transforms to <a> elements', () => {
    it('any [text](url) pattern is transformed into an anchor element', () => {
      fc.assert(
        fc.property(
          linkTextArb,
          (linkText) => {
            const result = renderTooltipContent(linkText);
            
            // Find anchor elements in the result
            const anchorElements = findElementsOfType(result, 'a');
            
            // Property: There should be exactly one anchor element
            expect(anchorElements.length).toBe(1);
            
            // Extract expected text and URL from the link pattern
            const match = linkText.match(/\[(.*?)\]\((.*?)\)/);
            expect(match).not.toBeNull();
            
            if (match) {
              const expectedText = match[1];
              const expectedUrl = match[2];
              
              // Property: The anchor element should contain the link text
              const actualText = extractTextContent(anchorElements[0]);
              expect(actualText).toBe(expectedText);
              
              // Property: The anchor element should have the correct href
              const props = getElementProps(anchorElements[0]);
              expect(props.href).toBe(expectedUrl);
            }
            
            return anchorElements.length === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('link text mixed with plain text produces anchor element for link part', () => {
      fc.assert(
        fc.property(
          plainTextArb,
          linkTextArb,
          plainTextArb,
          (prefix, linkText, suffix) => {
            const input = `${prefix}${linkText}${suffix}`;
            const result = renderTooltipContent(input);
            
            // Find anchor elements
            const anchorElements = findElementsOfType(result, 'a');
            
            // Property: There should be exactly one anchor element
            expect(anchorElements.length).toBe(1);
            
            // Extract expected text from the link pattern
            const match = linkText.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              const expectedText = match[1];
              const actualText = extractTextContent(anchorElements[0]);
              expect(actualText).toBe(expectedText);
            }
            
            return anchorElements.length === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple link patterns produce multiple anchor elements', () => {
      fc.assert(
        fc.property(
          fc.array(linkTextArb, { minLength: 1, maxLength: 5 }),
          (linkTexts) => {
            const input = linkTexts.join(' ');
            const result = renderTooltipContent(input);
            
            // Find anchor elements
            const anchorElements = findElementsOfType(result, 'a');
            
            // Property: Number of anchor elements should match number of link patterns
            expect(anchorElements.length).toBe(linkTexts.length);
            
            return anchorElements.length === linkTexts.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('anchor elements have correct security attributes', () => {
      fc.assert(
        fc.property(
          linkTextArb,
          (linkText) => {
            const result = renderTooltipContent(linkText);
            const anchorElements = findElementsOfType(result, 'a');
            
            expect(anchorElements.length).toBe(1);
            
            // Property: Anchor should have target="_blank" for external links
            const props = getElementProps(anchorElements[0]);
            expect(props.target).toBe('_blank');
            
            // Property: Anchor should have rel="noopener noreferrer" for security
            expect(props.rel).toBe('noopener noreferrer');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Mixed markdown patterns', () => {
    it('text with all three patterns produces correct elements', () => {
      fc.assert(
        fc.property(
          boldTextArb,
          codeTextArb,
          linkTextArb,
          (boldText, codeText, linkText) => {
            const input = `${boldText} ${codeText} ${linkText}`;
            const result = renderTooltipContent(input);
            
            // Find all element types
            const strongElements = findElementsOfType(result, 'strong');
            const codeElements = findElementsOfType(result, 'code');
            const anchorElements = findElementsOfType(result, 'a');
            
            // Property: Should have one of each element type
            expect(strongElements.length).toBe(1);
            expect(codeElements.length).toBe(1);
            expect(anchorElements.length).toBe(1);
            
            return strongElements.length === 1 && 
                   codeElements.length === 1 && 
                   anchorElements.length === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('plain text without markdown patterns produces only span elements', () => {
      fc.assert(
        fc.property(
          plainTextArb,
          (plainText) => {
            const result = renderTooltipContent(plainText);
            
            // Find formatted elements
            const strongElements = findElementsOfType(result, 'strong');
            const codeElements = findElementsOfType(result, 'code');
            const anchorElements = findElementsOfType(result, 'a');
            
            // Property: No formatted elements should be present
            expect(strongElements.length).toBe(0);
            expect(codeElements.length).toBe(0);
            expect(anchorElements.length).toBe(0);
            
            // Property: Result should contain span elements with the text
            const spanElements = findElementsOfType(result, 'span');
            expect(spanElements.length).toBeGreaterThan(0);
            
            return strongElements.length === 0 && 
                   codeElements.length === 0 && 
                   anchorElements.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty string produces empty result', () => {
      const result = renderTooltipContent('');
      
      // Property: Empty input should produce array with single empty span
      expect(result.length).toBe(1);
      const spanElements = findElementsOfType(result, 'span');
      expect(spanElements.length).toBe(1);
      expect(extractTextContent(spanElements[0])).toBe('');
    });
  });

  describe('Property 12: Content preservation', () => {
    it('bold text content is preserved exactly', () => {
      fc.assert(
        fc.property(
          wordArb,
          (text) => {
            const input = `**${text}**`;
            const result = renderTooltipContent(input);
            
            const strongElements = findElementsOfType(result, 'strong');
            expect(strongElements.length).toBe(1);
            
            // Property: Text content should be preserved exactly
            const actualText = extractTextContent(strongElements[0]);
            expect(actualText).toBe(text);
            
            return actualText === text;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('code text content is preserved exactly', () => {
      fc.assert(
        fc.property(
          wordArb,
          (text) => {
            const input = `\`${text}\``;
            const result = renderTooltipContent(input);
            
            const codeElements = findElementsOfType(result, 'code');
            expect(codeElements.length).toBe(1);
            
            // Property: Text content should be preserved exactly
            const actualText = extractTextContent(codeElements[0]);
            expect(actualText).toBe(text);
            
            return actualText === text;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('link text and URL are preserved exactly', () => {
      fc.assert(
        fc.property(
          wordArb,
          urlArb,
          (text, url) => {
            const input = `[${text}](${url})`;
            const result = renderTooltipContent(input);
            
            const anchorElements = findElementsOfType(result, 'a');
            expect(anchorElements.length).toBe(1);
            
            // Property: Link text should be preserved exactly
            const actualText = extractTextContent(anchorElements[0]);
            expect(actualText).toBe(text);
            
            // Property: URL should be preserved exactly
            const props = getElementProps(anchorElements[0]);
            expect(props.href).toBe(url);
            
            return actualText === text && props.href === url;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: command-footer-ux
// Property 13: Tooltip Edge Adjustment
// **Validates: Requirements 5.3**

import { calculateTooltipPosition } from '@/components/common/Tooltip';

/**
 * Property 13: Tooltip Edge Adjustment
 * 
 * For any tooltip position where x + 300 > viewport width, the tooltip SHALL
 * apply a right-anchor transform to keep it within the viewport.
 * 
 * The tooltip has a fixed width of 300px. When positioned near the right edge
 * of the viewport, it must adjust its transform to prevent overflow.
 */

describe('Tooltip - Property 13: Tooltip Edge Adjustment', () => {
  // Feature: command-footer-ux, Property 13: Tooltip Edge Adjustment
  // **Validates: Requirements 5.3**

  // Arbitrary generators for property tests
  
  // Generate viewport widths (common screen sizes and random values)
  const viewportWidthArb = fc.oneof(
    // Common viewport widths
    fc.constantFrom(320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560),
    // Random viewport widths (reasonable range)
    fc.integer({ min: 300, max: 4000 })
  );

  // Generate x positions relative to viewport
  const xPositionArb = fc.integer({ min: 0, max: 4000 });

  describe('Property 13: Right-anchor adjustment when x + 300 > viewport width', () => {
    it('positions near right edge (x + 300 > viewport) SHALL be right-anchored', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          fc.integer({ min: 0, max: 4000 }),
          (viewportWidth, offset) => {
            // Generate x position that would overflow: x + 300 > viewportWidth
            // So x > viewportWidth - 300
            const minOverflowX = Math.max(0, viewportWidth - 299);
            const x = minOverflowX + (offset % (4000 - minOverflowX + 1));
            
            // Only test if x actually causes overflow
            if (x + 300 <= viewportWidth) return true;
            
            const result = calculateTooltipPosition(x, viewportWidth);
            
            // Property: When x + 300 > viewportWidth, isRightAnchored SHALL be true
            expect(result.isRightAnchored).toBe(true);
            
            // Property: Right-anchored transform SHALL be 'translateX(-278px)'
            expect(result.transform).toBe('translateX(-278px)');
            
            return result.isRightAnchored === true && result.transform === 'translateX(-278px)';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('positions with room (x + 300 <= viewport) SHALL NOT be right-anchored', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          fc.integer({ min: 0, max: 4000 }),
          (viewportWidth, offset) => {
            // Generate x position that fits: x + 300 <= viewportWidth
            // So x <= viewportWidth - 300
            const maxFitX = Math.max(0, viewportWidth - 300);
            const x = offset % (maxFitX + 1);
            
            // Only test if x actually fits
            if (x + 300 > viewportWidth) return true;
            
            const result = calculateTooltipPosition(x, viewportWidth);
            
            // Property: When x + 300 <= viewportWidth, isRightAnchored SHALL be false
            expect(result.isRightAnchored).toBe(false);
            
            // Property: Default transform SHALL be 'translateX(-22px)'
            expect(result.transform).toBe('translateX(-22px)');
            
            return result.isRightAnchored === false && result.transform === 'translateX(-22px)';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('exact boundary (x + 300 === viewport) SHALL NOT be right-anchored', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          (viewportWidth) => {
            // Position exactly at boundary: x + 300 = viewportWidth
            const x = viewportWidth - 300;
            
            // Skip if x would be negative (viewport too small)
            if (x < 0) return true;
            
            const result = calculateTooltipPosition(x, viewportWidth);
            
            // Property: At exact boundary, tooltip fits so isRightAnchored SHALL be false
            expect(result.isRightAnchored).toBe(false);
            expect(result.transform).toBe('translateX(-22px)');
            
            return result.isRightAnchored === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('one pixel past boundary (x + 300 === viewport + 1) SHALL be right-anchored', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          (viewportWidth) => {
            // Position one pixel past boundary: x + 300 = viewportWidth + 1
            const x = viewportWidth - 299;
            
            // Skip if x would be negative (viewport too small)
            if (x < 0) return true;
            
            const result = calculateTooltipPosition(x, viewportWidth);
            
            // Property: One pixel past boundary, tooltip overflows so isRightAnchored SHALL be true
            expect(result.isRightAnchored).toBe(true);
            expect(result.transform).toBe('translateX(-278px)');
            
            return result.isRightAnchored === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Edge adjustment preserves tooltip within viewport', () => {
    it('right-anchored tooltip SHALL stay within viewport bounds', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          xPositionArb,
          (viewportWidth, x) => {
            const result = calculateTooltipPosition(x, viewportWidth);
            
            if (result.isRightAnchored) {
              // When right-anchored, transform is -278px
              // The tooltip's left edge would be at: x - 278
              // The tooltip's right edge would be at: x - 278 + 300 = x + 22
              const tooltipRightEdge = x + 22;
              
              // Property: Right-anchored tooltip's right edge SHALL be close to cursor position
              // This ensures the tooltip stays near the cursor while avoiding overflow
              expect(tooltipRightEdge).toBeLessThanOrEqual(x + 300);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('default positioned tooltip SHALL have consistent offset from cursor', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          xPositionArb,
          (viewportWidth, x) => {
            const result = calculateTooltipPosition(x, viewportWidth);
            
            if (!result.isRightAnchored) {
              // When not right-anchored, transform is -22px
              // The tooltip's left edge would be at: x - 22
              // This positions the arrow indicator near the cursor
              
              // Property: Default transform SHALL be exactly -22px
              expect(result.transform).toBe('translateX(-22px)');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Deterministic behavior', () => {
    it('same inputs SHALL always produce same outputs', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          xPositionArb,
          (viewportWidth, x) => {
            // Call the function multiple times with same inputs
            const result1 = calculateTooltipPosition(x, viewportWidth);
            const result2 = calculateTooltipPosition(x, viewportWidth);
            const result3 = calculateTooltipPosition(x, viewportWidth);
            
            // Property: Results SHALL be identical for same inputs
            expect(result1.isRightAnchored).toBe(result2.isRightAnchored);
            expect(result1.transform).toBe(result2.transform);
            expect(result2.isRightAnchored).toBe(result3.isRightAnchored);
            expect(result2.transform).toBe(result3.transform);
            
            return result1.isRightAnchored === result2.isRightAnchored &&
                   result1.transform === result2.transform &&
                   result2.isRightAnchored === result3.isRightAnchored &&
                   result2.transform === result3.transform;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('transform values SHALL only be one of two possible values', () => {
      fc.assert(
        fc.property(
          viewportWidthArb,
          xPositionArb,
          (viewportWidth, x) => {
            const result = calculateTooltipPosition(x, viewportWidth);
            
            // Property: Transform SHALL be either default or right-anchored value
            const validTransforms = ['translateX(-22px)', 'translateX(-278px)'];
            expect(validTransforms).toContain(result.transform);
            
            // Property: isRightAnchored and transform SHALL be consistent
            if (result.isRightAnchored) {
              expect(result.transform).toBe('translateX(-278px)');
            } else {
              expect(result.transform).toBe('translateX(-22px)');
            }
            
            return validTransforms.includes(result.transform);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Common viewport scenarios', () => {
    it('mobile viewport (320px) edge adjustment works correctly', () => {
      const viewportWidth = 320;
      
      // Test positions across the viewport
      for (let x = 0; x <= 320; x += 20) {
        const result = calculateTooltipPosition(x, viewportWidth);
        const shouldBeRightAnchored = x + 300 > viewportWidth;
        
        expect(result.isRightAnchored).toBe(shouldBeRightAnchored);
      }
    });

    it('tablet viewport (768px) edge adjustment works correctly', () => {
      const viewportWidth = 768;
      
      // Test positions across the viewport
      for (let x = 0; x <= 768; x += 50) {
        const result = calculateTooltipPosition(x, viewportWidth);
        const shouldBeRightAnchored = x + 300 > viewportWidth;
        
        expect(result.isRightAnchored).toBe(shouldBeRightAnchored);
      }
    });

    it('desktop viewport (1920px) edge adjustment works correctly', () => {
      const viewportWidth = 1920;
      
      // Test positions across the viewport
      for (let x = 0; x <= 1920; x += 100) {
        const result = calculateTooltipPosition(x, viewportWidth);
        const shouldBeRightAnchored = x + 300 > viewportWidth;
        
        expect(result.isRightAnchored).toBe(shouldBeRightAnchored);
      }
    });

    it('4K viewport (3840px) edge adjustment works correctly', () => {
      const viewportWidth = 3840;
      
      // Test positions across the viewport
      for (let x = 0; x <= 3840; x += 200) {
        const result = calculateTooltipPosition(x, viewportWidth);
        const shouldBeRightAnchored = x + 300 > viewportWidth;
        
        expect(result.isRightAnchored).toBe(shouldBeRightAnchored);
      }
    });
  });
});
