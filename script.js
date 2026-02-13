const btn = document.getElementById("clickBtn");
const greeting = document.getElementById("greeting");

btn.addEventListener("click", () => {
    greeting.textContent = "Hello, Krish! Welcome to Life OS!";
});
