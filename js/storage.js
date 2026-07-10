/* ============================================
   STORAGE — LocalStorage persistence layer
   ============================================ */

const STORAGE_KEY = 'dsi_study_app';

const DEFAULT_STATE = {
  version: 2,
  config: {
    theme: 'light',
    accentH: 252,
    animations: true,
  },
  progress: {},       // { weekId: { answered: {qId: {correct:bool, attempts:int}}, completed:bool } }
  examResults: [],     // [{ date, weekId|'general', score, total, percent, time, answers }]
  stats: {
    totalCorrect: 0,
    totalIncorrect: 0,
    totalAnswered: 0,
    timeStudied: 0,    // seconds
    streak: 0,
    bestStreak: 0,
  },
  lastSession: null,   // ISO date string
};

export const Storage = {
  _data: null,

  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._data = JSON.parse(raw);
        // Version migration
        if (!this._data.version || this._data.version < DEFAULT_STATE.version) {
          this._data = { ...DEFAULT_STATE, ...this._data, version: DEFAULT_STATE.version };
          this._save();
        }
      } catch {
        this._data = structuredClone(DEFAULT_STATE);
        this._save();
      }
    } else {
      this._data = structuredClone(DEFAULT_STATE);
      this._save();
    }
    this._data.lastSession = new Date().toISOString();
    this._save();
  },

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  },

  /* ---- Config ---- */
  getConfig() { return this._data.config; },

  setConfig(key, value) {
    this._data.config[key] = value;
    this._save();
  },

  /* ---- Progress ---- */
  getWeekProgress(weekId) {
    return this._data.progress[weekId] || { answered: {}, completed: false };
  },

  saveAnswer(weekId, questionId, isCorrect) {
    if (!this._data.progress[weekId]) {
      this._data.progress[weekId] = { answered: {}, completed: false };
    }
    const prev = this._data.progress[weekId].answered[questionId];
    const attempts = prev ? prev.attempts + 1 : 1;
    this._data.progress[weekId].answered[questionId] = { correct: isCorrect, attempts };

    // Update stats
    if (!prev) {
      this._data.stats.totalAnswered++;
      if (isCorrect) {
        this._data.stats.totalCorrect++;
        this._data.stats.streak++;
        if (this._data.stats.streak > this._data.stats.bestStreak) {
          this._data.stats.bestStreak = this._data.stats.streak;
        }
      } else {
        this._data.stats.totalIncorrect++;
        this._data.stats.streak = 0;
      }
    } else {
      // Re-answer: update correctness
      if (isCorrect && !prev.correct) {
        this._data.stats.totalCorrect++;
        this._data.stats.totalIncorrect--;
        this._data.stats.streak++;
        if (this._data.stats.streak > this._data.stats.bestStreak) {
          this._data.stats.bestStreak = this._data.stats.streak;
        }
      } else if (!isCorrect && prev.correct) {
        this._data.stats.totalCorrect--;
        this._data.stats.totalIncorrect++;
        this._data.stats.streak = 0;
      } else if (!isCorrect) {
        this._data.stats.streak = 0;
      }
    }

    this._save();
  },

  markWeekComplete(weekId) {
    if (!this._data.progress[weekId]) {
      this._data.progress[weekId] = { answered: {}, completed: false };
    }
    this._data.progress[weekId].completed = true;
    this._save();
  },

  /* ---- Exams ---- */
  saveExamResult(result) {
    this._data.examResults.push({
      ...result,
      date: new Date().toISOString(),
    });
    this._save();
  },

  getExamResults(weekId) {
    if (weekId === undefined) return this._data.examResults;
    return this._data.examResults.filter(e => e.weekId === weekId);
  },

  /* ---- Stats ---- */
  getStats() { return this._data.stats; },

  addStudyTime(seconds) {
    this._data.stats.timeStudied += seconds;
    this._save();
  },

  getLastSession() { return this._data.lastSession; },

  getAllProgress() { return this._data.progress; },

  /* ---- Reset ---- */
  resetAll() {
    this._data = structuredClone(DEFAULT_STATE);
    this._data.lastSession = new Date().toISOString();
    this._save();
  },
};
