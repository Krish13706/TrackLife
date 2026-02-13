const notesField = document.getElementById("myNotes");
const statusMsg = document.getElementById("statusMsg");

// 1. Load data immediately when app opens
const savedNotes = localStorage.getItem("lifeOS_notes");

if (savedNotes) {
    notesField.value = savedNotes;
}

// 2. Save data on every keystroke
notesField.addEventListener("input", () => {
    localStorage.setItem("lifeOS_notes", notesField.value);
    
    // Optional: Visual feedback that it's saving
    statusMsg.textContent = "Saving...";
    setTimeout(() => {
        statusMsg.textContent = "Saved locally";
    }, 500);
});