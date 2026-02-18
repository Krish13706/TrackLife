/* gym/script.js — Black & Orange Theme */

document.addEventListener("DOMContentLoaded", () => {
    setupTransitions();
    loadSavedData();
    renderCustomExercises();
    updateStatsStrip();
});

/* =============================================
   PAGE TRANSITIONS
   ============================================= */
function setupTransitions() {
    document.body.classList.add('page-enter');
    setTimeout(() => document.body.classList.remove('page-enter'), 500);

    document.getElementById('back-btn').addEventListener('click', () => {
        const overlay = document.getElementById('page-transition-overlay');
        overlay.classList.add('overlay-active');
        setTimeout(() => { window.location.href = '../index.html'; }, 400);
    });

    document.getElementById('fab-btn').addEventListener('click', openModal);
    document.getElementById('add-exercise-btn').addEventListener('click', openModal);
    document.getElementById('modal-backdrop').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

/* =============================================
   1. TOGGLE CARD
   ============================================= */
function toggleCard(card) {
    if (card.classList.contains('active')) {
        card.classList.remove('active');
        return;
    }
    document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    // Draw chart after expand (needs visible container for width)
    const key = card.dataset.key;
    setTimeout(() => drawMiniChart(key), 60);
}

/* =============================================
   2. LOAD SAVED DATA
   ============================================= */
function loadSavedData() {
    const current = localStorage.getItem('gymWeight');
    const prev    = localStorage.getItem('gymWeight_prev');
    const goal    = parseFloat(document.getElementById('card-bench').dataset.goal) || 185;

    renderWeightHistory('gymWeight', current, prev);
    renderBadge('gymWeight', current);
    renderProgressBar('gymWeight', current, goal);
}

/* =============================================
   3. SAVE DATA (original function preserved)
   ============================================= */
function saveData(key, buttonElement) {
    const input = document.getElementById(key);
    const value = input.value.trim();
    if (!value || isNaN(value)) return;

    const existingCurrent = localStorage.getItem(key);
    if (existingCurrent) localStorage.setItem(key + '_prev', existingCurrent);
    localStorage.setItem(key, value);

    const card = document.querySelector(`[data-key="${key}"]`);
    const goal = card ? parseFloat(card.dataset.goal) : null;

    renderWeightHistory(key, localStorage.getItem(key), localStorage.getItem(key + '_prev'));
    renderBadge(key, localStorage.getItem(key));
    renderProgressBar(key, localStorage.getItem(key), goal);
    updateStatsStrip();
    drawMiniChart(key);

    input.value = '';
    const origHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = 'Saved!';
    buttonElement.classList.add('saved');
    setTimeout(() => { buttonElement.innerHTML = origHTML; buttonElement.classList.remove('saved'); }, 1600);
}

/* =============================================
   4. EDIT MODE
   ============================================= */
function toggleEdit(key, event) {
    if (event) event.stopPropagation();

    const inputRow  = document.getElementById('input-row-' + key);
    const editRow   = document.getElementById('edit-row-' + key);
    const editInput = document.getElementById(key + '-edit');
    const pill      = event ? event.currentTarget : document.querySelector(`[onclick="toggleEdit('${key}', event)"]`);

    if (editRow.style.display !== 'none') {
        editRow.style.display = 'none';
        inputRow.style.display = 'flex';
        pill.classList.remove('editing');
        pill.innerHTML = '<iconify-icon icon="lucide:pencil" style="font-size:12px;"></iconify-icon> Edit';
    } else {
        editInput.value = localStorage.getItem(key) || '';
        inputRow.style.display = 'none';
        editRow.style.display = 'flex';
        pill.classList.add('editing');
        pill.innerHTML = '<iconify-icon icon="lucide:x" style="font-size:12px;"></iconify-icon> Cancel';
        editInput.focus();
    }
}

function confirmEdit(key, buttonElement) {
    const editInput = document.getElementById(key + '-edit');
    const value = editInput.value.trim();
    if (!value || isNaN(value)) return;

    localStorage.setItem(key, value);

    const card = document.querySelector(`[data-key="${key}"]`);
    const goal = card ? parseFloat(card.dataset.goal) : null;

    renderWeightHistory(key, localStorage.getItem(key), localStorage.getItem(key + '_prev'));
    renderBadge(key, localStorage.getItem(key));
    renderProgressBar(key, localStorage.getItem(key), goal);
    updateStatsStrip();
    drawMiniChart(key);

    document.getElementById('edit-row-' + key).style.display = 'none';
    document.getElementById('input-row-' + key).style.display = 'flex';

    const pill = document.querySelector(`[onclick="toggleEdit('${key}', event)"]`);
    if (pill) { pill.classList.remove('editing'); pill.innerHTML = '<iconify-icon icon="lucide:pencil" style="font-size:12px;"></iconify-icon> Edit'; }

    const origHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = 'Updated!';
    buttonElement.classList.add('saved');
    setTimeout(() => { buttonElement.innerHTML = origHTML; buttonElement.classList.remove('saved'); }, 1500);
}

/* =============================================
   5. WEIGHT HISTORY CHIPS
   ============================================= */
function renderWeightHistory(key, current, prev) {
    const container = document.getElementById('history-' + key);
    if (!container) return;

    if (!current && !prev) { container.innerHTML = ''; return; }

    let html = '';
    if (prev) {
        html += `<div class="weight-chip red-chip">
            <span class="chip-label">PREV</span>
            <span class="chip-value">${parseFloat(prev).toFixed(1)}</span>
            <span class="chip-unit">LBS</span>
        </div>`;
    }
    if (current && prev) {
        const diff = (parseFloat(current) - parseFloat(prev)).toFixed(1);
        const sign = diff > 0 ? '+' : '';
        const cls  = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';
        html += `<div class="weight-diff ${cls}"><iconify-icon icon="lucide:arrow-right" style="font-size:11px;opacity:0.5;"></iconify-icon> ${sign}${diff} lbs</div>`;
    }
    if (current) {
        html += `<div class="weight-chip green-chip">
            <span class="chip-label">NOW</span>
            <span class="chip-value">${parseFloat(current).toFixed(1)}</span>
            <span class="chip-unit">LBS</span>
        </div>`;
    }
    container.innerHTML = html;
}

function renderBadge(key, current) {
    const valEl = document.getElementById('val-' + key);
    if (!valEl) return;
    valEl.textContent = current ? parseFloat(current).toFixed(0) : '—';
    if (current) valEl.style.color = 'var(--orange)';
}

function renderProgressBar(key, current, goal) {
    const bar = document.getElementById('bar-' + key);
    if (!bar) return;
    if (!current || !goal) { bar.style.width = '0%'; return; }
    const pct = Math.min((parseFloat(current) / goal) * 100, 100);
    bar.style.width = pct + '%';
}

/* =============================================
   6. STATS STRIP
   ============================================= */
function updateStatsStrip() {
    // Bench progress
    const bench = parseFloat(localStorage.getItem('gymWeight')) || 0;
    document.getElementById('stat-bench').textContent = bench > 0 ? bench + ' lbs' : '—';

    // Overall progress: bench toward 185
    const pct = Math.min(Math.round((bench / 185) * 100), 100);
    document.getElementById('stat-progress').textContent = pct + '%';

    // Total lifts tracked (unique keys with data)
    const allKeys = ['gymWeight', ...getCustomExercises().map(e => e.id)];
    const logged = allKeys.filter(k => localStorage.getItem(k)).length;
    document.getElementById('stat-lifts').textContent = logged;

    // Animate bottom bar on stat cards with data
    document.querySelectorAll('.stat-card').forEach(card => {
        const val = card.querySelector('.stat-value').textContent;
        if (val && val !== '—' && val !== '0' && val !== '0%') card.classList.add('has-data');
        else card.classList.remove('has-data');
    });
}

/* =============================================
   7. MINI CHART (Canvas)
   ============================================= */
function getHistory(key) {
    try { return JSON.parse(localStorage.getItem(key + '_history')) || []; }
    catch { return []; }
}

function pushHistory(key, value) {
    const hist = getHistory(key);
    const timestamp = Date.now();
    hist.push({ v: parseFloat(value), t: timestamp });
    // Keep last 12 entries
    if (hist.length > 12) hist.splice(0, hist.length - 12);
    localStorage.setItem(key + '_history', JSON.stringify(hist));
}

function drawMiniChart(key) {
    const canvas  = document.getElementById('chart-' + key);
    const noData  = document.getElementById('no-chart-' + key);
    if (!canvas) return;

    let hist = getHistory(key);

    // Supplement with current/prev if history is thin
    const current = localStorage.getItem(key);
    const prev    = localStorage.getItem(key + '_prev');
    if (hist.length === 0 && current) {
        if (prev) hist = [{ v: parseFloat(prev), t: Date.now() - 86400000 }, { v: parseFloat(current), t: Date.now() }];
        else hist = [{ v: parseFloat(current), t: Date.now() }];
    }

    if (hist.length < 2) {
        canvas.style.display = 'none';
        if (noData) noData.style.display = 'flex';
        return;
    }

    canvas.style.display = 'block';
    if (noData) noData.style.display = 'none';

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = 80;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const values = hist.map(h => h.v);
    const minV   = Math.min(...values) * 0.96;
    const maxV   = Math.max(...values) * 1.04;
    const range  = maxV - minV || 1;

    const padL = 4, padR = 4, padT = 8, padB = 4;
    const cW   = W - padL - padR;
    const cH   = H - padT - padB;

    const xOf = i => padL + (i / (hist.length - 1)) * cW;
    const yOf = v => padT + cH - ((v - minV) / range) * cH;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, padT, 0, H);
    grad.addColorStop(0, 'rgba(249,115,22,0.35)');
    grad.addColorStop(1, 'rgba(249,115,22,0.0)');

    // Draw fill area
    ctx.beginPath();
    ctx.moveTo(xOf(0), H);
    ctx.lineTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < hist.length; i++) {
        const x0 = xOf(i - 1), y0 = yOf(values[i - 1]);
        const x1 = xOf(i),     y1 = yOf(values[i]);
        const cpx = (x0 + x1) / 2;
        ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
    ctx.lineTo(xOf(hist.length - 1), H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < hist.length; i++) {
        const x0 = xOf(i - 1), y0 = yOf(values[i - 1]);
        const x1 = xOf(i),     y1 = yOf(values[i]);
        const cpx = (x0 + x1) / 2;
        ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Last point dot
    const lx = xOf(hist.length - 1);
    const ly = yOf(values[values.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249,115,22,0.25)';
    ctx.fill();

    // Score bubble
    const scoreText = values[values.length - 1].toFixed(0);
    const bW = 46, bH = 26, bR = 7;
    let bx = lx - bW / 2;
    let by = ly - bH - 12;
    if (by < padT) by = ly + 10;
    bx = Math.max(padL, Math.min(bx, W - padR - bW));
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx, by, bW, bH, bR);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scoreText, bx + bW / 2, by + bH / 2);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/* =============================================
   8. CUSTOM EXERCISES
   ============================================= */
function getCustomExercises() {
    try { return JSON.parse(localStorage.getItem('customExercises')) || []; }
    catch { return []; }
}
function saveCustomExercises(list) { localStorage.setItem('customExercises', JSON.stringify(list)); }

function renderCustomExercises() {
    getCustomExercises().forEach(ex => buildExerciseCard(ex.id, ex.name, ex.goal));
    updateStatsStrip();
}

function addCustomExercise() {
    const nameInput = document.getElementById('new-exercise-name');
    const goalInput = document.getElementById('new-exercise-goal');
    const name = nameInput.value.trim();
    if (!name) {
        nameInput.classList.add('input-error');
        setTimeout(() => nameInput.classList.remove('input-error'), 600);
        return;
    }

    const id   = 'custom_' + Date.now();
    const goal = parseFloat(goalInput.value) || 200;
    const list = getCustomExercises();
    list.push({ id, name, goal });
    saveCustomExercises(list);
    buildExerciseCard(id, name, goal);
    closeModal();
    nameInput.value = '';
    goalInput.value = '';
    updateStatsStrip();

    setTimeout(() => {
        const card = document.getElementById('card-' + id);
        if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => toggleCard(card), 280); }
    }, 200);
}

function buildExerciseCard(id, name, goal) {
    const list = document.getElementById('exercises-list');
    goal = goal || 200;

    const current = localStorage.getItem(id) || '';
    const prev    = localStorage.getItem(id + '_prev') || '';

    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.id = 'card-' + id;
    card.setAttribute('data-key', id);
    card.setAttribute('data-label', name);
    card.setAttribute('data-goal', goal);
    card.setAttribute('onclick', 'toggleCard(this)');

    const pct = current ? Math.min((parseFloat(current) / goal) * 100, 100) : 0;

    card.innerHTML = `
        <div class="card-collapsed">
            <div class="ex-left">
                <span class="ex-name">${escapeHTML(name)}</span>
                <div class="progress-track">
                    <div class="progress-fill-bar" id="bar-${id}" style="width:${pct}%"></div>
                </div>
            </div>
            <div class="ex-right">
                <span class="ex-value" id="val-${id}" style="${current ? 'color:var(--orange)' : ''}">${current ? parseFloat(current).toFixed(0) : '—'}</span>
                <iconify-icon icon="lucide:chevron-down" class="chevron-icon" style="font-size:18px;"></iconify-icon>
            </div>
        </div>

        <div class="card-expanded" onclick="event.stopPropagation()">
            <div class="expand-divider"></div>
            <div class="mini-chart-wrap">
                <canvas class="mini-chart" id="chart-${id}" height="80"></canvas>
                <div class="chart-no-data" id="no-chart-${id}">Log weights to see your progress chart</div>
            </div>
            <div class="weight-history" id="history-${id}"></div>
            <div class="input-row" id="input-row-${id}">
                <div class="gym-input-wrapper">
                    <input type="number" class="gym-weight-input" id="${id}" placeholder="0" inputmode="decimal">
                    <span class="gym-unit">LBS</span>
                </div>
                <button class="gym-save-btn" onclick="saveCustomData('${id}', this)">Save</button>
            </div>
            <div class="input-row" id="edit-row-${id}" style="display:none;">
                <div class="gym-input-wrapper edit-active">
                    <input type="number" class="gym-weight-input" id="${id}-edit" placeholder="0" inputmode="decimal">
                    <span class="gym-unit">LBS</span>
                </div>
                <button class="gym-update-btn" onclick="confirmEdit('${id}', this)">Update</button>
            </div>
            <div class="card-actions">
                <button class="action-pill edit-pill" onclick="toggleEdit('${id}', event)">
                    <iconify-icon icon="lucide:pencil" style="font-size:12px;"></iconify-icon> Edit
                </button>
                <button class="action-pill delete-pill" onclick="deleteExercise('${id}', event)">
                    <iconify-icon icon="lucide:trash-2" style="font-size:12px;"></iconify-icon> Delete
                </button>
            </div>
        </div>
    `;

    list.appendChild(card);
    renderWeightHistory(id, current || null, prev || null);

    // Animate in
    card.style.opacity = '0';
    card.style.transform = 'translateY(14px)';
    requestAnimationFrame(() => {
        card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });
}

function saveCustomData(key, buttonElement) {
    const input = document.getElementById(key);
    const value = input.value.trim();
    if (!value || isNaN(value)) return;

    const existing = localStorage.getItem(key);
    if (existing) localStorage.setItem(key + '_prev', existing);
    localStorage.setItem(key, value);
    pushHistory(key, value);

    const card = document.querySelector(`[data-key="${key}"]`);
    const goal = card ? parseFloat(card.dataset.goal) : 200;

    renderWeightHistory(key, localStorage.getItem(key), localStorage.getItem(key + '_prev'));
    renderBadge(key, localStorage.getItem(key));
    renderProgressBar(key, localStorage.getItem(key), goal);
    updateStatsStrip();
    drawMiniChart(key);
    input.value = '';

    const origHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = 'Saved!';
    buttonElement.classList.add('saved');
    setTimeout(() => { buttonElement.innerHTML = origHTML; buttonElement.classList.remove('saved'); }, 1600);
}

function deleteExercise(id, event) {
    if (event) event.stopPropagation();
    const card = document.getElementById('card-' + id);
    if (!card) return;
    card.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95) translateX(16px)';
    setTimeout(() => {
        card.remove();
        saveCustomExercises(getCustomExercises().filter(e => e.id !== id));
        localStorage.removeItem(id);
        localStorage.removeItem(id + '_prev');
        localStorage.removeItem(id + '_history');
        updateStatsStrip();
    }, 290);
}

/* =============================================
   9. MODAL
   ============================================= */
function openModal() {
    document.getElementById('modal-backdrop').classList.add('modal-open');
    setTimeout(() => {
        document.getElementById('modal-card').classList.add('modal-card-open');
        setTimeout(() => document.getElementById('new-exercise-name').focus(), 280);
    }, 10);
}
function closeModal() {
    document.getElementById('modal-card').classList.remove('modal-card-open');
    setTimeout(() => document.getElementById('modal-backdrop').classList.remove('modal-open'), 320);
}
function setExerciseName(name) {
    document.getElementById('new-exercise-name').value = name;
    document.getElementById('new-exercise-name').focus();
}

/* =============================================
   UTILS
   ============================================= */
function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}
