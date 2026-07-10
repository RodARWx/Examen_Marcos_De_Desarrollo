/* ============================================
   UTILS — Data loading, helpers, formatting
   ============================================ */

let _allWeeks = null;

/**
 * Load and merge both JSON data files.
 * Works with fetch (local server) and also handles file:// protocol fallback.
 */
export async function loadData() {
  if (_allWeeks) return _allWeeks;

  const files = [
    'data/desarrollo_sistemas_parte_1.json',
    'data/desarrollo_sistemas_parte_2.json',
  ];

  const results = await Promise.all(
    files.map(f => fetch(f).then(r => {
      if (!r.ok) throw new Error(`Failed to load ${f}`);
      return r.json();
    }))
  );

  _allWeeks = [];
  for (const json of results) {
    if (json.semanas && Array.isArray(json.semanas)) {
      _allWeeks.push(...json.semanas);
    }
  }

  // Sort by id
  _allWeeks.sort((a, b) => a.id - b.id);
  return _allWeeks;
}

/**
 * Get all weeks (must call loadData first).
 */
export function getWeeks() {
  return _allWeeks || [];
}

/**
 * Get a single week by id.
 */
export function getWeekById(id) {
  return (_allWeeks || []).find(w => w.id === Number(id));
}

/**
 * Get all questions from all weeks.
 */
export function getAllQuestions() {
  return (_allWeeks || []).flatMap(w => w.preguntas || []);
}

/**
 * Fisher-Yates shuffle (returns new array).
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Format seconds to MM:SS or HH:MM:SS.
 */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

/**
 * Format seconds into human-readable "Xh Ym".
 */
export function formatTimeHuman(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

/**
 * Difficulty badge class.
 */
export function difficultyClass(nivel) {
  const n = (nivel || '').toLowerCase();
  if (n.includes('fácil') || n.includes('facil')) return 'badge-easy';
  if (n.includes('medio')) return 'badge-medium';
  if (n.includes('difícil') || n.includes('dificil')) return 'badge-hard';
  return 'badge-info';
}

/**
 * Calculate percentage.
 */
export function percent(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Check if a multi-answer is correct.
 * The JSON stores multi-answers as a comma-separated string in respuestaCorrecta.
 * We match selected options against correct ones.
 */
export function checkMultiAnswer(selectedOptions, correctAnswer, allOptions) {
  // Parse correct answer string to figure out which options are correct
  const correctLower = correctAnswer.toLowerCase();
  const correctIndices = [];

  for (let i = 0; i < allOptions.length; i++) {
    const opt = allOptions[i].toLowerCase();
    // Check if the option text (or a substantial part) appears in the correctAnswer
    // Strategy: check multiple words from each option
    const words = opt.split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => correctLower.includes(w)).length;
    if (words.length > 0 && matchCount / words.length > 0.5) {
      correctIndices.push(i);
    }
  }

  // If no match found, fallback: try finding options that have keywords from correctAnswer
  if (correctIndices.length === 0) {
    for (let i = 0; i < allOptions.length; i++) {
      if (correctLower.includes(allOptions[i].substring(0, 20).toLowerCase())) {
        correctIndices.push(i);
      }
    }
  }

  // Compare selected vs correct
  if (selectedOptions.length !== correctIndices.length) return false;
  const sortedSel = [...selectedOptions].sort();
  const sortedCorr = [...correctIndices].sort();
  return sortedSel.every((v, i) => v === sortedCorr[i]);
}

/**
 * Get correct indices for a multi-answer question.
 */
export function getCorrectIndices(correctAnswer, allOptions) {
  const correctLower = correctAnswer.toLowerCase();
  const correctIndices = [];

  for (let i = 0; i < allOptions.length; i++) {
    const opt = allOptions[i].toLowerCase();
    const words = opt.split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => correctLower.includes(w)).length;
    if (words.length > 0 && matchCount / words.length > 0.5) {
      correctIndices.push(i);
    }
  }

  if (correctIndices.length === 0) {
    for (let i = 0; i < allOptions.length; i++) {
      if (correctLower.includes(allOptions[i].substring(0, 20).toLowerCase())) {
        correctIndices.push(i);
      }
    }
  }

  return correctIndices;
}

/**
 * Simple relative date (e.g. "Hace 2 horas").
 */
export function relativeDate(iso) {
  if (!iso) return 'Nunca';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHr < 24) return `Hace ${diffHr}h`;
  if (diffDay === 1) return 'Ayer';
  if (diffDay < 7) return `Hace ${diffDay} días`;
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

/**
 * SVG icon helper — inline SVG icons.
 */
export const Icons = {
  dashboard: `<svg viewBox="0 0 24 24"><path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm0 8h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm10 0h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zm0-18v4a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1z"/></svg>`,
  book: `<svg viewBox="0 0 24 24"><path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 12h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>`,
  exam: `<svg viewBox="0 0 24 24"><path d="M9 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-3V3a1 1 0 00-2 0v1h-4V3a1 1 0 00-1-1zM5 8h14v12H5V8zm2 3h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2z"/></svg>`,
  stats: `<svg viewBox="0 0 24 24"><path d="M18 20V10h-2v10h2zm-6 0V4h-2v16h2zM6 20v-6H4v6h2z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.49.49 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.23.41.47.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>`,
  info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`,
  timer: `<svg viewBox="0 0 24 24"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`,
  fire: `<svg viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,
  target: `<svg viewBox="0 0 24 24"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>`,
  list: `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
};

/**
 * Escape HTML to prevent XSS.
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
