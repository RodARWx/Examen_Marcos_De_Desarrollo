/* ============================================
   QUIZ — Study mode (one question at a time)
   ============================================ */

import { getWeekById, Icons, difficultyClass, shuffle, checkMultiAnswer, getCorrectIndices, escapeHtml } from '../utils.js';
import { Storage } from '../storage.js';
import { Router } from '../router.js';
import { transitionTo, pulse } from '../animations.js';

let _studyTimer = null;
let _studyStartTime = null;

export function renderWeekView(container, weekId) {
  const week = getWeekById(weekId);
  if (!week) { container.innerHTML = '<p>Semana no encontrada.</p>'; return; }

  const prog = Storage.getWeekProgress(week.id);
  const total = (week.preguntas || []).length;
  const answered = Object.keys(prog.answered).length;
  const correct = Object.values(prog.answered).filter(a => a.correct).length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Calculate level distribution
  const levels = {};
  (week.preguntas || []).forEach(q => {
    const l = q.nivel || 'Medio';
    levels[l] = (levels[l] || 0) + 1;
  });

  container.innerHTML = `
    <div class="anim-slide-up">
      <div class="week-hero">
        <div class="week-hero-label">Semana ${week.id}</div>
        <div class="week-hero-title">${escapeHtml(week.titulo)}</div>
        <div class="week-hero-stats">
          <span class="week-hero-stat">${Icons.list} ${total} preguntas</span>
          <span class="week-hero-stat">${Icons.check} ${correct} correctas</span>
          <span class="week-hero-stat">${Icons.target} ${pct}% completado</span>
        </div>
        <div class="week-actions">
          <button class="btn btn-start btn-lg" id="btn-study">
            ${Icons.play} Estudiar
          </button>
          <button class="btn btn-lg" id="btn-exam-week">
            ${Icons.exam} Examen
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">📖 Resumen</h3>
        <p style="font-size:.85rem;color:var(--text-secondary);line-height:1.7">${escapeHtml(week.resumen)}</p>
      </div>

      <!-- Keywords -->
      <div style="margin-bottom:1.5rem">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">🏷️ Palabras clave</h3>
        <div class="keywords-list">
          ${(week.palabrasClave || []).map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('')}
        </div>
      </div>

      <!-- Concepts -->
      <div style="margin-bottom:1.5rem">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">💡 Conceptos</h3>
        <div class="concepts-grid stagger-children">
          ${(week.conceptos || []).map(c => `
            <div class="concept-card">
              <div class="concept-name">${escapeHtml(c.nombre)}</div>
              <div class="concept-def">${escapeHtml(c.definicion)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Level distribution -->
      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">📊 Distribución por nivel</h3>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          ${Object.entries(levels).map(([level, count]) => `
            <span class="badge ${difficultyClass(level)}" style="font-size:.8rem;padding:.3rem .75rem">
              ${level}: ${count}
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-study').addEventListener('click', () => {
    startStudyMode(container, week);
  });

  document.getElementById('btn-exam-week').addEventListener('click', () => {
    Router.navigate(`/examen/${week.id}`);
  });
}

/**
 * Start study mode — show one question at a time.
 */
function startStudyMode(container, week) {
  const questions = [...(week.preguntas || [])];
  let currentIndex = 0;

  // Start timer
  _studyStartTime = Date.now();

  function showQuestion(idx) {
    if (idx >= questions.length) {
      finishStudy(container, week);
      return;
    }

    const q = questions[idx];
    currentIndex = idx;

    container.innerHTML = `
      <div class="anim-slide-up">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem">
          <button class="btn btn-secondary btn-sm" id="btn-back-week">
            ${Icons.arrowLeft} Volver a Semana ${week.id}
          </button>
          <div style="display:flex;align-items:center;gap:.75rem">
            <span style="font-size:.8rem;color:var(--text-tertiary);font-weight:600">Modo Estudio</span>
          </div>
        </div>
        <div class="question-card" id="question-container"></div>
      </div>
    `;

    document.getElementById('btn-back-week').addEventListener('click', () => {
      saveStudyTime();
      renderWeekView(container, week.id);
    });

    renderQuestion(document.getElementById('question-container'), q, idx, questions.length, week, () => {
      showQuestion(idx + 1);
    }, () => {
      showQuestion(idx); // retry
    });
  }

  showQuestion(0);
}

/**
 * Render a single question based on its type.
 */
function renderQuestion(qContainer, question, idx, total, week, onNext, onRetry) {
  const tipo = (question.tipo || '').toLowerCase();
  const isMultiSelect = tipo.includes('varias respuestas');
  const isTrueFalse = tipo.includes('verdadero') || tipo.includes('falso');
  const isComplete = tipo.includes('completar');
  const isRelacionar = tipo.includes('relacionar');
  const isOrdenar = tipo.includes('ordenar');
  const isCasoPractico = tipo.includes('caso');

  // Header
  let headerHtml = `
    <div class="question-header">
      <div class="question-meta">
        <span class="question-counter">Pregunta ${idx + 1}/${total}</span>
        <span class="badge ${difficultyClass(question.nivel)}">${question.nivel}</span>
        <span class="badge badge-info">${escapeHtml(question.tipo)}</span>
      </div>
    </div>
  `;

  // Format question text: replace ** and ________ for visual emphasis
  let qText = escapeHtml(question.pregunta);
  qText = qText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  qText = qText.replace(/_{2,}/g, '<strong style="color:var(--accent);border-bottom:2px dashed var(--accent);padding:0 .25rem">________</strong>');

  const questionTextHtml = `<div class="question-text">${qText}</div>`;

  let answered = false;

  if (isTrueFalse) {
    renderTrueFalse(qContainer, headerHtml, questionTextHtml, question, week, onNext, onRetry);
  } else if (isMultiSelect) {
    renderMultiSelect(qContainer, headerHtml, questionTextHtml, question, week, onNext, onRetry);
  } else {
    // Standard single-select (selección múltiple, completar, relacionar, ordenar, caso práctico)
    renderSingleSelect(qContainer, headerHtml, questionTextHtml, question, week, onNext, onRetry);
  }
}

/**
 * Single-select renderer.
 */
function renderSingleSelect(qContainer, headerHtml, questionTextHtml, q, week, onNext, onRetry) {
  const options = q.opciones || [];
  let answered = false;

  qContainer.innerHTML = `
    ${headerHtml}
    ${questionTextHtml}
    <div class="options-list" id="options-list">
      ${options.map((opt, i) => `
        <button class="option-btn" data-idx="${i}">
          <span class="option-indicator">${String.fromCharCode(65 + i)}</span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `).join('')}
    </div>
    <div id="feedback-area"></div>
    <div id="nav-buttons" style="display:none;margin-top:1.25rem;display:flex;gap:.75rem;justify-content:flex-end"></div>
  `;

  const navBtns = document.getElementById('nav-buttons');
  navBtns.style.display = 'none';

  qContainer.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const selectedIdx = Number(btn.dataset.idx);
      const selectedText = options[selectedIdx];
      const isCorrect = selectedText === q.respuestaCorrecta;

      // Mark all as disabled
      qContainer.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));

      // Show correct/incorrect
      btn.classList.add(isCorrect ? 'correct' : 'incorrect');
      if (!isCorrect) {
        const correctIdx = options.indexOf(q.respuestaCorrecta);
        if (correctIdx !== -1) {
          qContainer.querySelectorAll('.option-btn')[correctIdx].classList.add('correct');
        }
      }

      pulse(btn);
      Storage.saveAnswer(week.id, q.id, isCorrect);
      showFeedback(document.getElementById('feedback-area'), isCorrect, q);
      showNavButtons(navBtns, isCorrect, onNext, onRetry);
    });
  });
}

/**
 * True/False renderer.
 */
function renderTrueFalse(qContainer, headerHtml, questionTextHtml, q, week, onNext, onRetry) {
  let answered = false;

  qContainer.innerHTML = `
    ${headerHtml}
    ${questionTextHtml}
    <div class="tf-grid" id="tf-grid">
      <button class="tf-btn true-btn" data-value="Verdadero">✓ Verdadero</button>
      <button class="tf-btn false-btn" data-value="Falso">✗ Falso</button>
    </div>
    <div id="feedback-area"></div>
    <div id="nav-buttons" style="margin-top:1.25rem"></div>
  `;

  const navBtns = document.getElementById('nav-buttons');
  navBtns.style.display = 'none';

  qContainer.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const selected = btn.dataset.value;
      const isCorrect = selected === q.respuestaCorrecta;

      qContainer.querySelectorAll('.tf-btn').forEach(b => b.classList.add('disabled'));
      btn.classList.add('selected');
      btn.classList.add(isCorrect ? 'correct' : 'incorrect');

      if (!isCorrect) {
        const correctBtn = qContainer.querySelector(`.tf-btn[data-value="${q.respuestaCorrecta}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }

      pulse(btn);
      Storage.saveAnswer(week.id, q.id, isCorrect);
      showFeedback(document.getElementById('feedback-area'), isCorrect, q);
      showNavButtons(navBtns, isCorrect, onNext, onRetry);
    });
  });
}

/**
 * Multi-select (checkboxes) renderer.
 */
function renderMultiSelect(qContainer, headerHtml, questionTextHtml, q, week, onNext, onRetry) {
  const options = q.opciones || [];
  const selected = new Set();
  let answered = false;

  qContainer.innerHTML = `
    ${headerHtml}
    ${questionTextHtml}
    <p style="font-size:.8rem;color:var(--text-tertiary);margin-bottom:.75rem;font-weight:500">Selecciona todas las respuestas correctas</p>
    <div class="options-list" id="options-list">
      ${options.map((opt, i) => `
        <button class="option-btn" data-idx="${i}">
          <span class="option-checkbox"></span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `).join('')}
    </div>
    <button class="btn btn-primary" id="btn-confirm-multi" style="margin-top:1rem">Confirmar respuesta</button>
    <div id="feedback-area"></div>
    <div id="nav-buttons" style="margin-top:1.25rem"></div>
  `;

  const navBtns = document.getElementById('nav-buttons');
  navBtns.style.display = 'none';

  // Toggle selection
  qContainer.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      const idx = Number(btn.dataset.idx);
      if (selected.has(idx)) {
        selected.delete(idx);
        btn.classList.remove('selected');
      } else {
        selected.add(idx);
        btn.classList.add('selected');
      }
    });
  });

  // Confirm
  document.getElementById('btn-confirm-multi').addEventListener('click', () => {
    if (answered || selected.size === 0) return;
    answered = true;

    const isCorrect = checkMultiAnswer([...selected], q.respuestaCorrecta, options);
    const correctIndices = getCorrectIndices(q.respuestaCorrecta, options);

    document.getElementById('btn-confirm-multi').style.display = 'none';
    qContainer.querySelectorAll('.option-btn').forEach((btn, i) => {
      btn.classList.add('disabled');
      if (correctIndices.includes(i)) {
        btn.classList.add('correct');
      } else if (selected.has(i) && !correctIndices.includes(i)) {
        btn.classList.add('incorrect');
      }
    });

    Storage.saveAnswer(week.id, q.id, isCorrect);
    showFeedback(document.getElementById('feedback-area'), isCorrect, q);
    showNavButtons(navBtns, isCorrect, onNext, onRetry);
  });
}

/**
 * Show feedback panel.
 */
function showFeedback(area, isCorrect, q) {
  area.innerHTML = `
    <div class="feedback-panel ${isCorrect ? 'correct' : 'incorrect'}">
      <div class="feedback-title ${isCorrect ? 'correct' : 'incorrect'}">
        ${isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
      </div>
      <div class="feedback-body">
        <p><strong>Retroalimentación:</strong> ${escapeHtml(q.retroalimentacion)}</p>
        <p><strong>Explicación:</strong> ${escapeHtml(q.explicacion)}</p>
        ${!isCorrect ? `<p><strong>Respuesta correcta:</strong> ${escapeHtml(q.respuestaCorrecta)}</p>` : ''}
        <div class="feedback-concept">📌 ${escapeHtml(q.conceptoRelacionado)}</div>
      </div>
    </div>
  `;
}

/**
 * Show navigation buttons.
 */
function showNavButtons(navBtns, isCorrect, onNext, onRetry) {
  navBtns.style.display = 'flex';
  navBtns.innerHTML = `
    ${!isCorrect ? `<button class="btn btn-outline" id="btn-retry">${Icons.refresh} Reintentar</button>` : ''}
    <button class="btn btn-primary" id="btn-next">${Icons.arrowRight} Siguiente</button>
  `;

  document.getElementById('btn-next').addEventListener('click', onNext);
  const retryBtn = document.getElementById('btn-retry');
  if (retryBtn) retryBtn.addEventListener('click', onRetry);
}

/**
 * Finish study session.
 */
function finishStudy(container, week) {
  saveStudyTime();
  Storage.markWeekComplete(week.id);

  const prog = Storage.getWeekProgress(week.id);
  const total = (week.preguntas || []).length;
  const correct = Object.values(prog.answered).filter(a => a.correct).length;
  const pct = Math.round((correct / total) * 100);

  container.innerHTML = `
    <div class="anim-scale-in" style="text-align:center;max-width:500px;margin:3rem auto">
      <div style="font-size:3.5rem;margin-bottom:1rem">${pct >= 70 ? '🎉' : '📚'}</div>
      <h2 style="font-size:1.75rem;font-weight:800;margin-bottom:.5rem">¡Estudio completado!</h2>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem">Semana ${week.id} — ${escapeHtml(week.titulo)}</p>
      <div class="results-score ${pct >= 70 ? 'pass' : 'fail'}">${pct}%</div>
      <div class="results-stats" style="margin:1.5rem 0">
        <div class="results-stat">
          <div class="results-stat-value" style="color:var(--color-success)">${correct}</div>
          <div class="results-stat-label">Correctas</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value" style="color:var(--color-error)">${total - correct}</div>
          <div class="results-stat-label">Incorrectas</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value">${total}</div>
          <div class="results-stat-label">Total</div>
        </div>
      </div>
      <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-secondary" id="btn-back-overview">${Icons.arrowLeft} Volver</button>
        <button class="btn btn-primary" id="btn-exam-after">${Icons.exam} Hacer examen</button>
      </div>
    </div>
  `;

  document.getElementById('btn-back-overview').addEventListener('click', () => {
    renderWeekView(container, week.id);
  });

  document.getElementById('btn-exam-after').addEventListener('click', () => {
    Router.navigate(`/examen/${week.id}`);
  });
}

function saveStudyTime() {
  if (_studyStartTime) {
    const elapsed = Math.floor((Date.now() - _studyStartTime) / 1000);
    Storage.addStudyTime(elapsed);
    _studyStartTime = null;
  }
}
