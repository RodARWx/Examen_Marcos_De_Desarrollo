/* ============================================
   STATS — Statistics with Canvas API charts
   ============================================ */

import { getWeeks, Icons, percent, formatTimeHuman } from '../utils.js';
import { Storage } from '../storage.js';

export function renderStats(container) {
  const weeks = getWeeks();
  const stats = Storage.getStats();
  const examResults = Storage.getExamResults();

  // Compute per-week data
  const weekData = weeks.map(w => {
    const prog = Storage.getWeekProgress(w.id);
    const total = (w.preguntas || []).length;
    const answered = Object.keys(prog.answered).length;
    const correct = Object.values(prog.answered).filter(a => a.correct).length;
    const incorrect = answered - correct;
    return { id: w.id, titulo: w.titulo, total, answered, correct, incorrect };
  });

  // Difficulty data
  const difficultyMap = {};
  weeks.forEach(w => {
    (w.preguntas || []).forEach(q => {
      const level = q.nivel || 'Medio';
      if (!difficultyMap[level]) difficultyMap[level] = { total: 0, correct: 0 };
      difficultyMap[level].total++;
      const prog = Storage.getWeekProgress(w.id);
      const a = prog.answered[q.id];
      if (a && a.correct) difficultyMap[level].correct++;
    });
  });

  container.innerHTML = `
    <div class="page-header anim-slide-up">
      <h2>Estadísticas</h2>
      <p>Tu rendimiento detallado</p>
    </div>

    <!-- Summary cards -->
    <div class="stat-grid stagger-children" style="margin-bottom:2rem">
      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--accent-soft)">${Icons.target}</div>
          <span class="stat-card-label">Respondidas</span>
        </div>
        <div class="stat-card-value">${stats.totalAnswered}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-success-soft);color:var(--color-success)">${Icons.check}</div>
          <span class="stat-card-label">Correctas</span>
        </div>
        <div class="stat-card-value" style="color:var(--color-success)">${stats.totalCorrect}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--color-error-soft);color:var(--color-error)">${Icons.close}</div>
          <span class="stat-card-label">Incorrectas</span>
        </div>
        <div class="stat-card-value" style="color:var(--color-error)">${stats.totalIncorrect}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon" style="background:var(--accent-soft)">${Icons.clock}</div>
          <span class="stat-card-label">Tiempo total</span>
        </div>
        <div class="stat-card-value">${formatTimeHuman(stats.timeStudied)}</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid stagger-children">
      <div class="chart-container">
        <div class="chart-title">📊 Progreso por semana</div>
        <canvas id="chart-progress" class="chart-canvas"></canvas>
      </div>

      <div class="chart-container">
        <div class="chart-title">✅ Correctas vs Incorrectas por semana</div>
        <canvas id="chart-correct" class="chart-canvas"></canvas>
      </div>

      <div class="chart-container">
        <div class="chart-title">🎯 Dominio por dificultad</div>
        <canvas id="chart-difficulty" class="chart-canvas"></canvas>
      </div>

      <div class="chart-container">
        <div class="chart-title">📈 Historial de exámenes</div>
        ${examResults.length > 0 ? `<canvas id="chart-exams" class="chart-canvas"></canvas>` : `
          <div class="empty-state">
            <p>Aún no has realizado ningún examen</p>
          </div>
        `}
      </div>
    </div>
  `;

  // Draw charts after DOM is ready
  requestAnimationFrame(() => {
    drawProgressChart(document.getElementById('chart-progress'), weekData);
    drawCorrectChart(document.getElementById('chart-correct'), weekData);
    drawDifficultyChart(document.getElementById('chart-difficulty'), difficultyMap);
    if (examResults.length > 0) {
      drawExamsChart(document.getElementById('chart-exams'), examResults);
    }
  });
}

/* ---------- Chart Drawing Functions (Pure Canvas) ---------- */

function getCanvasThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    text: style.getPropertyValue('--text-primary').trim() || '#1A1D26',
    textSecondary: style.getPropertyValue('--text-tertiary').trim() || '#8B91A8',
    accent: style.getPropertyValue('--accent').trim() || '#7C5CE7',
    success: style.getPropertyValue('--color-success').trim() || '#22C55E',
    error: style.getPropertyValue('--color-error').trim() || '#EF4444',
    warning: style.getPropertyValue('--color-warning').trim() || '#F59E0B',
    border: style.getPropertyValue('--border').trim() || '#E2E4EA',
    bgCard: style.getPropertyValue('--bg-card').trim() || '#FFFFFF',
  };
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

/**
 * Bar chart — Progress per week (%).
 */
function drawProgressChart(canvas, weekData) {
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const colors = getCanvasThemeColors();

  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const barWidth = Math.min(32, (chartW / weekData.length) * 0.6);
  const gap = chartW / weekData.length;

  // Y axis grid
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 0.5;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = colors.textSecondary;
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (chartH * i / 4);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${i * 25}%`, padding.left - 8, y + 4);
  }

  // Bars
  weekData.forEach((wd, i) => {
    const pct = wd.total > 0 ? wd.answered / wd.total : 0;
    const barH = chartH * pct;
    const x = padding.left + gap * i + (gap - barWidth) / 2;
    const y = padding.top + chartH - barH;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
    grad.addColorStop(0, colors.accent);
    grad.addColorStop(1, colors.accent + '44');
    ctx.fillStyle = grad;

    // Rounded rect
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, padding.top + chartH);
    ctx.lineTo(x, padding.top + chartH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();

    // Label
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`S${wd.id}`, x + barWidth / 2, h - padding.bottom + 16);
  });
}

/**
 * Grouped bar chart — correct vs incorrect per week.
 */
function drawCorrectChart(canvas, weekData) {
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const colors = getCanvasThemeColors();

  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const maxVal = Math.max(1, ...weekData.map(d => Math.max(d.correct, d.incorrect)));
  const gap = chartW / weekData.length;
  const barW = Math.min(14, gap * 0.3);

  // Grid
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 0.5;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = colors.textSecondary;
  ctx.textAlign = 'right';

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padding.top + chartH - (chartH * i / steps);
    const val = Math.round(maxVal * i / steps);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(val, padding.left - 8, y + 4);
  }

  weekData.forEach((wd, i) => {
    const cx = padding.left + gap * i + gap / 2;

    // Correct bar
    const cH = (wd.correct / maxVal) * chartH;
    ctx.fillStyle = colors.success;
    ctx.fillRect(cx - barW - 1, padding.top + chartH - cH, barW, cH);

    // Incorrect bar
    const iH = (wd.incorrect / maxVal) * chartH;
    ctx.fillStyle = colors.error;
    ctx.fillRect(cx + 1, padding.top + chartH - iH, barW, iH);

    // Label
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`S${wd.id}`, cx, h - padding.bottom + 16);
  });

  // Legend
  ctx.font = '11px Inter, sans-serif';
  const lx = w - padding.right - 120;
  ctx.fillStyle = colors.success;
  ctx.fillRect(lx, 8, 12, 12);
  ctx.fillStyle = colors.textSecondary;
  ctx.textAlign = 'left';
  ctx.fillText('Correctas', lx + 16, 18);

  ctx.fillStyle = colors.error;
  ctx.fillRect(lx + 80, 8, 12, 12);
  ctx.fillStyle = colors.textSecondary;
  ctx.fillText('Incorrectas', lx + 96, 18);
}

/**
 * Horizontal bar chart — difficulty mastery.
 */
function drawDifficultyChart(canvas, difficultyMap) {
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const colors = getCanvasThemeColors();

  const entries = Object.entries(difficultyMap);
  if (entries.length === 0) {
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos disponibles', w / 2, h / 2);
    return;
  }

  const padding = { top: 20, right: 30, bottom: 20, left: 80 };
  const chartW = w - padding.left - padding.right;
  const barHeight = 28;
  const gap = 16;

  const diffColors = {
    'Fácil': colors.success,
    'Medio': colors.warning,
    'Difícil': colors.error,
  };

  entries.forEach(([level, data], i) => {
    const y = padding.top + i * (barHeight + gap);
    const pct = data.total > 0 ? data.correct / data.total : 0;

    // Label
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(level, padding.left - 12, y + barHeight / 2 + 4);

    // Background bar
    ctx.fillStyle = colors.border;
    ctx.beginPath();
    ctx.roundRect(padding.left, y, chartW, barHeight, 6);
    ctx.fill();

    // Fill bar
    const fillW = chartW * pct;
    if (fillW > 0) {
      ctx.fillStyle = diffColors[level] || colors.accent;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, Math.max(fillW, 8), barHeight, 6);
      ctx.fill();
    }

    // Percentage text
    ctx.fillStyle = pct > 0.3 ? '#fff' : colors.text;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(pct * 100)}%  (${data.correct}/${data.total})`, padding.left + 10, y + barHeight / 2 + 4);
  });
}

/**
 * Line chart — exam scores over time.
 */
function drawExamsChart(canvas, examResults) {
  if (!canvas || examResults.length === 0) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const colors = getCanvasThemeColors();

  const recent = examResults.slice(-15); // Last 15 exams
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  // Grid
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 0.5;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = colors.textSecondary;
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (chartH * i / 4);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${i * 25}%`, padding.left - 8, y + 4);
  }

  // Pass line at 70%
  const passY = padding.top + chartH - (chartH * 0.7);
  ctx.strokeStyle = colors.success + '44';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding.left, passY);
  ctx.lineTo(w - padding.right, passY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plot points and line
  const points = recent.map((r, i) => ({
    x: padding.left + (chartW / (recent.length - 1 || 1)) * i,
    y: padding.top + chartH - (chartH * r.percent / 100),
    score: r.percent,
  }));

  // Line
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Area fill
  ctx.fillStyle = colors.accent + '15';
  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.fill();

  // Points
  points.forEach(p => {
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle = colors.textSecondary;
  ctx.textAlign = 'center';
  ctx.font = '10px Inter, sans-serif';
  recent.forEach((r, i) => {
    const x = padding.left + (chartW / (recent.length - 1 || 1)) * i;
    const label = `#${i + 1}`;
    ctx.fillText(label, x, h - padding.bottom + 16);
  });
}
