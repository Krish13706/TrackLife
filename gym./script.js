/* gym/script.js */

document.addEventListener("DOMContentLoaded", () => {
    loadSavedData();
    renderCustomExercises();
    setupTransitions();
});

/* =============================================
   PAGE TRANSITIONS
   ============================================= */
function setupTransitions() {
    // Fade in on load
    document.body.classList.add('page-enter');
    setTimeout(() => document.body.classList.remove('page-enter'), 500);

    // Back button with smooth transition
    document.getElementById('back-btn').addEventListener('click', function() {
        const overlay = document.getElementById('page-transition-overlay');
        overlay.classList.add('overlay-active');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 400);
    });

    // FAB and top add button both open modal
    document.getElementById('fab-btn').addEventListener('click', openModal);
    document.getElementById('add-exercise-btn').addEventListener('click', openModal);
}

/* =============================================
   1. TOGGLE CARD EXPANSION
   ============================================= */
function toggleCard(card) {
    if (card.classList.contains('active')) {
        card.classList.remove('active');
        return;
    }
    document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
}

/* =============================================
   2. LOAD SAVED DATA
   ============================================= */
function loadSavedData() {
    // Load bench press (gymWeight key preserved for rank system)
    const benchCurrent = localStorage.getItem('gymWeight');
    const benchPrev    = localStorage.getItem('gymWeight_prev');
    if (benchCurrent) document.getElementById('gymWeight').value = benchCurrent;
    renderWeightHistory('gymWeight', benchCurrent, benchPrev);
    renderBadge('gymWeight', benchCurrent);
}

/* =============================================
   3. SAVE DATA (original function preserved)
   ============================================= */
function saveData(key, buttonElement) {
    const input = document.getElementById(key);
    const value = input.value.trim();

    if (!value || isNaN(value)) return;

    // Shift current → previous before saving new
    const existingCurrent = localStorage.getItem(key);
    if (existingCurrent) {
        localStorage.setItem(key + '_prev', existingCurrent);
    }

    localStorage.setItem(key, value);

    // Update history display
    const newCurrent = localStorage.getItem(key);
    const newPrev    = localStorage.getItem(key + '_prev');
    renderWeightHistory(key, newCurrent, newPrev);
    renderBadge(key, newCurrent);

    // Hide input row briefly for visual punch
    input.value = '';

    // Button feedback
    const icon = buttonElement.querySelector('iconify-icon') || null;
    const origHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = '<iconify-icon icon="lucide:check-circle" style="font-size:16px;"></iconify-icon> Saved!';
    buttonElement.classList.add('saved');

    setTimeout(() => {
        buttonElement.innerHTML = origHTML;
        buttonElement.classList.remove('saved');
    }, 1600);
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

    const isEditing = editRow.style.display !== 'none';

    if (isEditing) {
        // Close edit mode
        editRow.style.display = 'none';
        inputRow.style.display = 'flex';
        pill.classList.remove('editing');
        pill.innerHTML = '<iconify-icon icon="lucide:pencil" style="font-size:13px;"></iconify-icon> Edit';
    } else {
        // Open edit mode — pre-fill with current value
        const current = localStorage.getItem(key) || '';
        editInput.value = current;
        inputRow.style.display = 'none';
        editRow.style.display = 'flex';
        pill.classList.add('editing');
        pill.innerHTML = '<iconify-icon icon="lucide:x" style="font-size:13px;"></iconify-icon> Cancel';
        editInput.focus();
    }
}

function confirmEdit(key, buttonElement) {
    const editInput = document.getElementById(key + '-edit');
    const value = editInput.value.trim();
    if (!value || isNaN(value)) return;

    // Save corrected current (don't shift prev)
    localStorage.setItem(key, value);

    const current = localStorage.getItem(key);
    const prev    = localStorage.getItem(key + '_prev');
    renderWeightHistory(key, current, prev);
    renderBadge(key, current);

    // Close edit mode
    const inputRow = document.getElementById('input-row-' + key);
    const editRow  = document.getElementById('edit-row-' + key);
    editRow.style.display = 'none';
    inputRow.style.display = 'flex';

    // Update pill back
    const pill = document.querySelector(`[onclick="toggleEdit('${key}', event)"]`);
    if (pill) {
        pill.classList.remove('editing');
        pill.innerHTML = '<iconify-icon icon="lucide:pencil" style="font-size:13px;"></iconify-icon> Edit';
    }

    // Button feedback
    const origHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = '<iconify-icon icon="lucide:check-circle" style="font-size:16px;"></iconify-icon> Updated!';
    buttonElement.classList.add('saved');
    setTimeout(() => {
        buttonElement.innerHTML = origHTML;
        buttonElement.classList.remove('saved');
    }, 1500);
}

/* =============================================
   5. WEIGHT HISTORY DISPLAY
   ============================================= */
function renderWeightHistory(key, current, prev) {
    const container = document.getElementById('history-' + key);
    if (!container) return;

    if (!current && !prev) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    let html = '';

    if (prev) {
        const diff = current ? (parseFloat(current) - parseFloat(prev)).toFixed(1) : null;
        const diffSign = diff > 0 ? '+' : '';
        html += `
            <div class="weight-chip red-chip">
                <span class="chip-label">PREV</span>
                <span class="chip-value">${parseFloat(prev).toFixed(1)}</span>
                <span class="chip-unit">LBS</span>
            </div>
        `;
        if (current && diff !== null) {
            const diffClass = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';
            html += `
                <div class="weight-diff ${diffClass}">
                    <iconify-icon icon="lucide:arrow-right" style="font-size:12px; opacity:0.6;"></iconify-icon>
                    <span>${diffSign}${diff} lbs</span>
                </div>
            `;
        }
    }

    if (current) {
        html += `
            <div class="weight-chip green-chip">
                <span class="chip-label">NOW</span>
                <span class="chip-value">${parseFloat(current).toFixed(1)}</span>
                <span class="chip-unit">LBS</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderBadge(key, current) {
    const badge = document.getElementById('badge-' + key);
    if (!badge) return;
    if (current) {
        badge.textContent = current + ' lbs';
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

/* =============================================
   6. CUSTOM EXERCISES
   ============================================= */
function getCustomExercises() {
    try {
        return JSON.parse(localStorage.getItem('customExercises')) || [];
    } catch {
        return [];
    }
}

function saveCustomExercises(list) {
    localStorage.setItem('customExercises', JSON.stringify(list));
}

function renderCustomExercises() {
    const list = getCustomExercises();
    list.forEach(ex => buildExerciseCard(ex.id, ex.name));
}

function addCustomExercise() {
    const nameInput = document.getElementById('new-exercise-name');
    const name = nameInput.value.trim();
    if (!name) {
        nameInput.classList.add('input-error');
        setTimeout(() => nameInput.classList.remove('input-error'), 600);
        return;
    }

    const id = 'custom_' + Date.now();
    const list = getCustomExercises();
    list.push({ id, name });
    saveCustomExercises(list);

    buildExerciseCard(id, name);
    closeModal();
    nameInput.value = '';

    // Scroll to new card and open it
    setTimeout(() => {
        const newCard = document.getElementById('card-' + id);
        if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => toggleCard(newCard), 300);
        }
    }, 200);
}

function buildExerciseCard(id, name) {
    const list = document.getElementById('exercises-list');

    const card = document.createElement('div');
    card.className = 'exercise-card card-enter';
    card.id = 'card-' + id;
    card.setAttribute('data-key', id);
    card.setAttribute('data-label', name);
    card.setAttribute('onclick', 'toggleCard(this)');

    const current = localStorage.getItem(id) || '';
    const prev    = localStorage.getItem(id + '_prev') || '';

    card.innerHTML = `
        <div class="card-header">
            <div class="card-header-left">
                <span class="exercise-badge">
                    <iconify-icon icon="lucide:dumbbell" style="font-size: 14px;"></iconify-icon>
                </span>
                <span class="exercise-name">${escapeHTML(name)}</span>
            </div>
            <div class="card-header-right">
                <span class="current-weight-badge" id="badge-${id}" style="${current ? '' : 'display:none'}">${current ? current + ' lbs' : ''}</span>
                <iconify-icon icon="lucide:chevron-down" class="chevron-icon" style="font-size: 20px;"></iconify-icon>
            </div>
        </div>

        <div class="card-body" onclick="event.stopPropagation()">
            <div class="divider"></div>

            <div class="weight-history" id="history-${id}"></div>

            <div class="input-row" id="input-row-${id}">
                <div class="input-wrapper">
                    <input type="number" class="weight-input" id="${id}" placeholder="0" inputmode="decimal">
                    <span class="unit">LBS</span>
                </div>
                <button class="save-btn" onclick="saveCustomData('${id}', this)">
                    <iconify-icon icon="lucide:check" style="font-size:16px;"></iconify-icon>
                    Save
                </button>
            </div>

            <div class="edit-row" id="edit-row-${id}" style="display:none;">
                <div class="input-wrapper">
                    <input type="number" class="weight-input" id="${id}-edit" placeholder="0" inputmode="decimal">
                    <span class="unit">LBS</span>
                </div>
                <button class="confirm-edit-btn" onclick="confirmEdit('${id}', this)">
                    <iconify-icon icon="lucide:check" style="font-size:16px;"></iconify-icon>
                    Update
                </button>
            </div>

            <div class="card-actions">
                <button class="action-pill edit-pill" onclick="toggleEdit('${id}', event)">
                    <iconify-icon icon="lucide:pencil" style="font-size:13px;"></iconify-icon> Edit
                </button>
                <button class="action-pill delete-pill" onclick="deleteExercise('${id}', event)">
                    <iconify-icon icon="lucide:trash-2" style="font-size:13px;"></iconify-icon> Delete
                </button>
            </div>
        </div>
    `;

    list.appendChild(card);

    // Load saved values
    if (current) document.getElementById(id).value = '';
    renderWeightHistory(id, current || null, prev || null);

    // Trigger enter animation
    requestAnimationFrame(() => {
        card.classList.remove('card-enter');
        card.classList.add('card-visible');
    });
}

function saveCustomData(key, buttonElement) {
    const input = document.getElementById(key);
    const value = input.value.trim();
    if (!value || isNaN(value)) return;

    const existingCurrent = localStorage.getItem(key);
    if (existingCurrent) {
        localStorage.setItem(key + '_prev', existingCurrent);
    }
    localStorage.setItem(key, value);

    const current = localStorage.getItem(key);
    const prev    = localStorage.getItem(key + '_prev');
    renderWeightHistory(key, current, prev);
    renderBadge(key, current);
    input.value = '';

    const origHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = '<iconify-icon icon="lucide:check-circle" style="font-size:16px;"></iconify-icon> Saved!';
    buttonElement.classList.add('saved');
    setTimeout(() => {
        buttonElement.innerHTML = origHTML;
        buttonElement.classList.remove('saved');
    }, 1600);
}

function deleteExercise(id, event) {
    if (event) event.stopPropagation();

    const card = document.getElementById('card-' + id);
    if (!card) return;

    // Animate out
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95) translateX(20px)';

    setTimeout(() => {
        card.remove();
        // Remove from saved list
        const list = getCustomExercises().filter(ex => ex.id !== id);
        saveCustomExercises(list);
        // Clean up localStorage
        localStorage.removeItem(id);
        localStorage.removeItem(id + '_prev');
    }, 300);
}

/* =============================================
   7. MODAL
   ============================================= */
function openModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const card     = document.getElementById('modal-card');
    backdrop.classList.add('modal-open');
    setTimeout(() => card.classList.add('modal-card-open'), 10);
    setTimeout(() => document.getElementById('new-exercise-name').focus(), 300);
}

function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const card     = document.getElementById('modal-card');
    card.classList.remove('modal-card-open');
    setTimeout(() => backdrop.classList.remove('modal-open'), 300);
}

function setExerciseName(name) {
    document.getElementById('new-exercise-name').value = name;
    document.getElementById('new-exercise-name').focus();
}

// Close modal on backdrop click
document.getElementById('modal-backdrop').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

/* =============================================
   UTILS
   ============================================= */
function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}
