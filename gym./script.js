/* gym/script.js */

document.addEventListener("DOMContentLoaded", () => {
    loadSavedData();
});

/* 1. Toggle Card Expansion */
function toggleCard(card) {
    // If clicking the active card, close it
    if (card.classList.contains('active')) {
        card.classList.remove('active');
        return;
    }

    // Close all other cards first
    document.querySelectorAll('.exercise-card').forEach(c => {
        c.classList.remove('active');
    });

    // Open the clicked card
    card.classList.add('active');
}

/* 2. Load Data from LocalStorage */
function loadSavedData() {
    // We check every input field. If there is saved data for its ID, we fill it.
    const inputs = document.querySelectorAll('.weight-input');
    
    inputs.forEach(input => {
        const key = input.id;
        if (key) {
            const savedValue = localStorage.getItem(key);
            if (savedValue) {
                input.value = savedValue;
            }
        }
    });
}

/* 3. Save Data */
function saveData(key, buttonElement) {
    const input = document.getElementById(key);
    const value = input.value;

    if (value) {
        // Save to Phone Memory
        localStorage.setItem(key, value);
        
        // Visual Feedback (Button changes color temporarily)
        const originalText = buttonElement.innerText;
        buttonElement.innerText = "Saved!";
        buttonElement.style.backgroundColor = "#10b981"; // Green color
        
        setTimeout(() => {
            buttonElement.innerText = originalText;
            buttonElement.style.backgroundColor = "#8b5cf6"; // Reset to purple
        }, 1500);
    }
}