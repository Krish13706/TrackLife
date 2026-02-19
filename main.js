/* main.js — root rank updater for index.html only */

document.addEventListener("DOMContentLoaded", () => {
    updateRank();
});

function updateRank() {
    const gymWeight  = parseFloat(localStorage.getItem('gymWeight'))  || 0;
    const foodCals   = parseFloat(localStorage.getItem('foodCals'))   || 0;
    const foodProtein= parseFloat(localStorage.getItem('foodProtein'))|| 0;
    const studyMins  = parseFloat(localStorage.getItem('studyMins'))  || 0;

    const goals = { gym: 185, cals: 2000, protein: 120, study: 100 };

    let gymScore  = Math.min((gymWeight / goals.gym) * 100, 100);
    let calScore  = Math.min((foodCals / goals.cals) * 100, 100);
    let protScore = Math.min((foodProtein / goals.protein) * 100, 100);
    let foodScore = (calScore + protScore) / 2;
    let studyScore= Math.min((studyMins / goals.study) * 100, 100);

    const totalScore = (gymScore + foodScore + studyScore) / 3;

    let currentRank = "BRONZE";
    let rankColor   = "#cd7f32";
    if (totalScore >= 85)      { currentRank = "GOLD";   rankColor = "#ffd700"; }
    else if (totalScore >= 50) { currentRank = "SILVER"; rankColor = "#c0c0c0"; }

    const rankImg  = document.getElementById('rank-img');
    const rankName = document.getElementById('rank-name');
    const progressBar = document.getElementById('progress-fill');

    if (rankName)     { rankName.innerText = currentRank; rankName.style.color = rankColor; }
    if (rankImg)      { rankImg.src = `RANKS/${currentRank}IMG.png`; }
    if (progressBar)  { progressBar.style.setProperty('--score', `${totalScore}%`); }

    console.log(`Rank: ${currentRank} | Score: ${totalScore.toFixed(1)}%`);
}
