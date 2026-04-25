const API_URL = "http://localhost:5000";

// 1. Register a new user
export const registerUser = async (username, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    return response.json();
};

// 2. Login
export const loginUser = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    return response.json();
};

// 3. Create a Task
export const createTask = async (taskData) => {
    const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData), // taskData should have title, description, and user_id
    });
    return response.json();
};

// 4. Get All Tasks
export const getTasks = async () => {
    const response = await fetch(`${API_URL}/tasks`);
    return response.json();
};