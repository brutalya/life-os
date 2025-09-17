// src/components/AuthForm.jsx
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const AuthForm = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { login, register } = useContext(AuthContext);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		try {
			if (isLogin) {
				await login(email, password);
			} else {
				await register(email, password);
				alert('Регистрация прошла успешно! Теперь вы можете войти.');
				setIsLogin(true); // Переключить на форму входа после регистрации
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Произошла ошибка');
		}
	};

	return (
		<div
			style={{
				backgroundColor: 'var(--card-background)',
				padding: '2rem',
				borderRadius: '8px',
				boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
			}}
		>
			<h2>{isLogin ? 'Вход в Life OS' : 'Регистрация'}</h2>
			<form onSubmit={handleSubmit}>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<input
					type="password"
					placeholder="Пароль"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<button type="submit">
					{isLogin ? 'Войти' : 'Зарегистрироваться'}
				</button>
			</form>
			{error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
			<button
				onClick={() => setIsLogin(!isLogin)}
				style={{
					background: 'none',
					color: 'var(--accent-color)',
					width: '100%',
					marginTop: '1rem',
					border: 'none',
				}}
			>
				{isLogin ? 'У меня еще нет аккаунта' : 'Уже есть аккаунт'}
			</button>
		</div>
	);
};

export default AuthForm;
