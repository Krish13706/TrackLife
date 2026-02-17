document.addEventListener("DOMContentLoaded", () => {
    updateRank();
});

function updateRank() {
    // 1. Retrieve Data
    const gymWeight = parseFloat(localStorage.getItem('gymWeight')) || 0;
    const foodCals = parseFloat(localStorage.getItem('foodCals')) || 0;
    const foodProtein = parseFloat(localStorage.getItem('foodProtein')) || 0;
    const studyMins = parseFloat(localStorage.getItem('studyMins')) || 0;

    // 2. Define Goals
    const goals = {
        gym: 185,
        cals: 2000,
        protein: 120,
        study: 100
    };

    // 3. Calculate Scores
    let gymScore = (gymWeight / goals.gym) * 100;
    if (gymScore > 100) gymScore = 100;

    let calScore = (foodCals / goals.cals) * 100;
    let protScore = (foodProtein / goals.protein) * 100;
    if (calScore > 100) calScore = 100;
    if (protScore > 100) protScore = 100;
    let foodScore = (calScore + protScore) / 2;

    let studyScore = (studyMins / goals.study) * 100;
    if (studyScore > 100) studyScore = 100;

    // 4. Total Score
    const totalScore = (gymScore + foodScore + studyScore) / 3;

    // 5. Determine Rank
    let currentRank = "BRONZE";
    let rankColor = "#cd7f32"; 

    if (totalScore >= 85) {
        currentRank = "GOLD";
        rankColor = "#ffd700";
    } else if (totalScore >= 50) {
        currentRank = "SILVER";
        rankColor = "#c0c0c0";
    }

    // 6. Update UI
    const rankImg = document.getElementById('rank-img');
    const rankName = document.getElementById('rank-name');
    const progressBar = document.getElementById('progress-fill');

    rankName.innerText = currentRank;
    rankName.style.color = rankColor;
    rankImg.src = `RANKS/${currentRank}IMG.png`; 

    // IMPORTANT CHANGE FOR IPHONE BAR:
    // We update the CSS variable '--score' instead of width/height directly.
    // This connects to the style.css var(--score)
    progressBar.style.setProperty('--score', `${totalScore}%`);

    console.log(`Rank: ${currentRank} | Score: ${totalScore.toFixed(1)}%`);
}