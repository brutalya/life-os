// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ... (существующий код до конца файла) ...
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
});
pool.query('SELECT NOW()', (err, res) => {
	if (err) {
		console.error('Ошибка подключения к базе данных!', err.stack);
	} else {
		console.log('Успешное подключение к базе данных:', res.rows[0].now);
	}
});
app.use(cors());
app.use(express.json());
const verifyToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (!token)
		return res
			.status(401)
			.json({ message: 'Доступ запрещен: токен не предоставлен' });
	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err)
			return res
				.status(403)
				.json({ message: 'Доступ запрещен: неверный токен' });
		req.user = user;
		next();
	});
};
app.post('/api/auth/register', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password)
			return res.status(400).json({ message: 'Email и пароль обязательны' });
		const userExists = await pool.query(
			'SELECT * FROM users WHERE email = $1',
			[email]
		);
		if (userExists.rows.length > 0)
			return res
				.status(409)
				.json({ message: 'Пользователь с таким email уже существует' });
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);
		const newUser = await pool.query(
			'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
			[email, passwordHash]
		);
		const user = newUser.rows[0];
		const token = jwt.sign(
			{ userId: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);
		res
			.status(201)
			.json({ message: 'Пользователь успешно зарегистрирован', token, user });
	} catch (error) {
		console.error('Ошибка регистрации:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.post('/api/auth/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password)
			return res.status(400).json({ message: 'Введите email и пароль' });
		const result = await pool.query('SELECT * FROM users WHERE email = $1', [
			email,
		]);
		const user = result.rows[0];
		if (!user)
			return res.status(401).json({ message: 'Неверные учетные данные' });
		const isMatch = await bcrypt.compare(password, user.password_hash);
		if (!isMatch)
			return res.status(401).json({ message: 'Неверные учетные данные' });
		const token = jwt.sign(
			{ userId: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);
		res.json({
			message: 'Вход выполнен успешно',
			token,
			user: { id: user.id, email: user.email },
		});
	} catch (error) {
		console.error('Ошибка входа:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.get('/api/tasks/inbox', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user;
		const result = await pool.query(
			'SELECT * FROM tasks WHERE user_id = $1 AND is_inbox = TRUE ORDER BY created_at DESC',
			[userId]
		);
		res.json(result.rows);
	} catch (error) {
		console.error('Ошибка получения задач инбокса:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.get('/api/projects/:projectId/tasks', verifyToken, async (req, res) => {
	try {
		const { projectId } = req.params;
		const { userId } = req.user;
		const projectAccess = await pool.query(
			'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
			[projectId, userId]
		);
		if (projectAccess.rows.length === 0)
			return res.status(404).json({ message: 'Проект не найден' });
		const result = await pool.query(
			'SELECT * FROM tasks WHERE user_id = $1 AND project_id = $2 ORDER BY created_at DESC',
			[userId, projectId]
		);
		res.json(result.rows);
	} catch (error) {
		console.error('Ошибка получения задач проекта:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.post('/api/tasks', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user;
		const { title } = req.body;
		if (!title)
			return res.status(400).json({ message: 'Название задачи обязательно' });
		const result = await pool.query(
			'INSERT INTO tasks (user_id, title, is_inbox) VALUES ($1, $2, TRUE) RETURNING *',
			[userId, title]
		);
		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error('Ошибка создания задачи:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.patch('/api/tasks/:id', verifyToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.user;
		const { is_completed } = req.body;
		const result = await pool.query(
			'UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
			[is_completed, id, userId]
		);
		if (result.rows.length === 0)
			return res.status(404).json({ message: 'Задача не найдена' });
		res.json(result.rows[0]);
	} catch (error) {
		console.error('Ошибка обновления задачи:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.user;
		const result = await pool.query(
			'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
			[id, userId]
		);
		if (result.rowCount === 0)
			return res.status(404).json({ message: 'Задача не найдена' });
		res.status(204).send();
	} catch (error) {
		console.error('Ошибка удаления задачи:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.patch('/api/tasks/:id/move', verifyToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.user;
		const { projectId } = req.body;
		const result = await pool.query(
			'UPDATE tasks SET project_id = $1, is_inbox = FALSE WHERE id = $2 AND user_id = $3 RETURNING *',
			[projectId, id, userId]
		);
		if (result.rows.length === 0)
			return res.status(404).json({ message: 'Задача не найдена' });
		res.json(result.rows[0]);
	} catch (error) {
		console.error('Ошибка перемещения задачи:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.get('/api/spaces', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user;
		const result = await pool.query('SELECT * FROM spaces WHERE user_id = $1', [
			userId,
		]);
		res.json(result.rows);
	} catch (error) {
		console.error('Ошибка получения пространств:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.post('/api/spaces', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user;
		const { title } = req.body;
		if (!title)
			return res
				.status(400)
				.json({ message: 'Название пространства обязательно' });
		const result = await pool.query(
			'INSERT INTO spaces (user_id, title) VALUES ($1, $2) RETURNING *',
			[userId, title]
		);
		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error('КРИТИЧЕСКАЯ ОШИБКА при создании пространства:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.get('/api/projects', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user;
		const result = await pool.query(
			'SELECT * FROM projects WHERE user_id = $1',
			[userId]
		);
		res.json(result.rows);
	} catch (error) {
		console.error('Ошибка получения проектов:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});
app.post('/api/projects', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user;
		const { title, spaceId } = req.body;
		if (!title || !spaceId)
			return res
				.status(400)
				.json({ message: 'Название проекта и ID пространства обязательны' });
		const result = await pool.query(
			'INSERT INTO projects (user_id, space_id, title) VALUES ($1, $2, $3) RETURNING *',
			[userId, spaceId, title]
		);
		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error('КРИТИЧЕСКАЯ ОШИБКА при создании проекта:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});

// --- НОВЫЕ МАРШРУТЫ ДЛЯ УДАЛЕНИЯ ---

// Удалить пространство
app.delete('/api/spaces/:id', verifyToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.user;
		const result = await pool.query(
			'DELETE FROM spaces WHERE id = $1 AND user_id = $2',
			[id, userId]
		);
		if (result.rowCount === 0) {
			return res
				.status(404)
				.json({
					message: 'Пространство не найдено или у вас нет прав на его удаление',
				});
		}
		res.status(204).send(); // 204 No Content
	} catch (error) {
		console.error('Ошибка удаления пространства:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});

// Удалить проект
app.delete('/api/projects/:id', verifyToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.user;
		const result = await pool.query(
			'DELETE FROM projects WHERE id = $1 AND user_id = $2',
			[id, userId]
		);
		if (result.rowCount === 0) {
			return res
				.status(404)
				.json({
					message: 'Проект не найден или у вас нет прав на его удаление',
				});
		}
		res.status(204).send(); // 204 No Content
	} catch (error) {
		console.error('Ошибка удаления проекта:', error);
		res.status(500).json({ message: 'Внутренняя ошибка сервера' });
	}
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Сервер запущен на порту ${PORT}`);
});
