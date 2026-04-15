const API_URL = 'http://localhost:5000';

// --- CHECK LOGIN ON LOAD ---
window.onload = () => {
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');
if (token && username) {
showDashboard(username);
}
};

async function login() {
const email = document.getElementById('login-email').value;
const password = document.getElementById('login-password').value;

const response = await fetch(`${API_URL}/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
});

const data = await response.json();
if (response.ok) {
localStorage.setItem('token', data.token);
localStorage.setItem('userId', data.userId);
localStorage.setItem('username', data.username);
showDashboard(data.username);
} else {
alert(data.message);
}
}

function showDashboard(username) {
document.getElementById('auth-container').style.display = 'none';
document.getElementById('task-section').style.display = 'block';
document.getElementById('user-profile').style.display = 'flex';
document.getElementById('welcome-msg').innerText = `Hi, ${username}`;
document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
loadTasks();
}

async function loadTasks() {
const userId = localStorage.getItem('userId');
const response = await fetch(`${API_URL}/tasks/${userId}`);
const tasks = await response.json();
const list = document.getElementById('task-list');
list.innerHTML = '';

tasks.forEach(task => {
const dateDisplay = task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Date";
list.innerHTML += `
<div class="task-card">
<h3>#${task.id} ${task.title} <span class="badge">${task.category}</span></h3>
<p>${task.description}</p>
<small>📅 ${dateDisplay}</small>
<button onclick="deleteTask(${task.id})">🗑️</button>
</div>
`;
});
}

async function addTask() {
const taskData = {
user_id: localStorage.getItem('userId'),
title: document.getElementById('task-title').value,
description: document.getElementById('task-desc').value,
category: document.getElementById('task-category').value,
due_date: document.getElementById('task-date').value
};

await fetch(`${API_URL}/tasks`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(taskData)
});
loadTasks();
}

function logout() {
localStorage.clear();
location.reload();
}

