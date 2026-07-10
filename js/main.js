/* ============================================
   MAIN — App entry point and orchestrator
   ============================================ */

import { loadData } from './utils.js';
import { Storage } from './storage.js';
import { Router } from './router.js';
import { transitionTo } from './animations.js';
import { renderSidebar, updateSidebarActive, toggleMobileSidebar, closeMobileSidebar } from './components/sidebar.js';
import { renderDashboard } from './components/dashboard.js';
import { renderWeekView } from './components/quiz.js';
import { renderExam, renderGeneralExam } from './components/exam.js';
import { renderStats } from './components/stats.js';
import { renderSettings } from './components/settings.js';
import { renderAbout } from './components/about.js';

async function init() {
  // 1. Initialize storage
  Storage.init();

  // 2. Apply saved config
  applyConfig();

  // 3. Load data (merge both JSONs)
  try {
    await loadData();
  } catch (err) {
    document.getElementById('app-content').innerHTML = `
      <div class="empty-state" style="padding:4rem">
        <h3>Error al cargar datos</h3>
        <p>${err.message}</p>
        <p style="margin-top:.5rem;font-size:.8rem">Asegúrate de ejecutar la app desde un servidor local (Live Server).</p>
      </div>
    `;
    return;
  }

  // 4. Render sidebar
  renderSidebar();

  // 5. Setup mobile toggle
  document.getElementById('mobile-toggle').addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  // 6. Register routes
  const content = document.getElementById('app-content');

  Router.on('/dashboard', () => {
    transitionTo(content, () => renderDashboard(content));
    updateSidebarActive('/dashboard');
  });

  Router.on('/semana/:id', (params) => {
    transitionTo(content, () => renderWeekView(content, params.id));
    updateSidebarActive(`/semana/${params.id}`);
  });

  Router.on('/examen/:id', (params) => {
    transitionTo(content, () => renderExam(content, params.id));
    updateSidebarActive(`/semana/${params.id}`);
  });

  Router.on('/examen-general', () => {
    transitionTo(content, () => renderGeneralExam(content));
    updateSidebarActive('/examen-general');
  });

  Router.on('/estadisticas', () => {
    transitionTo(content, () => renderStats(content));
    updateSidebarActive('/estadisticas');
  });

  Router.on('/configuracion', () => {
    transitionTo(content, () => renderSettings(content));
    updateSidebarActive('/configuracion');
  });

  Router.on('/acerca-de', () => {
    transitionTo(content, () => renderAbout(content));
    updateSidebarActive('/acerca-de');
  });

  Router.setDefault('/dashboard');

  // 7. Start router
  Router.start();
}

function applyConfig() {
  const config = Storage.getConfig();

  // Theme
  document.documentElement.setAttribute('data-theme', config.theme || 'light');

  // Accent color
  if (config.accentH !== undefined) {
    document.documentElement.style.setProperty('--accent-h', config.accentH);
  }

  // Animations
  if (!config.animations) {
    document.body.classList.add('no-animations');
  }
}

// Boot
init();
