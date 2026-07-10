/* ============================================
   SIDEBAR — Navigation component
   ============================================ */

import { getWeeks, Icons, percent } from '../utils.js';
import { Storage } from '../storage.js';
import { Router } from '../router.js';

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const weeks = getWeeks();

  const weeksHtml = weeks.map(w => {
    const prog = Storage.getWeekProgress(w.id);
    const total = (w.preguntas || []).length;
    const answered = Object.keys(prog.answered).length;
    const pct = percent(answered, total);

    return `
      <button class="sidebar-item" data-route="/semana/${w.id}" aria-label="Semana ${w.id}">
        <span class="sidebar-item-icon">${Icons.book}</span>
        <span>Semana ${w.id}</span>
        <span class="sidebar-item-progress">
          <span class="sidebar-item-progress-fill" style="width:${pct}%"></span>
        </span>
      </button>
    `;
  }).join('');

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">${Icons.target}</div>
        <div class="sidebar-brand-text">
          <h1>StudyApp DSI</h1>
          <span>Desarrollo de Sistemas</span>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">General</div>
      <button class="sidebar-item" data-route="/dashboard">
        <span class="sidebar-item-icon">${Icons.dashboard}</span>
        <span>Dashboard</span>
      </button>

      <div class="sidebar-section-label">Contenido</div>
      ${weeksHtml}

      <div class="sidebar-section-label">Evaluación</div>
      <button class="sidebar-item" data-route="/examen-general">
        <span class="sidebar-item-icon">${Icons.exam}</span>
        <span>Examen General</span>
        <span class="sidebar-item-badge">20</span>
      </button>

      <div class="sidebar-section-label">Herramientas</div>
      <button class="sidebar-item" data-route="/estadisticas">
        <span class="sidebar-item-icon">${Icons.stats}</span>
        <span>Estadísticas</span>
      </button>
      <button class="sidebar-item" data-route="/configuracion">
        <span class="sidebar-item-icon">${Icons.settings}</span>
        <span>Configuración</span>
      </button>
      <button class="sidebar-item" data-route="/acerca-de">
        <span class="sidebar-item-icon">${Icons.info}</span>
        <span>Acerca de</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      UCE · 6to Semestre · 2026
    </div>
  `;

  // Click handlers
  sidebar.querySelectorAll('.sidebar-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      Router.navigate(btn.dataset.route);
      closeMobileSidebar();
    });
  });
}

/**
 * Update active state in sidebar.
 */
export function updateSidebarActive(route) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
    const r = btn.dataset.route;
    if (!r) return;

    // Match exact or prefix for sub-routes
    const isActive = route === r ||
      (r.startsWith('/semana/') && route.startsWith(r)) ||
      (r === '/examen-general' && route.startsWith('/examen-general'));

    btn.classList.toggle('active', isActive);
  });

  // Also update week progress bars
  const weeks = getWeeks();
  weeks.forEach(w => {
    const btn = sidebar.querySelector(`[data-route="/semana/${w.id}"]`);
    if (!btn) return;
    const prog = Storage.getWeekProgress(w.id);
    const total = (w.preguntas || []).length;
    const answered = Object.keys(prog.answered).length;
    const pct = percent(answered, total);
    const fill = btn.querySelector('.sidebar-item-progress-fill');
    if (fill) fill.style.width = `${pct}%`;
  });
}

/**
 * Toggle mobile sidebar.
 */
export function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
}

export function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
}
