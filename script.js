document.addEventListener("DOMContentLoaded", () => {
    updateRank();
});

function updateRank() {
    // 1. Retrieve Data from Local Storage (Default to 0 if empty)
    // Note: You must ensure your other pages save data using these exact keys
    const gymWeight = parseFloat(localStorage.getItem('gymWeight')) || 0; // lbs
    const foodCals = parseFloat(localStorage.getItem('foodCals')) || 0;
    const foodProtein = parseFloat(localStorage.getItem('foodProtein')) || 0;
    const studyMins = parseFloat(localStorage.getItem('studyMins')) || 0;

    // 2. Define Goals (Based on README Gold Standards)
    const goals = {
        gym: 185,       // 185lbs for Gold
        cals: 2000,     // 2000 cals for Gold
        protein: 120,   // 120g protein for Gold
        study: 100      // 100 mins for Gold
    };

    // 3. Calculate Scores (0 to 100%)
    // We cap them at 100 so over-achieving in one area doesn't carry a lazy area too much
    
    let gymScore = (gymWeight / goals.gym) * 100;
    if (gymScore > 100) gymScore = 100;

    // For food, we average the progress of Calories and Protein
    let calScore = (foodCals / goals.cals) * 100;
    let protScore = (foodProtein / goals.protein) * 100;
    if (calScore > 100) calScore = 100;
    if (protScore > 100) protScore = 100;
    let foodScore = (calScore + protScore) / 2;

    let studyScore = (studyMins / goals.study) * 100;
    if (studyScore > 100) studyScore = 100;

    // 4. Calculate Total Average Score
    // (Gym + Food + Study) / 3
    const totalScore = (gymScore + foodScore + studyScore) / 3;

    // 5. Determine Rank based on Total Score
    // Adjust these thresholds if it still feels too hard!
    let currentRank = "BRONZE";
    let rankColor = "#cd7f32"; // Bronze color

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
    
    // Update Image Source
    // Ensure these images exist in your RANKS folder as specified in README
    rankImg.src = `RANKS/${currentRank}IMG.png`; 

    // Animate the sidebar bar
    // We use the totalScore as the height percentage
    progressBar.style.height = `${totalScore}%`;
    
    // Optional: Log for debugging
    console.log(`Scores - Gym: ${gymScore}%, Food: ${foodScore}%, Study: ${studyScore}%`);
    console.log(`Total: ${totalScore}% -> Rank: ${currentRank}`);
}