// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../api/auth.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem('token'));
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (token) {
			setAuthToken(token);
			// Здесь в будущем можно будет добавить запрос для получения данных пользователя
			// Для простоты пока будем хранить только токен
			setUser({ token }); // Условно считаем пользователя авторизованным, если есть токен
		}
		setLoading(false);
	}, [token]);

	const login = async (email, password) => {
		const response = await api.post('/auth/login', { email, password });
		const { token, user } = response.data;
		localStorage.setItem('token', token);
		setToken(token);
		setUser(user);
		setAuthToken(token);
	};

	const register = async (email, password) => {
		await api.post('/auth/register', { email, password });
	};

	const logout = () => {
		localStorage.removeItem('token');
		setToken(null);
		setUser(null);
		setAuthToken(null);
	};

	if (loading) {
		return <div>Загрузка...</div>;
	}

	return (
		<AuthContext.Provider value={{ user, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
