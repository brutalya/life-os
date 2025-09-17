// src/api/auth.js
import axios from 'axios';

export const api = axios.create({
	baseURL: 'http://localhost:3000/api', // Адрес нашего бэкенда
	headers: {
		'Content-Type': 'application/json',
	},
});

export const setAuthToken = (token) => {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common['Authorization'];
	}
};
