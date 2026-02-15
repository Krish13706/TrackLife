// --- DATA HANDLING ---
let trackData = JSON.parse(localStorage.getItem('trackLifeData')) || {
    gym: { deadlift: 0, bench: 0, curls: 0 },
    food: [],
    study: 0
};

function saveData() {
    localStorage.setItem('trackLifeData', JSON.stringify(trackData));
}

// --- PAGE ROUTER ---
window.onload = function() {
    if (document.getElementById('rank-text')) {
        calculateHomeRank(); 
    } 
    else if (document.getElementById('deadlift')) {
        loadGym(); 
    }
    else if (document.getElementById('food-list')) {
        loadFood(); 
    }
    else if (document.getElementById('study-time')) {
        loadStudy(); 
    }
};

// --- GYM LOGIC ---
function loadGym() {
    document.getElementById('deadlift').value = trackData.gym.deadlift || '';
    document.getElementById('bench').value = trackData.gym.bench || '';
    document.getElementById('curls').value = trackData.gym.curls || '';
}

function updateGym() {
    trackData.gym.deadlift = parseFloat(document.getElementById('deadlift').value) || 0;
    trackData.gym.bench = parseFloat(document.getElementById('bench').value) || 0;
    trackData.gym.curls = parseFloat(document.getElementById('curls').value) || 0;
    saveData();
}

// --- FOOD LOGIC ---
function loadFood() {
    renderFoodList();
}

function addFood() {
    const name = document.getElementById('food-name').value;
    const cal = parseFloat(document.getElementById('food-cal').value);
    const prot = parseFloat(document.getElementById('food-prot').value);

    if (name && cal && prot) {
        trackData.food.push({ name, cal, prot });
        saveData();
        renderFoodList();
        document.getElementById('food-name').value = '';
        document.getElementById('food-cal').value = '';
        document.getElementById('food-prot').value = '';
    }
}

function deleteFood(index) {
    trackData.food.splice(index, 1);
    saveData();
    renderFoodList();
}

function renderFoodList() {
    const list = document.getElementById('food-list');
    list.innerHTML = '';
    let totalCal = 0;
    let totalProt = 0;

    trackData.food.forEach((item, index) => {
        totalCal += item.cal;
        totalProt += item.prot;
        list.innerHTML += `
            <div class="food-item">
                <span>${item.name}</span>
                <span>${item.cal}c / ${item.prot}p <span class="delete-x" onclick="deleteFood(${index})">X</span></span>
            </div>
        `;
    });

    document.getElementById('total-cals').innerText = totalCal;
    document.getElementById('total-prot').innerText = totalProt;
}

// --- STUDY LOGIC ---
function loadStudy() {
    const time = trackData.study || 0;
    document.getElementById('study-time').value = time === 0 ? '' : time;
    updateStudyVisuals(time);
}

function updateStudy() {
    const time = parseFloat(document.getElementById('study-time').value) || 0;
    trackData.study = time;
    saveData();
    updateStudyVisuals(time);
}

function updateStudyVisuals(time) {
    const bar = document.getElementById('study-bar');
    let percentage = (time / 100) * 100;
    if (percentage > 100) percentage = 100;
    bar.style.width = percentage + "%";
}

// --- RANKING LOGIC ---
function calculateHomeRank() {
    // 1. Gym Score
    const maxLift = Math.max(trackData.gym.deadlift, trackData.gym.bench, trackData.gym.curls);
    let gymPoints = 1;
    if (maxLift >= 185) gymPoints = 3;
    else if (maxLift >= 155) gymPoints = 2;

    // 2. Food Score
    let totalCal = 0, totalProt = 0;
    trackData.food.forEach(f => { totalCal += f.cal; totalProt += f.prot; });
    let foodPoints = 1;
    if (totalCal >= 2000 && totalProt >= 120) foodPoints = 3;
    else if (totalCal >= 1800 && totalProt >= 100) foodPoints = 2;

    // 3. Study Score
    let studyPoints = 1;
    if (trackData.study >= 100) studyPoints = 3;
    else if (trackData.study >= 80) studyPoints = 2;

    const totalPoints = gymPoints + foodPoints + studyPoints;
    
    const rankImg = document.getElementById('rank-img');
    const rankText = document.getElementById('rank-text');
    const progressBar = document.getElementById('rank-progress');
    const msg = document.getElementById('msg-text');

    // === UPDATED PATHS: RANKS/ (No dot) ===
    if (totalPoints >= 8) {
        rankImg.src = "RANKS/GOLDIMG.png";
        rankText.innerText = "GOLD RANK";
        rankText.style.color = "#ffd700";
        progressBar.style.width = "100%";
        progressBar.style.background = "#ffd700";
        msg.innerText = "Solid, reliable performance.";
    } 
    else if (totalPoints >= 5) {
        rankImg.src = "RANKS/SILVERIMG.png";
        rankText.innerText = "SILVER RANK";
        rankText.style.color = "#e0e0e0";
        progressBar.style.width = "60%";
        progressBar.style.background = "#e0e0e0";
        msg.innerText = "Showing early skill.";
    } 
    else {
        rankImg.src = "RANKS/BRONZEIMG.png";
        rankText.innerText = "BRONZE RANK";
        rankText.style.color = "#cd7f32";
        progressBar.style.width = "30%";
        progressBar.style.background = "#cd7f32";
        msg.innerText = "Basic consistency unlocked.";
    }
}