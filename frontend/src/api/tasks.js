// src/api/tasks.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
	const token = localStorage.getItem('token');
	if (!token) {
		throw new Error('No auth token found');
	}
	return { headers: { Authorization: `Bearer ${token}` } };
};

export const getInboxTasks = async () => {
	const response = await axios.get(
		`${API_BASE_URL}/tasks/inbox`,
		getAuthHeaders()
	);
	return response.data;
};

// --- НОВАЯ ФУНКЦИЯ ---
export const getTasksByProject = async (projectId) => {
	const response = await axios.get(
		`${API_BASE_URL}/projects/${projectId}/tasks`,
		getAuthHeaders()
	);
	return response.data;
};

export const createTask = async (title) => {
	const response = await axios.post(
		`${API_BASE_URL}/tasks`,
		{ title },
		getAuthHeaders()
	);
	return response.data;
};

export const moveTaskToProject = async (taskId, projectId) => {
	const response = await axios.patch(
		`${API_BASE_URL}/tasks/${taskId}/move`,
		{ projectId },
		getAuthHeaders()
	);
	return response.data;
};

export const updateTask = async (id, updates) => {
	const response = await axios.patch(
		`${API_BASE_URL}/tasks/${id}`,
		updates,
		getAuthHeaders()
	);
	return response.data;
};

export const deleteTask = async (id) => {
	await axios.delete(`${API_BASE_URL}/tasks/${id}`, getAuthHeaders());
};
