// ============================================
// TTBar — Main Application
// ============================================

import { SearchController } from './search.js';
import { KeyboardController } from './keyboard.js';
import { renderResults } from './results.js';

class TTBar {
  constructor() {
    // State
    this.results = [];
    this.selectedIndex = 0;
    this.currentQuery = '';
    this.isResultsVisible = false;

    // DOM Elements
    this.searchInput = document.getElementById('searchInput');
    this.resultsList = document.getElementById('resultsList');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.divider = document.getElementById('divider');
    this.statusBar = document.getElementById('statusBar');
    this.statusText = document.getElementById('statusText');
    this.launcherWindow = document.getElementById('launcherWindow');

    // Controllers
    this.searchController = new SearchController();
    this.keyboardController = new KeyboardController({
      onNavigate: (index) => this._setSelectedIndex(index),
      onSelect: (index) => this._openResult(index),
      onDismiss: () => this._dismiss(),
      getResultCount: () => this.results.length,
      getSelectedIndex: () => this.selectedIndex,
    });

    this._init();
  }

  /**
   * Initialize the app
   * @private
   */
  _init() {
    // Attach keyboard controller
    this.keyboardController.attach();

    // Search input handler
    this.searchInput.addEventListener('input', (e) => {
      this.currentQuery = e.target.value;
      this.searchController.search(this.currentQuery);
    });

    // Listen for search results
    this.searchController.onResults(({ query, results }) => {
      this.currentQuery = query;
      this.results = results;
      this.selectedIndex = results.length > 0 ? 0 : -1;
      this._renderResults();
    });

    // Click on result item
    this.resultsList.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.result-delete-btn');
      if (deleteBtn) {
        e.stopPropagation();
        const path = deleteBtn.dataset.path;
        const item = e.target.closest('.result-item');
        const index = parseInt(item.dataset.index, 10);
        this._deleteFile(index, path);
        return;
      }

      const item = e.target.closest('.result-item');
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        this._openResult(index);
      }
    });

    // Hover on result item
    this.resultsList.addEventListener('mousemove', (e) => {
      const item = e.target.closest('.result-item');
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        if (index !== this.selectedIndex) {
          this._setSelectedIndex(index);
        }
      }
    });

    // Window blur → dismiss (when clicking outside)
    window.addEventListener('blur', () => {
      this._dismiss();
    });

    // Focus input on window focus
    window.addEventListener('focus', () => {
      this.searchInput.focus();
      this.searchInput.select();
    });

    // Listen for Tauri show/hide events
    this._setupTauriListeners();

    // Auto-focus
    this.searchInput.focus();
  }

  /**
   * Setup Tauri-specific event listeners
   * @private
   */
  async _setupTauriListeners() {
    if (!window.__TAURI__) return;

    try {
      const { listen } = window.__TAURI__.event;

      // Listen for show event from backend
      await listen('tt-show', () => {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.results = [];
        this.selectedIndex = -1;
        this._renderResults();
        this.searchInput.focus();
      });

    } catch (err) {
      console.error('Tauri listener setup error:', err);
    }
  }

  /**
   * Render the results list
   * @private
   */
  _renderResults() {
    const hasResults = this.results.length > 0;
    const hasQuery = this.currentQuery.length > 0;

    // Update results HTML
    this.resultsList.innerHTML = renderResults(
      this.results,
      this.selectedIndex,
      this.currentQuery
    );

    // Toggle results visibility
    if (hasQuery) {
      this.resultsContainer.classList.add('expanded');
      this.divider.classList.add('visible');
      this.statusBar.classList.add('visible');
      this.isResultsVisible = true;
    } else {
      this.resultsContainer.classList.remove('expanded');
      this.divider.classList.remove('visible');
      this.statusBar.classList.remove('visible');
      this.isResultsVisible = false;
    }

    // Update status text
    if (hasResults) {
      this.statusText.textContent = `${this.results.length} sonuç`;
    } else if (hasQuery) {
      this.statusText.textContent = 'Sonuç bulunamadı';
    } else {
      this.statusText.textContent = '';
    }

    // Scroll selected into view
    this._scrollSelectedIntoView();

    // Dynamically resize Tauri window
    this._updateWindowSize();
  }

  /**
   * Update Tauri window size dynamically based on search results
   * @private
   */
  async _updateWindowSize() {
    if (!window.__TAURI__) return;

    try {
      const { getCurrentWindow, LogicalSize } = window.__TAURI__.window;
      const appWindow = getCurrentWindow();

      const hasQuery = this.currentQuery.trim().length > 0;
      let targetHeight = 72; // Default height for input bar only

      if (hasQuery) {
        // Calculate dynamic height based on results
        // 72px (input bar) + 1px (divider) + (results count * 52px) + 36px (status bar) + 12px (paddings/margins)
        const resultsCount = this.results.length;
        if (resultsCount > 0) {
          targetHeight = 72 + 1 + (resultsCount * 52) + 36 + 12;
        } else {
          // "No results" container height
          targetHeight = 72 + 1 + 80 + 36 + 12; 
        }
      }

      // Cap maximum height to 550px
      targetHeight = Math.min(targetHeight, 550);

      await appWindow.setSize(new LogicalSize(680, targetHeight));
    } catch (err) {
      console.error('Failed to resize window:', err);
    }
  }

  /**
   * Set selected index and re-render
   * @param {number} index
   * @private
   */
  _setSelectedIndex(index) {
    this.selectedIndex = index;

    // Update selection without full re-render (faster)
    const items = this.resultsList.querySelectorAll('.result-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    this._scrollSelectedIntoView();
  }

  /**
   * Scroll the selected item into view
   * @private
   */
  _scrollSelectedIntoView() {
    const selected = this.resultsList.querySelector('.result-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Open the result at the given index
   * @param {number} index
   * @private
   */
  _openResult(index) {
    const item = this.results[index];
    if (!item) return;

    this.searchController.openResult(item);

    // In Tauri, the backend will hide the window after opening
    // In demo mode, just log and reset
    if (!window.__TAURI__) {
      console.log(`Açılıyor: ${item.name} → ${item.path}`);
      this._dismiss();
    }
  }

  /**
   * Delete a file or directory from the filesystem
   * @param {number} index
   * @param {string} path
   * @private
   */
  async _deleteFile(index, path) {
    const item = this.results[index];
    if (!item) return;

    const confirmed = confirm(`"${item.name}" dosyasını kalıcı olarak silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    if (window.__TAURI__) {
      try {
        const { invoke } = window.__TAURI__.core;
        await invoke('delete_file', { path });

        // Remove from the UI list
        this.results.splice(index, 1);

        // Adjust index if out of bounds
        if (this.selectedIndex >= this.results.length) {
          this.selectedIndex = this.results.length - 1;
        }

        this._renderResults();
      } catch (err) {
        alert(`Silme işlemi başarısız: ${err}`);
      }
    } else {
      // Demo mode fallback
      this.results.splice(index, 1);
      this._renderResults();
      console.log('Demo Mode: Deleted file at', path);
    }
  }

  /**
   * Dismiss the launcher
   * @private
   */
  async _dismiss() {
    if (window.__TAURI__) {
      try {
        const { getCurrentWindow } = window.__TAURI__.window;
        await getCurrentWindow().hide();
      } catch (err) {
        console.error('Dismiss error:', err);
      }
    } else {
      // Demo mode: just clear and show a subtle animation
      this.launcherWindow.style.animation = 'windowOut 150ms cubic-bezier(0.4, 0, 1, 1) forwards';
      setTimeout(() => {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.results = [];
        this.selectedIndex = -1;
        this._renderResults();
        this.launcherWindow.style.animation = 'windowIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards';
      }, 200);
    }
  }
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  window.ttbar = new TTBar();
});
