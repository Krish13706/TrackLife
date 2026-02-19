/* script.js — Gym Tracker */

/* =============================================
   INIT
   ============================================= */
document.addEventListener("DOMContentLoaded", () => {
    setupTransitions();
    renderCustomExercises();
    updateStatsStrip();
    initTimer();
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
        setTimeout(() => {
            if (history.length > 1) history.back();
            else window.location.href = '../index.html';
        }, 400);
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
    const key = card.dataset.key;
    setTimeout(() => drawMiniChart(key), 60);
}

/* =============================================
   2. SAVE DATA  (key preserved for rank system)
   ============================================= */
function saveData(key, buttonElement) {
    const input = document.getElementById(key);
    const value = input.value.trim();
    if (!value || isNaN(value)) return;

    const existing = localStorage.getItem(key);
    if (existing) localStorage.setItem(key + '_prev', existing);
    localStorage.setItem(key, value);
    pushHistory(key, value);

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
   3. EDIT MODE
   ============================================= */
function toggleEdit(key, event) {
    if (event) event.stopPropagation();
    const inputRow  = document.getElementById('input-row-' + key);
    const editRow   = document.getElementById('edit-row-' + key);
    const editInput = document.getElementById(key + '-edit');
    const pill      = event ? event.currentTarget : null;

    if (editRow.style.display !== 'none') {
        editRow.style.display = 'none';
        inputRow.style.display = 'flex';
        if (pill) { pill.classList.remove('editing'); pill.innerHTML = '<iconify-icon icon="lucide:pencil" style="font-size:12px;"></iconify-icon> Edit'; }
    } else {
        editInput.value = localStorage.getItem(key) || '';
        inputRow.style.display = 'none';
        editRow.style.display = 'flex';
        if (pill) { pill.classList.add('editing'); pill.innerHTML = '<iconify-icon icon="lucide:x" style="font-size:12px;"></iconify-icon> Cancel'; }
        editInput.focus();
    }
}

function confirmEdit(key, buttonElement) {
    const value = document.getElementById(key + '-edit').value.trim();
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
   4. WEIGHT HISTORY CHIPS
   ============================================= */
function renderWeightHistory(key, current, prev) {
    const container = document.getElementById('history-' + key);
    if (!container) return;
    if (!current && !prev) { container.innerHTML = ''; return; }

    let html = '';
    if (prev) {
        html += `<div class="weight-chip red-chip"><span class="chip-label">PREV</span><span class="chip-value">${parseFloat(prev).toFixed(1)}</span><span class="chip-unit">LBS</span></div>`;
    }
    if (current && prev) {
        const diff = (parseFloat(current) - parseFloat(prev)).toFixed(1);
        const sign = diff > 0 ? '+' : '';
        const cls  = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';
        html += `<div class="weight-diff ${cls}"><iconify-icon icon="lucide:arrow-right" style="font-size:11px;opacity:0.5;"></iconify-icon> ${sign}${diff} lbs</div>`;
    }
    if (current) {
        html += `<div class="weight-chip green-chip"><span class="chip-label">NOW</span><span class="chip-value">${parseFloat(current).toFixed(1)}</span><span class="chip-unit">LBS</span></div>`;
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
    bar.style.width = Math.min((parseFloat(current) / goal) * 100, 100) + '%';
}

/* =============================================
   5. STATS STRIP
   ============================================= */
function updateStatsStrip() {
    const exercises = getCustomExercises();
    const allKeys   = exercises.map(e => e.id);
    const logged    = allKeys.filter(k => localStorage.getItem(k));

    // Top lift: highest current value across all exercises
    let topLift = 0, topName = '—';
    logged.forEach(k => {
        const v = parseFloat(localStorage.getItem(k));
        if (v > topLift) { topLift = v; }
    });
    document.getElementById('stat-bench').textContent = topLift > 0 ? topLift + ' lbs' : '—';

    // Avg progress toward goals
    let totalPct = 0;
    exercises.forEach(ex => {
        const v = parseFloat(localStorage.getItem(ex.id)) || 0;
        const g = parseFloat(ex.goal) || 200;
        totalPct += Math.min((v / g) * 100, 100);
    });
    const avgPct = exercises.length > 0 ? Math.round(totalPct / exercises.length) : 0;
    document.getElementById('stat-progress').textContent = avgPct + '%';
    document.getElementById('stat-lifts').textContent = logged.length;

    // Show/hide empty state
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = exercises.length === 0 ? 'flex' : 'none';
}

/* =============================================
   6. MINI CHART
   ============================================= */
function getHistory(key) {
    try { return JSON.parse(localStorage.getItem(key + '_history')) || []; } catch { return []; }
}
function pushHistory(key, value) {
    const hist = getHistory(key);
    hist.push({ v: parseFloat(value), t: Date.now() });
    if (hist.length > 12) hist.splice(0, hist.length - 12);
    localStorage.setItem(key + '_history', JSON.stringify(hist));
}

function drawMiniChart(key) {
    const canvas = document.getElementById('chart-' + key);
    const noData = document.getElementById('no-chart-' + key);
    if (!canvas) return;

    let hist = getHistory(key);
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
    const W = canvas.offsetWidth, H = 80;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const values = hist.map(h => h.v);
    const minV = Math.min(...values) * 0.96;
    const maxV = Math.max(...values) * 1.04;
    const range = maxV - minV || 1;
    const padL = 4, padR = 4, padT = 10, padB = 4;
    const cW = W - padL - padR, cH = H - padT - padB;
    const xOf = i => padL + (i / (hist.length - 1)) * cW;
    const yOf = v => padT + cH - ((v - minV) / range) * cH;

    const grad = ctx.createLinearGradient(0, padT, 0, H);
    grad.addColorStop(0, 'rgba(249,115,22,0.35)');
    grad.addColorStop(1, 'rgba(249,115,22,0.0)');

    ctx.beginPath();
    ctx.moveTo(xOf(0), H);
    ctx.lineTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < hist.length; i++) {
        const cpx = (xOf(i-1) + xOf(i)) / 2;
        ctx.bezierCurveTo(cpx, yOf(values[i-1]), cpx, yOf(values[i]), xOf(i), yOf(values[i]));
    }
    ctx.lineTo(xOf(hist.length-1), H);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < hist.length; i++) {
        const cpx = (xOf(i-1) + xOf(i)) / 2;
        ctx.bezierCurveTo(cpx, yOf(values[i-1]), cpx, yOf(values[i]), xOf(i), yOf(values[i]));
    }
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

    const lx = xOf(hist.length-1), ly = yOf(values[values.length-1]);
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2); ctx.fillStyle = '#f97316'; ctx.fill();
    ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI*2); ctx.fillStyle = 'rgba(249,115,22,0.25)'; ctx.fill();

    const scoreText = values[values.length-1].toFixed(0);
    const bW = 46, bH = 24, bR = 6;
    let bx = lx - bW/2, by = ly - bH - 10;
    if (by < padT) by = ly + 8;
    bx = Math.max(padL, Math.min(bx, W - padR - bW));
    roundRect(ctx, bx, by, bW, bH, bR);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(scoreText, bx + bW/2, by + bH/2);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

/* =============================================
   7. CUSTOM EXERCISES
   ============================================= */
function getCustomExercises() {
    try { return JSON.parse(localStorage.getItem('customExercises')) || []; } catch { return []; }
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
    nameInput.value = ''; goalInput.value = '';
    updateStatsStrip();

    setTimeout(() => {
        const card = document.getElementById('card-' + id);
        if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => toggleCard(card), 280); }
    }, 200);
}

function buildExerciseCard(id, name, goal) {
    goal = goal || 200;
    const list    = document.getElementById('exercises-list');
    const current = localStorage.getItem(id) || '';
    const prev    = localStorage.getItem(id + '_prev') || '';
    const pct     = current ? Math.min((parseFloat(current) / goal) * 100, 100) : 0;

    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.id = 'card-' + id;
    card.setAttribute('data-key', id);
    card.setAttribute('data-label', name);
    card.setAttribute('data-goal', goal);
    card.setAttribute('onclick', 'toggleCard(this)');

    card.innerHTML = `
        <!-- X CLOSE BUTTON -->
        <button class="card-close-btn" onclick="deleteExercise('${id}', event)" title="Remove exercise">
            <iconify-icon icon="lucide:x" style="font-size:13px;"></iconify-icon>
        </button>

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
                <button class="gym-save-btn" onclick="saveData('${id}', this)">Save</button>
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
            </div>
        </div>
    `;

    // Insert before empty-state so it appears above it
    const emptyState = document.getElementById('empty-state');
    list.insertBefore(card, emptyState);

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

function deleteExercise(id, event) {
    if (event) event.stopPropagation();
    const card = document.getElementById('card-' + id);
    if (!card) return;
    card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95) translateX(16px)';
    setTimeout(() => {
        card.remove();
        saveCustomExercises(getCustomExercises().filter(e => e.id !== id));
        localStorage.removeItem(id);
        localStorage.removeItem(id + '_prev');
        localStorage.removeItem(id + '_history');
        updateStatsStrip();
    }, 260);
}

/* =============================================
   8. MODAL
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
   9. TIMER
   ============================================= */
let timerInterval  = null;
let timerRemaining = 0;   // seconds left
let timerTotal     = 0;   // seconds at start
let timerRunning   = false;
let timerPanelOpen = false;

function initTimer() {
    updateTimerDisplay(0, 0);
}

function toggleTimerPanel() {
    timerPanelOpen = !timerPanelOpen;
    const panel   = document.getElementById('timer-panel');
    const chevron = document.getElementById('timer-chevron');
    if (timerPanelOpen) {
        panel.classList.add('open');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        panel.classList.remove('open');
        chevron.style.transform = 'rotate(0deg)';
    }
}

function setPreset(mins, secs) {
    document.getElementById('timer-minutes').value = mins;
    document.getElementById('timer-seconds').value = secs || '';
    // Highlight selected preset
    document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function startTimer() {
    if (timerRunning) {
        // Pause
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:play');
        document.getElementById('timer-btn-label').textContent = 'Resume';
        document.getElementById('timer-status').textContent = 'PAUSED';
        document.getElementById('timer-dock').classList.remove('timer-running');
        return;
    }

    // If nothing is loaded yet, load from inputs
    if (timerRemaining === 0) {
        const mins = parseInt(document.getElementById('timer-minutes').value) || 0;
        const secs = parseInt(document.getElementById('timer-seconds').value) || 0;
        timerTotal = timerRemaining = mins * 60 + secs;
        if (timerTotal === 0) return;
    }

    // Start / resume
    timerRunning = true;
    document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:pause');
    document.getElementById('timer-btn-label').textContent = 'Pause';
    document.getElementById('timer-status').textContent = 'RUNNING';
    document.getElementById('timer-dock').classList.add('timer-running');

    timerInterval = setInterval(() => {
        timerRemaining--;
        const m = Math.floor(timerRemaining / 60);
        const s = timerRemaining % 60;
        updateTimerDisplay(m, s);

        if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerRemaining = 0;
            document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:play');
            document.getElementById('timer-btn-label').textContent = 'Start';
            document.getElementById('timer-status').textContent = 'DONE!';
            document.getElementById('timer-dock').classList.remove('timer-running');
            document.getElementById('timer-dock').classList.add('timer-done');
            // Vibrate on iOS / Android
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setTimeout(() => {
                document.getElementById('timer-dock').classList.remove('timer-done');
                document.getElementById('timer-status').textContent = 'REST TIMER';
            }, 3000);
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning   = false;
    timerRemaining = 0;
    timerTotal     = 0;
    updateTimerDisplay(0, 0);
    document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:play');
    document.getElementById('timer-btn-label').textContent = 'Start';
    document.getElementById('timer-status').textContent = 'REST TIMER';
    document.getElementById('timer-dock').classList.remove('timer-running', 'timer-done');
    document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
}

function updateTimerDisplay(m, s) {
    const m1 = Math.floor(m / 10), m2 = m % 10;
    const s1 = Math.floor(s / 10), s2 = s % 10;
    document.getElementById('digit-m1').textContent = m1;
    document.getElementById('digit-m2').textContent = m2;
    document.getElementById('digit-s1').textContent = s1;
    document.getElementById('digit-s2').textContent = s2;
}

/* =============================================
   UTILS
   ============================================= */
function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}
