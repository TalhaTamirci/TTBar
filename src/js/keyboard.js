// ============================================
// TTBar — Keyboard Navigation Controller
// ============================================

/**
 * Manages keyboard navigation within the results list.
 * Handles arrow keys, Enter, Escape, and Tab.
 */
export class KeyboardController {
  /**
   * @param {Object} options
   * @param {Function} options.onNavigate - Called with new index when up/down pressed
   * @param {Function} options.onSelect - Called with selected index when Enter pressed
   * @param {Function} options.onDismiss - Called when Escape pressed
   * @param {Function} options.getResultCount - Returns current number of results
   * @param {Function} options.getSelectedIndex - Returns current selected index
   */
  constructor({ onNavigate, onSelect, onDismiss, getResultCount, getSelectedIndex }) {
    this.onNavigate = onNavigate;
    this.onSelect = onSelect;
    this.onDismiss = onDismiss;
    this.getResultCount = getResultCount;
    this.getSelectedIndex = getSelectedIndex;

    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * Start listening for keyboard events
   */
  attach() {
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Stop listening for keyboard events
   */
  detach() {
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e
   * @private
   */
  _handleKeyDown(e) {
    const count = this.getResultCount();
    const current = this.getSelectedIndex();

    switch (e.key) {
      case 'ArrowDown':
      case 'Tab': {
        if (e.key === 'Tab' && e.shiftKey) {
          // Shift+Tab goes up
          e.preventDefault();
          if (count > 0) {
            const next = current <= 0 ? count - 1 : current - 1;
            this.onNavigate(next);
          }
          break;
        }
        e.preventDefault();
        if (count > 0) {
          const next = current >= count - 1 ? 0 : current + 1;
          this.onNavigate(next);
        }
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        if (count > 0) {
          const prev = current <= 0 ? count - 1 : current - 1;
          this.onNavigate(prev);
        }
        break;
      }

      case 'Enter': {
        e.preventDefault();
        if (count > 0 && current >= 0) {
          this.onSelect(current);
        }
        break;
      }

      case 'Escape': {
        e.preventDefault();
        this.onDismiss();
        break;
      }
    }
  }
}
