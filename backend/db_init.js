// backend/db_init.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
});

const createTables = async () => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN'); // Начало транзакции

		// --- Таблица Пользователей (без изменений) ---
		await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        telegram_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

		// --- НОВАЯ ТАБЛИЦА: Пространства (Spaces) ---
		await client.query(`
      CREATE TABLE IF NOT EXISTS spaces (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

		// --- НОВАЯ ТАБЛИЦА: Проекты (Projects) ---
		await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        space_id INTEGER REFERENCES spaces(id) ON DELETE CASCADE, -- Может быть NULL
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

		// --- ОБНОВЛЕНИЕ ТАБЛИЦЫ: Задачи (Tasks) ---
		// Сначала удаляем старую таблицу, если она есть, чтобы пересоздать с новыми полями
		await client.query('DROP TABLE IF EXISTS tasks CASCADE;');
		await client.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, -- Связь с проектом
        parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE, -- Для вложенности
        title TEXT NOT NULL,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE NOT NULL,
        due_date DATE,
        is_inbox BOOLEAN DEFAULT TRUE NOT NULL,
        is_starred BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

		// Добавляем индексы для ускорения запросов
		await client.query(
			'CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON spaces(user_id);'
		);
		await client.query(
			'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);'
		);
		await client.query(
			'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);'
		);

		await client.query('COMMIT'); // Фиксация транзакции
		console.log('Таблицы успешно созданы/обновлены!');
	} catch (error) {
		await client.query('ROLLBACK'); // Откат в случае ошибки
		console.error('Ошибка при создании таблиц:', error);
	} finally {
		client.release();
	}
};

createTables().then(() => pool.end());
