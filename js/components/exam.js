/* ============================================
   EXAM — Exam mode + General Exam
   ============================================ */

import { getWeekById, getAllQuestions, getWeeks, Icons, shuffle, formatTime, difficultyClass, escapeHtml, checkMultiAnswer, getCorrectIndices, percent } from '../utils.js';
import { Storage } from '../storage.js';
import { Router } from '../router.js';
import { confetti, countUp } from '../animations.js';

let _examTimer = null;
let _examSeconds = 0;

/**
 * Render exam for a specific week.
 */
export function renderExam(container, weekId) {
  const week = getWeekById(weekId);
  if (!week) { container.innerHTML = '<p>Semana no encontrada.</p>'; return; }

  const questions = shuffle(week.preguntas || []);
  startExam(container, questions, `Examen — Semana ${week.id}`, week.id);
}

/**
 * Render general exam (20 random questions from all weeks).
 */
export function renderGeneralExam(container) {
  const allQ = getAllQuestions();
  const questions = shuffle(allQ).slice(0, 20);
  startExam(container, questions, 'Examen General', 'general');
}

/**
 * Start the exam.
 */
function startExam(container, questions, title, examId) {
  // Shuffle options for each question
  const examQuestions = questions.map(q => {
    const tipo = (q.tipo || '').toLowerCase();
    const isMulti = tipo.includes('varias respuestas');
    // Don't shuffle true/false
    const isTF = tipo.includes('verdadero') || tipo.includes('falso');

    let shuffledOptions, correctAnswer;
    if (isTF) {
      shuffledOptions = [...q.opciones];
      correctAnswer = q.respuestaCorrecta;
    } else if (isMulti) {
      shuffledOptions = shuffle(q.opciones);
      correctAnswer = q.respuestaCorrecta;
    } else {
      shuffledOptions = shuffle(q.opciones);
      correctAnswer = q.respuestaCorrecta;
    }

    return { ...q, shuffledOptions, originalCorrect: q.respuestaCorrecta };
  });

  let currentIdx = 0;
  const answers = new Array(questions.length).fill(null);
  _examSeconds = 0;

  // Timer
  if (_examTimer) clearInterval(_examTimer);
  _examTimer = setInterval(() => {
    _examSeconds++;
    const timerEl = document.getElementById('exam-timer-value');
    if (timerEl) timerEl.textContent = formatTime(_examSeconds);
  }, 1000);

  function render() {
    const q = examQuestions[currentIdx];
    const tipo = (q.tipo || '').toLowerCase();
    const isTF = tipo.includes('verdadero') || tipo.includes('falso');
    const isMulti = tipo.includes('varias respuestas');

    // Format question text
    let qText = escapeHtml(q.pregunta);
    qText = qText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    qText = qText.replace(/_{2,}/g, '<strong style="color:var(--accent);border-bottom:2px dashed var(--accent);padding:0 .25rem">________</strong>');

    container.innerHTML = `
      <div class="anim-fade-in">
        <div class="exam-header">
          <div>
            <h3 style="font-size:1rem;font-weight:700">${title}</h3>
            <span class="exam-progress-text">Pregunta ${currentIdx + 1} de ${examQuestions.length}</span>
          </div>
          <div class="exam-timer">
            ${Icons.timer}
            <span id="exam-timer-value">${formatTime(_examSeconds)}</span>
          </div>
          <div style="width:200px">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${percent(currentIdx + 1, examQuestions.length)}%"></div>
            </div>
          </div>
        </div>

        <div class="question-card">
          <div class="question-header">
            <div class="question-meta">
              <span class="question-counter">Pregunta ${currentIdx + 1}</span>
              <span class="badge ${difficultyClass(q.nivel)}">${q.nivel}</span>
              <span class="badge badge-info">${escapeHtml(q.tipo)}</span>
            </div>
            ${q.semana ? `<span style="font-size:.75rem;color:var(--text-tertiary)">Semana ${q.semana}</span>` : ''}
          </div>

          <div class="question-text">${qText}</div>

          <div id="exam-options-area"></div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.5rem;flex-wrap:wrap;gap:.75rem">
            <button class="btn btn-secondary btn-sm" id="btn-exam-prev" ${currentIdx === 0 ? 'disabled style="opacity:.4"' : ''}>
              ${Icons.arrowLeft} Anterior
            </button>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap">
              <!-- Question dots -->
              ${examQuestions.map((_, i) => `
                <span class="exam-dot" data-idx="${i}" style="width:10px;height:10px;border-radius:50%;background:${answers[i] !== null ? 'var(--accent)' : 'var(--border)'};cursor:pointer;transition:background .2s"></span>
              `).join('')}
            </div>
            ${currentIdx < examQuestions.length - 1 ? `
              <button class="btn btn-primary btn-sm" id="btn-exam-next">${Icons.arrowRight} Siguiente</button>
            ` : `
              <button class="btn btn-primary btn-sm" id="btn-exam-finish">${Icons.check} Finalizar</button>
            `}
          </div>
        </div>
      </div>
    `;

    // Render options
    const optArea = document.getElementById('exam-options-area');

    if (isTF) {
      renderExamTF(optArea, q, currentIdx, answers);
    } else if (isMulti) {
      renderExamMulti(optArea, q, currentIdx, answers);
    } else {
      renderExamSingle(optArea, q, currentIdx, answers);
    }

    // Navigation
    const prevBtn = document.getElementById('btn-exam-prev');
    if (prevBtn && currentIdx > 0) {
      prevBtn.addEventListener('click', () => { currentIdx--; render(); });
    }

    const nextBtn = document.getElementById('btn-exam-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { currentIdx++; render(); });
    }

    const finishBtn = document.getElementById('btn-exam-finish');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        const unanswered = answers.filter(a => a === null).length;
        if (unanswered > 0) {
          if (!confirm(`Tienes ${unanswered} pregunta(s) sin responder. ¿Deseas finalizar?`)) return;
        }
        finishExam(container, examQuestions, answers, title, examId);
      });
    }

    // Question dot navigation
    container.querySelectorAll('.exam-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        currentIdx = Number(dot.dataset.idx);
        render();
      });
    });
  }

  render();
}

function renderExamSingle(optArea, q, idx, answers) {
  const options = q.shuffledOptions || q.opciones;
  const currentAnswer = answers[idx];

  optArea.innerHTML = `
    <div class="options-list">
      ${options.map((opt, i) => `
        <button class="option-btn ${currentAnswer === i ? 'selected' : ''}" data-idx="${i}">
          <span class="option-indicator">${String.fromCharCode(65 + i)}</span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `).join('')}
    </div>
  `;

  optArea.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      answers[idx] = Number(btn.dataset.idx);
      optArea.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      // Update dot
      const dot = document.querySelector(`.exam-dot[data-idx="${idx}"]`);
      if (dot) dot.style.background = 'var(--accent)';
    });
  });
}

function renderExamTF(optArea, q, idx, answers) {
  const currentAnswer = answers[idx];

  optArea.innerHTML = `
    <div class="tf-grid">
      <button class="tf-btn true-btn ${currentAnswer === 'Verdadero' ? 'selected' : ''}" data-value="Verdadero">✓ Verdadero</button>
      <button class="tf-btn false-btn ${currentAnswer === 'Falso' ? 'selected' : ''}" data-value="Falso">✗ Falso</button>
    </div>
  `;

  optArea.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      answers[idx] = btn.dataset.value;
      optArea.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const dot = document.querySelector(`.exam-dot[data-idx="${idx}"]`);
      if (dot) dot.style.background = 'var(--accent)';
    });
  });
}

function renderExamMulti(optArea, q, idx, answers) {
  const options = q.shuffledOptions || q.opciones;
  const currentAnswer = answers[idx] || [];

  optArea.innerHTML = `
    <p style="font-size:.8rem;color:var(--text-tertiary);margin-bottom:.75rem;font-weight:500">Selecciona todas las correctas</p>
    <div class="options-list">
      ${options.map((opt, i) => `
        <button class="option-btn ${currentAnswer.includes(i) ? 'selected' : ''}" data-idx="${i}">
          <span class="option-checkbox">${currentAnswer.includes(i) ? '' : ''}</span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `).join('')}
    </div>
  `;

  optArea.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.idx);
      if (!Array.isArray(answers[idx])) answers[idx] = [];
      const pos = answers[idx].indexOf(i);
      if (pos !== -1) {
        answers[idx].splice(pos, 1);
        btn.classList.remove('selected');
      } else {
        answers[idx].push(i);
        btn.classList.add('selected');
      }
      const dot = document.querySelector(`.exam-dot[data-idx="${idx}"]`);
      if (dot) dot.style.background = answers[idx].length > 0 ? 'var(--accent)' : 'var(--border)';
    });
  });
}

/**
 * Finish exam and show results.
 */
function finishExam(container, examQuestions, answers, title, examId) {
  clearInterval(_examTimer);
  const totalTime = _examSeconds;
  Storage.addStudyTime(totalTime);

  let correct = 0;
  const results = examQuestions.map((q, i) => {
    const tipo = (q.tipo || '').toLowerCase();
    const isTF = tipo.includes('verdadero') || tipo.includes('falso');
    const isMulti = tipo.includes('varias respuestas');
    const options = q.shuffledOptions || q.opciones;

    let isCorrect = false;
    let userAnswerText = 'Sin respuesta';

    if (answers[i] === null) {
      isCorrect = false;
    } else if (isTF) {
      isCorrect = answers[i] === q.originalCorrect;
      userAnswerText = answers[i];
    } else if (isMulti) {
      isCorrect = checkMultiAnswer(answers[i] || [], q.originalCorrect, options);
      userAnswerText = (answers[i] || []).map(idx => options[idx]).join(', ');
    } else {
      userAnswerText = options[answers[i]];
      isCorrect = userAnswerText === q.originalCorrect;
    }

    if (isCorrect) correct++;

    return { question: q, isCorrect, userAnswerText };
  });

  const total = examQuestions.length;
  const pct = percent(correct, total);

  // Save result
  Storage.saveExamResult({
    weekId: examId,
    score: correct,
    total,
    percent: pct,
    time: totalTime,
  });

  // Render results
  container.innerHTML = `
    <div class="anim-scale-in">
      <div class="exam-results" style="margin-bottom:2rem">
        <div style="font-size:3rem;margin-bottom:.5rem">${pct >= 70 ? '🏆' : '📖'}</div>
        <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:.25rem">${title}</h2>
        <p style="color:var(--text-tertiary);font-size:.875rem;margin-bottom:1rem">Resultados del examen</p>

        <div class="results-score ${pct >= 70 ? 'pass' : 'fail'}" id="result-score">0</div>
        <div class="results-label">${pct >= 70 ? '¡Aprobado!' : 'Sigue practicando'}</div>

        <div class="results-stats">
          <div class="results-stat">
            <div class="results-stat-value" style="color:var(--color-success)">${correct}</div>
            <div class="results-stat-label">Correctas</div>
          </div>
          <div class="results-stat">
            <div class="results-stat-value" style="color:var(--color-error)">${total - correct}</div>
            <div class="results-stat-label">Incorrectas</div>
          </div>
          <div class="results-stat">
            <div class="results-stat-value">${formatTime(totalTime)}</div>
            <div class="results-stat-label">Tiempo</div>
          </div>
        </div>

        <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin-bottom:1rem">
          <button class="btn btn-secondary" id="btn-back-results">${Icons.arrowLeft} Volver</button>
          <button class="btn btn-primary" id="btn-retry-exam">${Icons.refresh} Intentar de nuevo</button>
        </div>
      </div>

      <div style="text-align:left">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem">📝 Revisión completa</h3>
        <div class="review-list">
          ${results.map((r, i) => `
            <div class="review-item ${r.isCorrect ? 'was-correct' : 'was-incorrect'}">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
                <span class="badge ${r.isCorrect ? 'badge-easy' : 'badge-hard'}">${r.isCorrect ? '✓' : '✗'}</span>
                <span style="font-size:.75rem;color:var(--text-tertiary)">Pregunta ${i + 1}</span>
                ${r.question.semana ? `<span class="badge badge-info">Sem. ${r.question.semana}</span>` : ''}
              </div>
              <div class="review-question">${escapeHtml(r.question.pregunta)}</div>
              <div class="review-answer">
                <p><span class="${r.isCorrect ? 'correct-label' : 'wrong-label'}">Tu respuesta:</span> ${escapeHtml(r.userAnswerText || 'Sin respuesta')}</p>
                ${!r.isCorrect ? `<p><span class="correct-label">Correcta:</span> ${escapeHtml(r.question.respuestaCorrecta)}</p>` : ''}
                <p style="margin-top:.375rem;color:var(--text-tertiary);font-size:.8rem">${escapeHtml(r.question.explicacion)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Animate score
  setTimeout(() => {
    const scoreEl = document.getElementById('result-score');
    if (scoreEl) countUp(scoreEl, pct, 1200);
    // Update text suffix
    setTimeout(() => { if (scoreEl) scoreEl.textContent = pct + '%'; }, 1300);
  }, 300);

  // Confetti for passing
  if (pct >= 70) {
    setTimeout(() => confetti(document.body), 500);
  }

  // Navigation
  document.getElementById('btn-back-results').addEventListener('click', () => {
    if (examId === 'general') Router.navigate('/dashboard');
    else Router.navigate(`/semana/${examId}`);
  });

  document.getElementById('btn-retry-exam').addEventListener('click', () => {
    if (examId === 'general') Router.navigate('/examen-general');
    else Router.navigate(`/examen/${examId}`);
    // Force re-render
    setTimeout(() => {
      if (examId === 'general') renderGeneralExam(container);
      else renderExam(container, examId);
    }, 50);
  });
}
