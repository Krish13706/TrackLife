/* script.js — Gym Tracker */

/* =============================================
   GLOBALS
   ============================================= */
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based
let activeDayKey = null; // 'YYYY-MM-DD' of currently open day panel

/* =============================================
   INIT
   ============================================= */
document.addEventListener("DOMContentLoaded", () => {
    setupTransitions();
    renderCustomExercises();
    updateStatsStrip();
    initTimer();
    renderCalendar();
    // Start on calendar tab (default)
    switchTab('calendar');
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
   TAB SWITCHING
   ============================================= */
function switchTab(tab) {
    const calView  = document.getElementById('view-calendar');
    const wrkView  = document.getElementById('view-workouts');
    const tabCal   = document.getElementById('tab-calendar');
    const tabWrk   = document.getElementById('tab-workouts');
    const fab      = document.getElementById('fab-btn');
    const addBtn   = document.getElementById('add-exercise-btn');
    const titleEl  = document.getElementById('page-title-text');

    if (tab === 'calendar') {
        calView.classList.remove('hidden');
        wrkView.classList.add('hidden');
        tabCal.classList.add('active');
        tabWrk.classList.remove('active');
        fab.style.display    = 'none';
        addBtn.style.display = 'none';
        titleEl.textContent  = 'Gym Tracker';
        renderCalendar();
    } else {
        wrkView.classList.remove('hidden');
        calView.classList.add('hidden');
        tabWrk.classList.add('active');
        tabCal.classList.remove('active');
        fab.style.display    = 'flex';
        addBtn.style.display = 'flex';
        titleEl.textContent  = 'Workouts';
    }
}

/* =============================================
   CALENDAR — DATA HELPERS
   ============================================= */
function dayKey(year, month, day) {
    // month is 0-based here
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

function getDayLog(key) {
    try { return JSON.parse(localStorage.getItem('wlog_' + key)) || []; }
    catch { return []; }
}

function setDayLog(key, arr) {
    localStorage.setItem('wlog_' + key, JSON.stringify(arr));
}

function isRestDay(key) {
    return localStorage.getItem('restday_' + key) === '1';
}

function setRestDay(key, val) {
    if (val) localStorage.setItem('restday_' + key, '1');
    else localStorage.removeItem('restday_' + key);
}

/** Returns 'none' | 'low' | 'mid' | 'high' | 'rest' */
function getDayLevel(key) {
    if (isRestDay(key)) return 'rest';
    const count = getDayLog(key).length;
    if (count >= 10) return 'high';
    if (count >= 5)  return 'mid';
    if (count >= 1)  return 'low';
    return 'none';
}

/** Log a save event to today's day log */
function logToDay(name, weight) {
    const today = todayKey();
    const log   = getDayLog(today);
    log.push({ name, weight, time: Date.now() });
    setDayLog(today, log);
}

function todayKey() {
    const now = new Date();
    return dayKey(now.getFullYear(), now.getMonth(), now.getDate());
}

/* =============================================
   CALENDAR — RENDER
   ============================================= */
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function renderCalendar() {
    const label = document.getElementById('cal-month-label');
    const grid  = document.getElementById('cal-grid');
    label.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = dayKey(today.getFullYear(), today.getMonth(), today.getDate());

    let html = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-cell cal-empty"></div>`;
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const key   = dayKey(calYear, calMonth, d);
        const level = getDayLevel(key);
        const isToday = (key === todayStr);
        const isFuture = new Date(calYear, calMonth, d) > today;

        let dotClass = `dot-${level}`;
        let cellClass = 'cal-cell';
        if (isToday) cellClass += ' cal-today';
        if (isFuture) cellClass += ' cal-future';

        html += `
            <div class="${cellClass}" onclick="openDayPanel('${key}', ${d})">
                <span class="cal-day-num">${d}</span>
                <span class="cal-dot ${dotClass}"></span>
            </div>`;
    }

    grid.innerHTML = html;
}

function calPrevMonth() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
}
function calNextMonth() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
}

/* =============================================
   DAY DETAIL PANEL
   ============================================= */
function openDayPanel(key, dayNum) {
    activeDayKey = key;
    const backdrop = document.getElementById('day-backdrop');
    const panel    = document.getElementById('day-panel');

    // Format date label
    const date = new Date(calYear, calMonth, dayNum);
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    document.getElementById('day-panel-date').textContent =
        `${dayNames[date.getDay()]}, ${MONTH_NAMES[calMonth]} ${dayNum}, ${calYear}`;

    renderDayPanel(key);

    backdrop.classList.add('open');
    setTimeout(() => panel.classList.add('open'), 10);
}

function renderDayPanel(key) {
    const log       = getDayLog(key);
    const restDay   = isRestDay(key);
    const logList   = document.getElementById('day-log-list');
    const dayEmpty  = document.getElementById('day-empty');
    const restBanner= document.getElementById('rest-banner');
    const subEl     = document.getElementById('day-panel-sub');
    const restBtn   = document.getElementById('rest-day-btn-label');

    // Sub-title
    subEl.textContent = restDay ? 'Rest & Recovery' : `${log.length} exercise${log.length !== 1 ? 's' : ''} logged`;

    // Rest banner
    restBanner.style.display = restDay ? 'flex' : 'none';

    // Rest button label
    restBtn.textContent = restDay ? 'Remove Rest Day' : 'Mark as Rest Day';
    document.getElementById('rest-day-btn').classList.toggle('is-rest', restDay);

    // Exercise log
    if (log.length === 0 || restDay) {
        logList.innerHTML = '';
        dayEmpty.style.display = (restDay ? 'none' : 'flex');
    } else {
        dayEmpty.style.display = 'none';
        logList.innerHTML = log.map((entry, i) => `
            <div class="day-log-entry" style="animation-delay:${i * 0.04}s">
                <div class="day-log-name">${escapeHTML(entry.name)}</div>
                <div class="day-log-weight">${entry.weight} <span>LBS</span></div>
            </div>
        `).join('');
    }
}

function closeDayPanel() {
    const backdrop = document.getElementById('day-backdrop');
    const panel    = document.getElementById('day-panel');
    panel.classList.remove('open');
    setTimeout(() => backdrop.classList.remove('open'), 340);
    activeDayKey = null;
}

function toggleRestDay() {
    if (!activeDayKey) return;
    const current = isRestDay(activeDayKey);
    setRestDay(activeDayKey, !current);
    renderDayPanel(activeDayKey);
    renderCalendar(); // refresh dots
}

/* =============================================
   1. TOGGLE EXERCISE CARD
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

    // Log to today's calendar day
    const card  = document.querySelector(`[data-key="${key}"]`);
    const label = card ? card.dataset.label : key;
    logToDay(label, value);

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
    if (prev) html += `<div class="weight-chip red-chip"><span class="chip-label">PREV</span><span class="chip-value">${parseFloat(prev).toFixed(1)}</span><span class="chip-unit">LBS</span></div>`;
    if (current && prev) {
        const diff = (parseFloat(current) - parseFloat(prev)).toFixed(1);
        const sign = diff > 0 ? '+' : '';
        const cls  = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';
        html += `<div class="weight-diff ${cls}"><iconify-icon icon="lucide:arrow-right" style="font-size:11px;opacity:0.5;"></iconify-icon> ${sign}${diff} lbs</div>`;
    }
    if (current) html += `<div class="weight-chip green-chip"><span class="chip-label">NOW</span><span class="chip-value">${parseFloat(current).toFixed(1)}</span><span class="chip-unit">LBS</span></div>`;
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
    if (!bar || !current || !goal) { if(bar) bar.style.width = '0%'; return; }
    bar.style.width = Math.min((parseFloat(current) / goal) * 100, 100) + '%';
}

/* =============================================
   5. STATS STRIP
   ============================================= */
function updateStatsStrip() {
    const exercises = getCustomExercises();
    const logged    = exercises.filter(e => localStorage.getItem(e.id));
    let topLift = 0;
    logged.forEach(e => { const v = parseFloat(localStorage.getItem(e.id)); if (v > topLift) topLift = v; });
    document.getElementById('stat-bench').textContent = topLift > 0 ? topLift + ' lbs' : '—';
    let totalPct = 0;
    exercises.forEach(ex => { const v = parseFloat(localStorage.getItem(ex.id)) || 0; totalPct += Math.min((v / (parseFloat(ex.goal) || 200)) * 100, 100); });
    document.getElementById('stat-progress').textContent = exercises.length > 0 ? Math.round(totalPct / exercises.length) + '%' : '0%';
    document.getElementById('stat-lifts').textContent = logged.length;
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = exercises.length === 0 ? 'flex' : 'none';
}

/* =============================================
   6. MINI CHART
   ============================================= */
function getHistory(key) { try { return JSON.parse(localStorage.getItem(key + '_history')) || []; } catch { return []; } }
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
    const current = localStorage.getItem(key), prev = localStorage.getItem(key + '_prev');
    if (hist.length === 0 && current) {
        if (prev) hist = [{ v: parseFloat(prev), t: Date.now() - 86400000 }, { v: parseFloat(current), t: Date.now() }];
        else hist = [{ v: parseFloat(current), t: Date.now() }];
    }
    if (hist.length < 2) { canvas.style.display = 'none'; if (noData) noData.style.display = 'flex'; return; }
    canvas.style.display = 'block'; if (noData) noData.style.display = 'none';
    const dpr = window.devicePixelRatio || 1, W = canvas.offsetWidth, H = 80;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const values = hist.map(h => h.v);
    const minV = Math.min(...values) * 0.96, maxV = Math.max(...values) * 1.04, range = maxV - minV || 1;
    const padL = 4, padR = 4, padT = 10, padB = 4, cW = W - padL - padR, cH = H - padT - padB;
    const xOf = i => padL + (i / (hist.length - 1)) * cW;
    const yOf = v => padT + cH - ((v - minV) / range) * cH;
    const grad = ctx.createLinearGradient(0, padT, 0, H);
    grad.addColorStop(0, 'rgba(249,115,22,0.35)'); grad.addColorStop(1, 'rgba(249,115,22,0.0)');
    ctx.beginPath(); ctx.moveTo(xOf(0), H); ctx.lineTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < hist.length; i++) { const cpx = (xOf(i-1)+xOf(i))/2; ctx.bezierCurveTo(cpx,yOf(values[i-1]),cpx,yOf(values[i]),xOf(i),yOf(values[i])); }
    ctx.lineTo(xOf(hist.length-1),H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xOf(0),yOf(values[0]));
    for (let i = 1; i < hist.length; i++) { const cpx = (xOf(i-1)+xOf(i))/2; ctx.bezierCurveTo(cpx,yOf(values[i-1]),cpx,yOf(values[i]),xOf(i),yOf(values[i])); }
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    const lx = xOf(hist.length-1), ly = yOf(values[values.length-1]);
    ctx.beginPath(); ctx.arc(lx,ly,4,0,Math.PI*2); ctx.fillStyle='#f97316'; ctx.fill();
    ctx.beginPath(); ctx.arc(lx,ly,7,0,Math.PI*2); ctx.fillStyle='rgba(249,115,22,0.25)'; ctx.fill();
    const bW=46,bH=24,bR=6; let bx=lx-bW/2, by=ly-bH-10;
    if(by<padT) by=ly+8; bx=Math.max(padL,Math.min(bx,W-padR-bW));
    roundRect(ctx,bx,by,bW,bH,bR); ctx.fillStyle='#fff'; ctx.fill();
    ctx.fillStyle='#000'; ctx.font='bold 12px Inter,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(values[values.length-1].toFixed(0),bx+bW/2,by+bH/2);
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

/* =============================================
   7. CUSTOM EXERCISES
   ============================================= */
function getCustomExercises() { try { return JSON.parse(localStorage.getItem('customExercises')) || []; } catch { return []; } }
function saveCustomExercises(list) { localStorage.setItem('customExercises', JSON.stringify(list)); }

function renderCustomExercises() {
    getCustomExercises().forEach(ex => buildExerciseCard(ex.id, ex.name, ex.goal));
    updateStatsStrip();
}

function addCustomExercise() {
    const nameInput = document.getElementById('new-exercise-name');
    const goalInput = document.getElementById('new-exercise-goal');
    const name = nameInput.value.trim();
    if (!name) { nameInput.classList.add('input-error'); setTimeout(() => nameInput.classList.remove('input-error'), 600); return; }
    const id = 'custom_' + Date.now(), goal = parseFloat(goalInput.value) || 200;
    const list = getCustomExercises(); list.push({ id, name, goal }); saveCustomExercises(list);
    buildExerciseCard(id, name, goal); closeModal(); nameInput.value = ''; goalInput.value = '';
    updateStatsStrip();
    setTimeout(() => { const card = document.getElementById('card-' + id); if (card) { card.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(() => toggleCard(card), 280); } }, 200);
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
        <button class="card-close-btn" onclick="deleteExercise('${id}', event)">
            <iconify-icon icon="lucide:x" style="font-size:13px;"></iconify-icon>
        </button>
        <div class="card-collapsed">
            <div class="ex-left">
                <span class="ex-name">${escapeHTML(name)}</span>
                <div class="progress-track"><div class="progress-fill-bar" id="bar-${id}" style="width:${pct}%"></div></div>
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
        </div>`;

    const emptyState = document.getElementById('empty-state');
    list.insertBefore(card, emptyState);
    renderWeightHistory(id, current || null, prev || null);

    card.style.opacity = '0'; card.style.transform = 'translateY(14px)';
    requestAnimationFrame(() => { card.style.transition = 'opacity 0.35s ease, transform 0.35s ease'; card.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
}

function deleteExercise(id, event) {
    if (event) event.stopPropagation();
    const card = document.getElementById('card-' + id);
    if (!card) return;
    card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    card.style.opacity = '0'; card.style.transform = 'scale(0.95) translateX(16px)';
    setTimeout(() => { card.remove(); saveCustomExercises(getCustomExercises().filter(e => e.id !== id)); localStorage.removeItem(id); localStorage.removeItem(id+'_prev'); localStorage.removeItem(id+'_history'); updateStatsStrip(); }, 260);
}

/* =============================================
   8. MODAL
   ============================================= */
function openModal() {
    document.getElementById('modal-backdrop').classList.add('modal-open');
    setTimeout(() => { document.getElementById('modal-card').classList.add('modal-card-open'); setTimeout(() => document.getElementById('new-exercise-name').focus(), 280); }, 10);
}
function closeModal() {
    document.getElementById('modal-card').classList.remove('modal-card-open');
    setTimeout(() => document.getElementById('modal-backdrop').classList.remove('modal-open'), 320);
}
function setExerciseName(name) { document.getElementById('new-exercise-name').value = name; document.getElementById('new-exercise-name').focus(); }

/* =============================================
   9. TIMER
   ============================================= */
let timerInterval = null, timerRemaining = 0, timerTotal = 0, timerRunning = false, timerPanelOpen = false;

function initTimer() { updateTimerDisplay(0, 0); }

function toggleTimerPanel() {
    timerPanelOpen = !timerPanelOpen;
    const panel = document.getElementById('timer-panel');
    const chevron = document.getElementById('timer-chevron');
    if (timerPanelOpen) { panel.classList.add('open'); chevron.style.transform = 'rotate(180deg)'; }
    else { panel.classList.remove('open'); chevron.style.transform = 'rotate(0deg)'; }
}

function setPreset(mins, secs) {
    document.getElementById('timer-minutes').value = mins;
    document.getElementById('timer-seconds').value = secs || '';
    document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function startTimer() {
    if (timerRunning) {
        clearInterval(timerInterval); timerRunning = false;
        document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:play');
        document.getElementById('timer-btn-label').textContent = 'Resume';
        document.getElementById('timer-status').textContent = 'PAUSED';
        document.getElementById('timer-dock').classList.remove('timer-running');
        return;
    }
    if (timerRemaining === 0) {
        const mins = parseInt(document.getElementById('timer-minutes').value) || 0;
        const secs = parseInt(document.getElementById('timer-seconds').value) || 0;
        timerTotal = timerRemaining = mins * 60 + secs;
        if (timerTotal === 0) return;
    }
    timerRunning = true;
    document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:pause');
    document.getElementById('timer-btn-label').textContent = 'Pause';
    document.getElementById('timer-status').textContent = 'RUNNING';
    document.getElementById('timer-dock').classList.add('timer-running');
    timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerDisplay(Math.floor(timerRemaining / 60), timerRemaining % 60);
        if (timerRemaining <= 0) {
            clearInterval(timerInterval); timerRunning = false; timerRemaining = 0;
            document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:play');
            document.getElementById('timer-btn-label').textContent = 'Start';
            document.getElementById('timer-status').textContent = 'DONE!';
            document.getElementById('timer-dock').classList.remove('timer-running');
            document.getElementById('timer-dock').classList.add('timer-done');
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setTimeout(() => { document.getElementById('timer-dock').classList.remove('timer-done'); document.getElementById('timer-status').textContent = 'REST TIMER'; }, 3000);
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval); timerRunning = false; timerRemaining = 0; timerTotal = 0;
    updateTimerDisplay(0, 0);
    document.getElementById('timer-play-icon').setAttribute('icon', 'lucide:play');
    document.getElementById('timer-btn-label').textContent = 'Start';
    document.getElementById('timer-status').textContent = 'REST TIMER';
    document.getElementById('timer-dock').classList.remove('timer-running', 'timer-done');
    document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
}

function updateTimerDisplay(m, s) {
    document.getElementById('digit-m1').textContent = Math.floor(m / 10);
    document.getElementById('digit-m2').textContent = m % 10;
    document.getElementById('digit-s1').textContent = Math.floor(s / 10);
    document.getElementById('digit-s2').textContent = s % 10;
}

/* =============================================
   UTILS
   ============================================= */
function escapeHTML(str) { const d = document.createElement('div'); d.appendChild(document.createTextNode(str)); return d.innerHTML; }
