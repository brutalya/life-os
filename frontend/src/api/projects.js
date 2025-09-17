// src/api/projects.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/projects';

export const getProjects = async () => {
	const token = localStorage.getItem('token');
	const response = await axios.get(API_URL, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return response.data;
};

export const createProject = async (title, spaceId) => {
	const token = localStorage.getItem('token');
	const response = await axios.post(
		API_URL,
		{ title, spaceId },
		{
			headers: { Authorization: `Bearer ${token}` },
		}
	);
	return response.data;
};

// --- НОВАЯ ФУНКЦИЯ ---
export const deleteProject = async (id) => {
	const token = localStorage.getItem('token');
	await axios.delete(`${API_URL}/${id}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
};
