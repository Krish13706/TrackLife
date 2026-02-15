// --- DATA LOADING ---
let trackData = JSON.parse(localStorage.getItem('trackLifeData')) || {
    gym: { deadlift: 0, bench: 0, curls: 0 },
    food: [],
    study: 0
};

function saveData() {
    localStorage.setItem('trackLifeData', JSON.stringify(trackData));
}

// --- ROUTER ---
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

// --- GYM SECTION ---
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

// --- FOOD SECTION ---
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
    if(!list) return;
    list.innerHTML = '';
    let totalCal = 0, totalProt = 0;
    trackData.food.forEach((item, index) => {
        totalCal += item.cal;
        totalProt += item.prot;
        list.innerHTML += `<div class="food-item" style="display:flex; justify-content:space-between; margin-bottom:5px; background:rgba(255,255,255,0.05); padding:8px; border-radius:5px;">
            <span>${item.name}</span>
            <span>${item.cal}c / ${item.prot}p <span style="color:red; margin-left:10px;" onclick="deleteFood(${index})">X</span></span>
        </div>`;
    });
    document.getElementById('total-cals').innerText = totalCal;
    document.getElementById('total-prot').innerText = totalProt;
}

// --- STUDY SECTION ---
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
    if(!bar) return;
    let percentage = (time / 100) * 100;
    if (percentage > 100) percentage = 100;
    bar.style.width = percentage + "%";
}

// --- RANKING LOGIC ---
function calculateHomeRank() {
    const maxLift = Math.max(trackData.gym.deadlift, trackData.gym.bench, trackData.gym.curls);
    let gymPts = maxLift >= 185 ? 3 : (maxLift >= 155 ? 2 : 1);

    let totalCal = 0, totalProt = 0;
    trackData.food.forEach(f => { totalCal += f.cal; totalProt += f.prot; });
    let foodPts = (totalCal >= 2000 && totalProt >= 120) ? 3 : ((totalCal >= 1800 && totalProt >= 100) ? 2 : 1);

    let studyPts = trackData.study >= 100 ? 3 : (trackData.study >= 80 ? 2 : 1);

    const totalPoints = gymPts + foodPts + studyPts;
    const rankImg = document.getElementById('rank-img');
    const rankText = document.getElementById('rank-text');
    const progressBar = document.getElementById('rank-progress');

    if (totalPoints >= 8) {
        rankImg.src = "RANKS/GOLDIMG.png";
        rankText.innerText = "GOLD RANK";
        rankText.style.color = "#ffd700";
        progressBar.style.width = "100%";
        progressBar.style.background = "#ffd700";
    } else if (totalPoints >= 5) {
        rankImg.src = "RANKS/SILVERIMG.png";
        rankText.innerText = "SILVER RANK";
        rankText.style.color = "#e0e0e0";
        progressBar.style.width = "60%";
        progressBar.style.background = "#e0e0e0";
    } else {
        rankImg.src = "RANKS/BRONZEIMG.png";
        rankText.innerText = "BRONZE RANK";
        rankText.style.color = "#cd7f32";
        progressBar.style.width = "30%";
        progressBar.style.background = "#cd7f32";
    }
}