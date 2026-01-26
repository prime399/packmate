import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Modal } from '@/components/common/Modal';

/**
 * Feature: modal-popup-selectors
 * Property 1: Modal Dismiss Behavior
 * 
 * **Validates: Requirements 1.2, 1.3**
 * 
 * Property Definition:
 * For any Modal instance that is open, clicking the backdrop OR pressing the Escape key
 * SHALL trigger the onClose callback and close the modal.
 */

// Arbitrary for generating modal content variations
const modalContentArbitrary = fc.record({
  title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
  maxWidth: fc.constantFrom('max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', undefined),
  className: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: undefined }),
  childrenText: fc.string({ minLength: 1, maxLength: 100 }),
});

// Arbitrary for dismiss action types
const dismissActionArbitrary = fc.constantFrom('backdrop-click', 'escape-key') as fc.Arbitrary<'backdrop-click' | 'escape-key'>;

describe('Modal - Property-Based Tests', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 1: Modal Dismiss Behavior
   * 
   * **Validates: Requirements 1.2, 1.3**
   */

  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Property 1: Modal Dismiss Behavior', () => {
    /**
     * Property: For any Modal instance that is open, clicking the backdrop OR pressing
     * the Escape key SHALL trigger the onClose callback and close the modal.
     * 
     * **Validates: Requirements 1.2, 1.3**
     */

    it('should trigger onClose when backdrop is clicked for any modal configuration', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (config) => {
            // Arrange
            const onClose = vi.fn();
            
            const { unmount } = render(
              <Modal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                maxWidth={config.maxWidth}
                className={config.className}
              >
                <div data-testid="modal-content">{config.childrenText}</div>
              </Modal>
            );

            // Act - Click on the backdrop (the outer element with role="presentation")
            const backdrop = document.querySelector('[role="presentation"]');
            expect(backdrop).not.toBeNull();
            
            if (backdrop) {
              fireEvent.click(backdrop);
            }

            // Assert - onClose should be called exactly once
            expect(onClose).toHaveBeenCalledTimes(1);

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger onClose when Escape key is pressed for any modal configuration', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (config) => {
            // Arrange
            const onClose = vi.fn();
            
            const { unmount } = render(
              <Modal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                maxWidth={config.maxWidth}
                className={config.className}
              >
                <div data-testid="modal-content">{config.childrenText}</div>
              </Modal>
            );

            // Act - Press Escape key
            fireEvent.keyDown(document, { key: 'Escape' });

            // Assert - onClose should be called exactly once
            expect(onClose).toHaveBeenCalledTimes(1);

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger onClose for any dismiss action (backdrop click or Escape key)', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          dismissActionArbitrary,
          (config, dismissAction) => {
            // Arrange
            const onClose = vi.fn();
            
            const { unmount } = render(
              <Modal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                maxWidth={config.maxWidth}
                className={config.className}
              >
                <div data-testid="modal-content">{config.childrenText}</div>
              </Modal>
            );

            // Act - Perform the dismiss action
            if (dismissAction === 'backdrop-click') {
              const backdrop = document.querySelector('[role="presentation"]');
              expect(backdrop).not.toBeNull();
              if (backdrop) {
                fireEvent.click(backdrop);
              }
            } else {
              fireEvent.keyDown(document, { key: 'Escape' });
            }

            // Assert - onClose should be called exactly once
            expect(onClose).toHaveBeenCalledTimes(1);

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT trigger onClose when clicking on modal content (not backdrop)', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          (config) => {
            // Arrange
            const onClose = vi.fn();
            
            const { unmount } = render(
              <Modal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                maxWidth={config.maxWidth}
                className={config.className}
              >
                <div data-testid="modal-content">{config.childrenText}</div>
              </Modal>
            );

            // Act - Click on the modal content (dialog element)
            const dialog = document.querySelector('[role="dialog"]');
            expect(dialog).not.toBeNull();
            
            if (dialog) {
              fireEvent.click(dialog);
            }

            // Assert - onClose should NOT be called
            expect(onClose).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT trigger onClose when modal is closed (isOpen=false)', () => {
      fc.assert(
        fc.property(
          modalContentArbitrary,
          dismissActionArbitrary,
          (config, dismissAction) => {
            // Arrange
            const onClose = vi.fn();
            
            const { unmount } = render(
              <Modal
                isOpen={false}
                onClose={onClose}
                title={config.title}
                maxWidth={config.maxWidth}
                className={config.className}
              >
                <div data-testid="modal-content">{config.childrenText}</div>
              </Modal>
            );

            // Act - Try to dismiss (should have no effect since modal is closed)
            if (dismissAction === 'backdrop-click') {
              const backdrop = document.querySelector('[role="presentation"]');
              // Backdrop should not exist when modal is closed
              if (backdrop) {
                fireEvent.click(backdrop);
              }
            } else {
              fireEvent.keyDown(document, { key: 'Escape' });
            }

            // Assert - onClose should NOT be called (modal is not open)
            expect(onClose).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT trigger onClose for non-Escape keys', () => {
      // Generate arbitrary non-Escape keys
      const nonEscapeKeyArbitrary = fc.string({ minLength: 1, maxLength: 10 })
        .filter(key => key !== 'Escape' && key !== 'Esc');

      fc.assert(
        fc.property(
          modalContentArbitrary,
          nonEscapeKeyArbitrary,
          (config, key) => {
            // Arrange
            const onClose = vi.fn();
            
            const { unmount } = render(
              <Modal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                maxWidth={config.maxWidth}
                className={config.className}
              >
                <div data-testid="modal-content">{config.childrenText}</div>
              </Modal>
            );

            // Act - Press a non-Escape key
            fireEvent.keyDown(document, { key });

            // Assert - onClose should NOT be called
            expect(onClose).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Modal - Unit Tests', () => {
  /**
   * Feature: modal-popup-selectors
   * 
   * **Validates: Requirements 1.2, 1.3**
   */

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Backdrop Click Dismiss (Requirement 1.2)', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal Content</div>
        </Modal>
      );

      const backdrop = document.querySelector('[role="presentation"]');
      expect(backdrop).not.toBeNull();
      
      fireEvent.click(backdrop!);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside modal content', () => {
      const onClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={onClose}>
          <button data-testid="inner-button">Click me</button>
        </Modal>
      );

      const innerButton = screen.getByTestId('inner-button');
      fireEvent.click(innerButton);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking on the dialog panel itself', () => {
      const onClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal Content</div>
        </Modal>
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      
      fireEvent.click(dialog!);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key Dismiss (Requirement 1.3)', () => {
    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when other keys are pressed', () => {
      const onClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not respond to Escape when modal is closed', () => {
      const onClose = vi.fn();
      
      render(
        <Modal isOpen={false} onClose={onClose}>
          <div>Modal Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Modal Rendering', () => {
    it('should render modal content when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div data-testid="modal-content">Test Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('should not render modal content when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()}>
          <div data-testid="modal-content">Test Content</div>
        </Modal>
      );

      expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
    });

    it('should render with title when provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Title">
          <div>Modal Content</div>
        </Modal>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should have correct ARIA attributes', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
          <div>Modal Content</div>
        </Modal>
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });
});
