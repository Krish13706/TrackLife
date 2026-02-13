// --- STATE MANAGEMENT ---
// We store data in this object
let appData = {
    food: 0,
    gym: 0
};

// Load saved data immediately
const savedData = localStorage.getItem("lifeOS_simple_v1");
if (savedData) {
    appData = JSON.parse(savedData);
}
updateUI(); // Refresh screens on load

// --- NAVIGATION ---
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    // Show the requested page
    document.getElementById(pageId).style.display = 'flex';
}

// --- STATS LOGIC (Food & Gym) ---
function updateStat(type) {
    const inputId = type + "Input"; // e.g., "foodInput"
    const inputEl = document.getElementById(inputId);
    const valText = inputEl.value.trim();

    // Parse Input (supports "+10", "-5", "20")
    let change = parseInt(valText);
    
    if (!isNaN(change)) {
        // Apply math
        appData[type] += change;

        // LIMITS: Clamp between 0 and 100
        if (appData[type] > 100) appData[type] = 100;
        if (appData[type] < 0) appData[type] = 0;

        // Save & Render
        saveData();
        updateUI();
        inputEl.value = ""; // Clear box
    }
}

function updateUI() {
    // Update Food Bar
    document.getElementById("foodBar").style.width = appData.food + "%";
    document.getElementById("foodText").textContent = appData.food + "%";

    // Update Gym Bar
    document.getElementById("gymBar").style.width = appData.gym + "%";
    document.getElementById("gymText").textContent = appData.gym + "%";
}

function saveData() {
    localStorage.setItem("lifeOS_simple_v1", JSON.stringify(appData));
}


// --- TIMER LOGIC (Study) ---
let timerInterval;
let timeLeft = 50; // Seconds

function startTimer() {
    clearInterval(timerInterval); // Stop any existing timer
    timeLeft = 50; 
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Optional: Vibrate phone when done
            if(navigator.vibrate) navigator.vibrate(200);
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 50;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    // Format 9 seconds as "09"
    const seconds = timeLeft < 10 ? "0" + timeLeft : timeLeft;
    document.getElementById("timerText").textContent = "00:" + seconds;
}