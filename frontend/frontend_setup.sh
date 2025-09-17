#!/bin/bash

# Скрипт для автоматической настройки структуры папок и установки зависимостей для фронтенда.
# Запускать из директории /frontend

echo "Создаем структуру папок..."
mkdir -p src/api src/components src/context src/pages

echo "Создаем пустые файлы компонентов и модулей..."
touch src/api/auth.js
touch src/components/AuthForm.jsx
touch src/context/AuthContext.jsx
touch src/pages/HomePage.jsx

echo "Устанавливаем необходимые npm-пакеты..."
npm install axios

echo "Настройка фронтенда завершена!"
echo "Теперь вы можете наполнить созданные файлы кодом и запустить проект командой 'npm run dev'."
