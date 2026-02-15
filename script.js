// Data Structure Init
// We check if data exists in "iPhone memory" (localStorage), otherwise we create it.
let trackData = JSON.parse(localStorage.getItem('trackLifeData')) || {
    gym: {
        deadlift: 0,
        bench: 0,
        curls: 0
    },
    food: [], // Array of objects {name, cal, prot}
    study: 0 // Minutes
};

// --- INITIALIZATION ---
window.onload = function() {
    loadUI();
    calculateRank();
};

// --- CORE FUNCTIONS ---

// 1. Save to Memory
function saveData() {
    localStorage.setItem('trackLifeData', JSON.stringify(trackData));
    calculateRank();
}

// 2. Load UI from Memory
function loadUI() {
    // Gym
    document.getElementById('deadlift').value = trackData.gym.deadlift || '';
    document.getElementById('bench').value = trackData.gym.bench || '';
    document.getElementById('curls').value = trackData.gym.curls || '';

    // Study
    document.getElementById('study-time').value = trackData.study || '';

    // Food
    renderFoodList();
}

// 3. Update Data from Inputs
function updateData() {
    trackData.gym.deadlift = parseFloat(document.getElementById('deadlift').value) || 0;
    trackData.gym.bench = parseFloat(document.getElementById('bench').value) || 0;
    trackData.gym.curls = parseFloat(document.getElementById('curls').value) || 0;
    trackData.study = parseFloat(document.getElementById('study-time').value) || 0;
    
    saveData();
}

// 4. Food Logic
function addFood() {
    const name = document.getElementById('food-name').value;
    const cal = parseFloat(document.getElementById('food-cal').value);
    const prot = parseFloat(document.getElementById('food-prot').value);

    if (name && cal && prot) {
        trackData.food.push({ name, cal, prot });
        // Clear inputs
        document.getElementById('food-name').value = '';
        document.getElementById('food-cal').value = '';
        document.getElementById('food-prot').value = '';
        renderFoodList();
        saveData();
    }
}

function deleteFood(index) {
    trackData.food.splice(index, 1);
    renderFoodList();
    saveData();
}

function renderFoodList() {
    const list = document.getElementById('food-list');
    list.innerHTML = '';
    
    let totalCal = 0;
    let totalProt = 0;

    trackData.food.forEach((item, index) => {
        totalCal += item.cal;
        totalProt += item.prot;

        const div = document.createElement('div');
        div.className = 'food-item';
        div.innerHTML = `
            <span>${item.name}</span>
            <span>${item.cal}cal / ${item.prot}g <b class="delete-x" onclick="deleteFood(${index})">x</b></span>
        `;
        list.appendChild(div);
    });

    document.getElementById('total-cals').innerText = totalCal;
    document.getElementById('total-prot').innerText = totalProt;
}

// --- RANKING LOGIC ---
function calculateRank() {
    // Calculate Totals
    const maxLift = Math.max(trackData.gym.deadlift, trackData.gym.bench, trackData.gym.curls);
    
    let totalCal = 0;
    let totalProt = 0;
    trackData.food.forEach(f => { totalCal += f.cal; totalProt += f.prot; });

    const studyTime = trackData.study;

    // Determine Category Ranks (0=Bronze, 1=Silver, 2=Gold)
    
    // GYM: Gold(185), Silver(155), Bronze(<155)
    let gymRank = 0;
    if (maxLift >= 185) gymRank = 2;
    else if (maxLift >= 155) gymRank = 1;

    // FOOD: Gold(2000c+120p), Silver(1800c+100p)
    let foodRank = 0;
    if (totalCal >= 2000 && totalProt >= 120) foodRank = 2;
    else if (totalCal >= 1800 && totalProt >= 100) foodRank = 1;

    // STUDY: Gold(100), Silver(80)
    let studyRank = 0;
    if (studyTime >= 100) studyRank = 2;
    else if (studyTime >= 80) studyRank = 1;

    // Final Rank Logic: Average score or Lowest Category?
    // Let's use an Average Score for smoothness. 
    // Total points possible: 6. 
    // Bronze: 0-2 pts, Silver: 3-4 pts, Gold: 5-6 pts.
    
    const totalScore = gymRank + foodRank + studyRank;
    
    const rankImg = document.getElementById('rank-img');
    const rankText = document.getElementById('rank-text');
    const progressBar = document.getElementById('rank-progress');

    if (totalScore >= 5) {
        // GOLD STATUS
        rankImg.src = 'GOLDIMG.png';
        rankText.innerText = "GOLD RANK";
        rankText.style.color = "#ffd700";
        progressBar.style.width = "100%";
        progressBar.style.background = "#ffd700";
    } else if (totalScore >= 3) {
        // SILVER STATUS
        rankImg.src = 'SILVERIMG.png';
        rankText.innerText = "SILVER RANK";
        rankText.style.color = "#c0c0c0";
        progressBar.style.width = "66%";
        progressBar.style.background = "#c0c0c0";
    } else {
        // BRONZE STATUS
        rankImg.src = 'BRONZEIMG.png';
        rankText.innerText = "BRONZE RANK";
        rankText.style.color = "#cd7f32";
        progressBar.style.width = "33%";
        progressBar.style.background = "#cd7f32";
    }
}