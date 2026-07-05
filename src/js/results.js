// ============================================
// TTBar — Results Renderer
// ============================================

/**
 * SVG icons for different result types (Retro 2008 / Windows Explorer Style)
 */
const ICONS = {
  app: `<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1.5" fill="#fcfcfc" stroke="#4a6ea5" stroke-width="1.5"/><rect x="3" y="3" width="14" height="4.5" fill="#4a6ea5"/><circle cx="5" cy="5.25" r="0.75" fill="#ffffff"/><circle cx="7.5" cy="5.25" r="0.75" fill="#ffffff"/><path d="M7 11.5l2 2 4.5-4.5" stroke="#4caf50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  file: `<svg viewBox="0 0 20 20" fill="none"><path d="M4 2.5h7.5L16 7v10.5H4V2.5Z" fill="#ffffff" stroke="#7f9db9" stroke-width="1.5"/><path d="M11 2.5V7h5" stroke="#7f9db9" stroke-width="1.5" fill="none"/><path d="M6 10h8M6 13h5" stroke="#b0b0b0" stroke-width="1.5"/></svg>`,
  folder: `<svg viewBox="0 0 20 20" fill="none"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h4.5l1.5 2H16.5A1.5 1.5 0 0 1 18 6.5v10A1.5 1.5 0 0 1 16.5 18H3.5A1.5 1.5 0 0 1 2 16.5v-12Z" fill="#ffe082" stroke="#f5b041" stroke-width="1.5"/></svg>`,
  command: `<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="15" height="15" rx="1" fill="#111111" stroke="#808080" stroke-width="1.5"/><path d="M5.5 6.5l3 3.5-3 3.5M9.5 13.5h5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  search: `<svg viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5" stroke="#4a6ea5" stroke-width="1.5"/><path d="M12 12l5 5" stroke="#4a6ea5" stroke-width="2" stroke-linecap="round"/></svg>`
};

/**
 * Type labels in Turkish
 */
const TYPE_LABELS = {
  app: 'Uygulama',
  file: 'Dosya',
  folder: 'Klasör',
  command: 'Komut'
};

/**
 * Highlight matching characters in a result name
 * @param {string} name - The result name
 * @param {string} query - The search query
 * @returns {string} HTML with highlighted matches
 */
export function highlightMatch(name, query) {
  if (!query) return escapeHtml(name);

  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let result = '';
  let queryIdx = 0;

  for (let i = 0; i < name.length; i++) {
    if (queryIdx < lowerQuery.length && lowerName[i] === lowerQuery[queryIdx]) {
      result += `<span class="highlight">${escapeHtml(name[i])}</span>`;
      queryIdx++;
    } else {
      result += escapeHtml(name[i]);
    }
  }

  return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}

/**
 * Render a single result item
 * @param {Object} item - Result item { name, path, type, score }
 * @param {number} index - Item index
 * @param {boolean} isSelected - Whether this item is selected
 * @param {string} query - Current search query
 * @returns {string} HTML string
 */
export function renderResultItem(item, index, isSelected, query) {
  const icon = ICONS[item.type] || ICONS.file;
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  const highlightedName = highlightMatch(item.name, query);
  const delay = Math.min(index * 30, 150);

  const showDelete = item.type === 'file' || item.type === 'folder';
  const deleteBtn = showDelete
    ? `<button class="result-delete-btn" title="Kalıcı Olarak Sil" data-path="${escapeHtml(item.path)}">✕</button>`
    : '';

  return `
    <li class="result-item ${isSelected ? 'selected' : ''}"
        data-index="${index}"
        style="animation-delay: ${delay}ms">
      <div class="result-icon-wrapper">
        <div class="result-icon">${icon}</div>
      </div>
      <div class="result-info">
        <div class="result-name">${highlightedName}</div>
        <div class="result-path">${escapeHtml(item.path || '')}</div>
      </div>
      <span class="result-type">${typeLabel}</span>
      ${deleteBtn}
      <div class="result-action">
        <span class="action-key">↵</span>
      </div>
    </li>
  `;
}

/**
 * Render the "no results" state
 * @param {string} query - The search query that had no results
 * @returns {string} HTML string
 */
export function renderNoResults(query) {
  return `
    <div class="no-results">
      <svg class="no-results-icon" viewBox="0 0 20 20" fill="none" style="width: 40px; height: 40px;">
        <path d="M10 2l8 15H2L10 2Z" fill="#ffe082" stroke="#f57c00" stroke-width="1.5"/>
        <path d="M10 6v6" stroke="#f57c00" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="10" cy="15" r="1.25" fill="#f57c00"/>
      </svg>
      <div class="no-results-text">"${escapeHtml(query)}" için sonuç bulunamadı</div>
    </div>
  `;
}

/**
 * Render the complete results list
 * @param {Array} results - Array of result items
 * @param {number} selectedIndex - Currently selected index
 * @param {string} query - Current search query
 * @returns {string} HTML string
 */
export function renderResults(results, selectedIndex, query) {
  if (results.length === 0 && query) {
    return renderNoResults(query);
  }

  return results
    .map((item, i) => renderResultItem(item, i, i === selectedIndex, query))
    .join('');
}
