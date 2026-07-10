/* ============================================
   DASHBOARD — Main overview panel
   ============================================ */

import { getWeeks, getAllQuestions, Icons, percent, formatTimeHuman, relativeDate, difficultyClass } from '../utils.js';
import { Storage } from '../storage.js';
import { Router } from '../router.js';
import { animateProgressBar, countUp } from '../animations.js';

export function renderDashboard(container) {
  const weeks = getWeeks();
  const allQ = getAllQuestions();
  const stats = Storage.getStats();
  const lastSession = Storage.getLastSession();

  const totalQuestions = allQ.length;
  const totalWeeks = weeks.length;

  // Calculate overall progress
  let totalAnswered = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let weeksCompleted = 0;
  const weeksPending = [];

  weeks.forEach(w => {
    const prog = Storage.getWeekProgress(w.id);
    const answered = Object.keys(prog.answered).length;
    totalAnswered += answered;
    Object.values(prog.answered).forEach(a => {
      if (a.correct) totalCorrect++;
      else totalIncorrect++;
    });
    if (prog.completed || answered >= (w.preguntas || []).length) {
      weeksCompleted++;
    } else {
      weeksPending.push(w);
    }
  });

  const overallPercent = percent(totalAnswered, totalQuestions);
  const avgPercent = totalAnswered > 0 ? percent(totalCorrect, totalAnswered) : 0;

  container.innerHTML = `
    <div class="page-header anim-slide-up">
      <h2>Dashboard</h2>
      <p>Desarrollo de Sistemas de Información — Vista general</p>
    </div>

    <!-- Hero stats -->
    <div class="card card-accent anim-slide-up" style="margin-bottom:1.5rem;padding:2rem">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
        <div>
          <div style="font-size:.8rem;font-weight:600;opacity:.85;margin-bottom:.25rem">Progreso General</div>
          <div style="font-size:2.5rem;font-weight:900;line-height:1" id="dash-overall-pct">0</div>
          <div style="font-size:.8rem;opacity:.75;margin-top:.25rem">${totalAnswered} de ${totalQuestions} preguntas respondidas</div>
        </div>
        <div style="width:200px">
          <div class="progress-bar progress-lg" style="background:rgba(255,255,255,.2)">
            <div class="progress-fill" id="dash-progress-fill" style="width:0%;background:rgba(255,255,255,.9)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-grid stagger-children" style="margin-bottom:2rem">
      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--accent-soft)">${Icons.book}</div>
          <span class="stat-card-label">Temas</span>
        </div>
        <div class="stat-card-value">${totalWeeks}</div>
        <div class="stat-card-sub">Semanas disponibles</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-success-soft);color:var(--color-success)">${Icons.check}</div>
          <span class="stat-card-label">Correctas</span>
        </div>
        <div class="stat-card-value" style="color:var(--color-success)" id="dash-correct">0</div>
        <div class="stat-card-sub">respuestas correctas</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-error-soft);color:var(--color-error)">${Icons.close}</div>
          <span class="stat-card-label">Incorrectas</span>
        </div>
        <div class="stat-card-value" style="color:var(--color-error)" id="dash-incorrect">0</div>
        <div class="stat-card-sub">respuestas incorrectas</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-warning-soft);color:var(--color-warning)">${Icons.star}</div>
          <span class="stat-card-label">Promedio</span>
        </div>
        <div class="stat-card-value">${avgPercent}%</div>
        <div class="stat-card-sub">de aciertos</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--accent-soft)">${Icons.clock}</div>
          <span class="stat-card-label">Tiempo</span>
        </div>
        <div class="stat-card-value">${formatTimeHuman(stats.timeStudied)}</div>
        <div class="stat-card-sub">tiempo estudiado</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-warning-soft);color:var(--color-warning)">${Icons.fire}</div>
          <span class="stat-card-label">Racha</span>
        </div>
        <div class="stat-card-value">${stats.streak}</div>
        <div class="stat-card-sub">mejor: ${stats.bestStreak}</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-success-soft);color:var(--color-success)">${Icons.trophy}</div>
          <span class="stat-card-label">Completados</span>
        </div>
        <div class="stat-card-value">${weeksCompleted}/${totalWeeks}</div>
        <div class="stat-card-sub">temas completados</div>
      </div>

      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--accent-soft)">${Icons.timer}</div>
          <span class="stat-card-label">Última sesión</span>
        </div>
        <div class="stat-card-value" style="font-size:1rem">${relativeDate(lastSession)}</div>
        <div class="stat-card-sub">&nbsp;</div>
      </div>
    </div>

    <!-- Pending weeks -->
    ${weeksPending.length > 0 ? `
      <div class="page-header" style="margin-bottom:1rem">
        <h2 style="font-size:1.1rem">Continúa estudiando</h2>
        <p>Temas pendientes por completar</p>
      </div>
      <div class="concepts-grid stagger-children" id="pending-weeks"></div>
    ` : `
      <div class="card" style="text-align:center;padding:2rem">
        <div style="font-size:2rem;margin-bottom:.5rem">🎉</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.25rem">¡Felicidades!</h3>
        <p style="color:var(--text-tertiary);font-size:.875rem">Has estudiado todas las semanas</p>
      </div>
    `}
  `;

  // Animate numbers
  setTimeout(() => {
    countUp(document.getElementById('dash-overall-pct'), overallPercent);
    countUp(document.getElementById('dash-correct'), totalCorrect);
    countUp(document.getElementById('dash-incorrect'), totalIncorrect);
    animateProgressBar(document.getElementById('dash-progress-fill'), overallPercent);
  }, 200);

  // Render pending weeks
  const pendingGrid = document.getElementById('pending-weeks');
  if (pendingGrid) {
    pendingGrid.innerHTML = weeksPending.slice(0, 6).map(w => {
      const prog = Storage.getWeekProgress(w.id);
      const total = (w.preguntas || []).length;
      const answered = Object.keys(prog.answered).length;
      const pct = percent(answered, total);

      return `
        <div class="card concept-card" style="cursor:pointer" data-goto="/semana/${w.id}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
            <span class="badge badge-info">Semana ${w.id}</span>
            <span style="font-size:.75rem;color:var(--text-tertiary);font-weight:600">${pct}%</span>
          </div>
          <div class="concept-name" style="font-size:.9rem;margin-bottom:.375rem">${w.titulo}</div>
          <div class="progress-bar" style="margin-top:.5rem">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div style="font-size:.7rem;color:var(--text-tertiary);margin-top:.375rem">${answered}/${total} preguntas</div>
        </div>
      `;
    }).join('');

    pendingGrid.querySelectorAll('[data-goto]').forEach(card => {
      card.addEventListener('click', () => Router.navigate(card.dataset.goto));
    });
  }
}
