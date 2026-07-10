/* ============================================
   ABOUT — About page
   ============================================ */

import { getWeeks, getAllQuestions, Icons } from '../utils.js';

export function renderAbout(container) {
  const weeks = getWeeks();
  const totalQ = getAllQuestions().length;

  // Count question types
  const types = {};
  getAllQuestions().forEach(q => {
    const t = q.tipo || 'Otro';
    types[t] = (types[t] || 0) + 1;
  });

  container.innerHTML = `
    <div class="anim-slide-up">
      <div class="about-container">
        <div style="margin-bottom:2rem">
          <div style="width:72px;height:72px;background:var(--accent-gradient);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#fff">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="#fff"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h2>StudyApp DSI</h2>
          <p style="color:var(--text-tertiary);font-size:.85rem">Aplicación de estudio para Desarrollo de Sistemas de Información</p>
        </div>

        <div class="card" style="text-align:left;margin-bottom:1.5rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">📊 Base de conocimiento</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
            <div>
              <div style="font-size:1.5rem;font-weight:800;color:var(--accent)">${weeks.length}</div>
              <div style="font-size:.75rem;color:var(--text-tertiary)">Semanas</div>
            </div>
            <div>
              <div style="font-size:1.5rem;font-weight:800;color:var(--accent)">${totalQ}</div>
              <div style="font-size:.75rem;color:var(--text-tertiary)">Preguntas</div>
            </div>
          </div>
        </div>

        <div class="card" style="text-align:left;margin-bottom:1.5rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">📝 Tipos de preguntas</h3>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            ${Object.entries(types).map(([type, count]) => `
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:.85rem;color:var(--text-secondary)">${type}</span>
                <span class="badge badge-info">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card" style="text-align:left;margin-bottom:1.5rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">🎓 Información de la materia</h3>
          <div style="font-size:.85rem;color:var(--text-secondary);line-height:1.7">
            <p><strong>Materia:</strong> Desarrollo de Sistemas de Información</p>
            <p><strong>Universidad:</strong> Universidad Central del Ecuador</p>
            <p><strong>Semestre:</strong> 6to</p>
            <p><strong>Período:</strong> 2026</p>
          </div>
        </div>

        <div class="card" style="text-align:left">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">⚙️ Tecnologías</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem">
            <span class="keyword-tag">HTML5</span>
            <span class="keyword-tag">CSS3</span>
            <span class="keyword-tag">JavaScript ES6</span>
            <span class="keyword-tag">Canvas API</span>
            <span class="keyword-tag">LocalStorage</span>
            <span class="keyword-tag">SPA Router</span>
          </div>
        </div>

        <p style="margin-top:2rem;font-size:.75rem;color:var(--text-tertiary)">
          v1.0.0 — Construida sin dependencias externas
        </p>
      </div>
    </div>
  `;
}
