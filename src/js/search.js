// ============================================
// TTBar — Search Controller
// ============================================

/**
 * Debounce utility
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Simple fuzzy match scorer
 * Returns a score > 0 if query matches name, 0 otherwise.
 * Higher score = better match.
 *
 * @param {string} query - Lowercase search query
 * @param {string} name - Lowercase item name
 * @returns {number} Match score (0 = no match)
 */
function fuzzyScore(query, name) {
  if (!query) return 1;

  let score = 0;
  let queryIdx = 0;
  let prevMatchIdx = -2;
  let firstMatchIdx = -1;

  for (let i = 0; i < name.length && queryIdx < query.length; i++) {
    if (name[i] === query[queryIdx]) {
      if (firstMatchIdx === -1) firstMatchIdx = i;

      // Consecutive match bonus
      if (i === prevMatchIdx + 1) {
        score += 8;
      }
      // Word boundary bonus (start of word)
      if (i === 0 || name[i - 1] === ' ' || name[i - 1] === '-' || name[i - 1] === '_' || name[i - 1] === '.') {
        score += 10;
      }
      // Exact prefix bonus
      if (queryIdx === i) {
        score += 6;
      }

      score += 4; // Base match score
      prevMatchIdx = i;
      queryIdx++;
    }
  }

  // All query characters must match
  if (queryIdx < query.length) return 0;

  // Bonus for shorter names (more relevant)
  score += Math.max(0, 20 - name.length);

  // Penalty for late first match
  score -= firstMatchIdx * 2;

  return Math.max(score, 1);
}

/**
 * SearchController manages the search logic.
 * In demo mode, it uses mock data.
 * When Tauri is available, it uses IPC commands.
 */
export class SearchController {
  constructor() {
    this._tauriAvailable = false;
    this._listeners = [];

    // Check if Tauri API is available
    if (window.__TAURI__) {
      this._tauriAvailable = true;
    }
  }

  /**
   * Subscribe to search results
   * @param {Function} callback - Called with { results, query }
   * @returns {Function} Unsubscribe function
   */
  onResults(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  /**
   * Emit results to all listeners
   * @private
   */
  _emit(query, results) {
    this._listeners.forEach(cb => cb({ query, results }));
  }

  /**
   * Perform a search
   * @param {string} query - Raw query string
   */
  search = debounce(async (query) => {
    const trimmed = query.trim();

    if (!trimmed) {
      this._emit('', []);
      return;
    }

    if (this._tauriAvailable) {
      try {
        const { invoke } = window.__TAURI__.core;
        const results = await invoke('search', { query: trimmed });
        this._emit(trimmed, results);
      } catch (err) {
        console.error('Search IPC error:', err);
        this._emit(trimmed, []);
      }
    } else {
      // Demo mode — search mock data
      const results = this._searchMockData(trimmed);
      this._emit(trimmed, results);
    }
  }, 120);

  /**
   * Open a result item
   * @param {Object} item - The result item to open
   */
  async openResult(item) {
    if (this._tauriAvailable) {
      try {
        const { invoke } = window.__TAURI__.core;
        await invoke('open_result', { path: item.path });
      } catch (err) {
        console.error('Open result error:', err);
      }
    } else {
      console.log('Demo: Would open', item.path);
    }
  }

  /**
   * Search mock data for demo/development
   * @private
   */
  _searchMockData(query) {
    const mockApps = [
      { name: 'Google Chrome', path: 'C:\\Program Files\\Google\\Chrome\\chrome.exe', type: 'app' },
      { name: 'Visual Studio Code', path: 'C:\\Users\\Username\\AppData\\Local\\Programs\\VS Code\\code.exe', type: 'app' },
      { name: 'Firefox', path: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe', type: 'app' },
      { name: 'Spotify', path: 'C:\\Users\\Username\\AppData\\Roaming\\Spotify\\Spotify.exe', type: 'app' },
      { name: 'Discord', path: 'C:\\Users\\Username\\AppData\\Local\\Discord\\app.exe', type: 'app' },
      { name: 'Steam', path: 'C:\\Program Files (x86)\\Steam\\Steam.exe', type: 'app' },
      { name: 'Notepad++', path: 'C:\\Program Files\\Notepad++\\notepad++.exe', type: 'app' },
      { name: 'Windows Terminal', path: 'C:\\Program Files\\WindowsApps\\Terminal\\wt.exe', type: 'app' },
      { name: 'File Explorer', path: 'C:\\Windows\\explorer.exe', type: 'app' },
      { name: 'Task Manager', path: 'C:\\Windows\\System32\\Taskmgr.exe', type: 'app' },
      { name: 'Calculator', path: 'C:\\Windows\\System32\\calc.exe', type: 'app' },
      { name: 'Paint', path: 'C:\\Windows\\System32\\mspaint.exe', type: 'app' },
      { name: 'Word', path: 'C:\\Program Files\\Microsoft Office\\OFFICE16\\WINWORD.EXE', type: 'app' },
      { name: 'Excel', path: 'C:\\Program Files\\Microsoft Office\\OFFICE16\\EXCEL.EXE', type: 'app' },
      { name: 'PowerPoint', path: 'C:\\Program Files\\Microsoft Office\\OFFICE16\\POWERPNT.EXE', type: 'app' },
      { name: 'OBS Studio', path: 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe', type: 'app' },
      { name: 'Telegram', path: 'C:\\Users\\Username\\AppData\\Roaming\\Telegram\\Telegram.exe', type: 'app' },
      { name: 'Settings', path: 'ms-settings:', type: 'command' },
      { name: 'Control Panel', path: 'C:\\Windows\\System32\\control.exe', type: 'command' },
      { name: 'Downloads', path: 'C:\\Users\\Username\\Downloads', type: 'folder' },
      { name: 'Documents', path: 'C:\\Users\\Username\\Documents', type: 'folder' },
      { name: 'Desktop', path: 'C:\\Users\\Username\\Desktop', type: 'folder' },
      { name: 'Pictures', path: 'C:\\Users\\Username\\Pictures', type: 'folder' },
    ];

    const lowerQuery = query.toLowerCase();

    return mockApps
      .map(item => ({
        ...item,
        score: fuzzyScore(lowerQuery, item.name.toLowerCase())
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }
}
