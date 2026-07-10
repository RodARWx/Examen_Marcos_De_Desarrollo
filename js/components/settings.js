/* ============================================
   SETTINGS — Configuration panel
   ============================================ */

import { Storage } from '../storage.js';
import { Icons } from '../utils.js';
import { renderSidebar } from './sidebar.js';

const ACCENT_COLORS = [
  { name: 'Violeta', h: 252, color: 'hsl(252,85%,60%)' },
  { name: 'Azul', h: 217, color: 'hsl(217,85%,55%)' },
  { name: 'Teal', h: 172, color: 'hsl(172,70%,42%)' },
  { name: 'Esmeralda', h: 160, color: 'hsl(160,70%,42%)' },
  { name: 'Rosa', h: 350, color: 'hsl(350,80%,58%)' },
  { name: 'Ámbar', h: 38, color: 'hsl(38,90%,52%)' },
  { name: 'Naranja', h: 24, color: 'hsl(24,85%,55%)' },
];

export function renderSettings(container) {
  const config = Storage.getConfig();

  container.innerHTML = `
    <div class="page-header anim-slide-up">
      <h2>Configuración</h2>
      <p>Personaliza tu experiencia de estudio</p>
    </div>

    <div class="anim-slide-up" style="max-width:640px">
      <!-- Appearance -->
      <div class="settings-section">
        <div class="settings-section-title">🎨 Apariencia</div>

        <div class="setting-row">
          <div class="setting-info">
            <h4>Modo oscuro</h4>
            <p>Alterna entre tema claro y oscuro</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-theme" ${config.theme === 'dark' ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <h4>Color de acento</h4>
            <p>Elige el color principal de la interfaz</p>
          </div>
          <div class="color-palette" id="color-palette">
            ${ACCENT_COLORS.map(c => `
              <span class="color-swatch ${config.accentH === c.h ? 'active' : ''}"
                    data-h="${c.h}"
                    style="background:${c.color}"
                    title="${c.name}"></span>
            `).join('')}
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <h4>Animaciones</h4>
            <p>Habilita o deshabilita las micro-animaciones</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-animations" ${config.animations ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-section">
        <div class="settings-section-title">💾 Datos</div>

        <div class="setting-row" style="border-bottom:none">
          <div class="setting-info">
            <h4>Reiniciar todo el progreso</h4>
            <p>Se borrarán todas las respuestas, exámenes y estadísticas</p>
          </div>
          <button class="btn btn-danger btn-sm" id="btn-reset">
            ${Icons.refresh} Reiniciar
          </button>
        </div>
      </div>
    </div>
  `;

  // --- Theme toggle ---
  document.getElementById('toggle-theme').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    Storage.setConfig('theme', theme);
  });

  // --- Color palette ---
  document.getElementById('color-palette').addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    const h = Number(swatch.dataset.h);
    document.documentElement.style.setProperty('--accent-h', h);
    Storage.setConfig('accentH', h);

    // Update active
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
  });

  // --- Animations toggle ---
  document.getElementById('toggle-animations').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    Storage.setConfig('animations', enabled);
    document.body.classList.toggle('no-animations', !enabled);
  });

  // --- Reset ---
  document.getElementById('btn-reset').addEventListener('click', () => {
    showResetConfirm(container);
  });
}

function showResetConfirm(container) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>⚠️ ¿Reiniciar todo?</h3>
      <p>Esta acción eliminará todo tu progreso, resultados de exámenes y estadísticas. No se puede deshacer.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn btn-danger" id="modal-confirm">Reiniciar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('modal-cancel').addEventListener('click', () => overlay.remove());
  document.getElementById('modal-confirm').addEventListener('click', () => {
    Storage.resetAll();
    overlay.remove();
    renderSidebar();
    renderSettings(container);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
