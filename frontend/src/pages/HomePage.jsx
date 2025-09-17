import React, { useCallback, useContext, useEffect, useState } from 'react';
import { createProject, deleteProject, getProjects } from '../api/projects.js';
import { createSpace, deleteSpace, getSpaces } from '../api/spaces.js';
import {
	createTask,
	deleteTask,
	getInboxTasks,
	getTasksByProject,
	moveTaskToProject,
	updateTask,
} from '../api/tasks.js';
import MoveTaskModal from '../components/MoveTaskModal.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

const HomePage = () => {
	// ... (существующие состояния)
	const { user, logout } = useContext(AuthContext);
	const [tasks, setTasks] = useState([]);
	const [newTaskTitle, setNewTaskTitle] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	const [spaces, setSpaces] = useState([]);
	const [projects, setProjects] = useState([]);
	const [currentView, setCurrentView] = useState({
		type: 'inbox',
		name: 'Инбокс',
	});
	const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [movingTaskId, setMovingTaskId] = useState(null);

	// ... (существующие хуки и обработчики)
	useEffect(() => {
		const fetchSidebarData = async () => {
			try {
				const [spacesData, projectsData] = await Promise.all([
					getSpaces(),
					getProjects(),
				]);
				setSpaces(spacesData);
				setProjects(projectsData);
			} catch (err) {
				console.error('Ошибка загрузки данных сайдбара:', err);
				setError('Не удалось загрузить проекты и пространства.');
				if (err.response && err.response.status === 403) logout();
			}
		};
		fetchSidebarData();
	}, [logout]);
	const fetchTasks = useCallback(async () => {
		try {
			setLoading(true);
			let tasksData;
			if (currentView.type === 'inbox') {
				tasksData = await getInboxTasks();
			} else if (currentView.type === 'project') {
				tasksData = await getTasksByProject(currentView.id);
			}
			setTasks(tasksData || []);
			setError('');
		} catch (err) {
			console.error('Ошибка загрузки задач:', err);
			setError('Не удалось загрузить задачи.');
			if (err.response && err.response.status === 403) logout();
		} finally {
			setLoading(false);
		}
	}, [currentView, logout]);
	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);
	const handleMoveTask = async (projectId) => {
		if (!movingTaskId) return;
		try {
			await moveTaskToProject(movingTaskId, projectId);
			setTasks(tasks.filter((t) => t.id !== movingTaskId));
			setMovingTaskId(null);
		} catch (err) {
			console.error('Ошибка перемещения задачи:', err);
			setError('Не удалось переместить задачу.');
		}
	};
	const handleAddSpace = async (title) => {
		try {
			const newSpace = await createSpace(title);
			setSpaces([...spaces, newSpace]);
		} catch (err) {
			console.error('Ошибка добавления пространства:', err);
			setError('Не удалось добавить пространство.');
		}
	};
	const handleAddProject = async (title, spaceId) => {
		try {
			const newProject = await createProject(title, spaceId);
			setProjects([...projects, newProject]);
		} catch (err) {
			console.error('Ошибка добавления проекта:', err);
			setError('Не удалось добавить проект.');
		}
	};
	const handleAddTask = async (e) => {
		e.preventDefault();
		if (!newTaskTitle.trim()) return;
		try {
			const newTask = await createTask(newTaskTitle);
			setNewTaskTitle('');
			if (currentView.type === 'inbox') {
				setTasks([newTask, ...tasks]);
			} else {
				alert('Задача добавлена в Инбокс!');
			}
		} catch (err) {
			console.error('Ошибка добавления задачи:', err);
			setError('Не удалось добавить задачу.');
		}
	};
	const handleToggleTask = async (id, is_completed) => {
		try {
			const updatedTask = await updateTask(id, { is_completed: !is_completed });
			setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
		} catch (err) {
			console.error('Ошибка обновления задачи:', err);
			setError('Не удалось обновить задачу.');
		}
	};
	const handleDeleteTask = async (id) => {
		try {
			await deleteTask(id);
			setTasks(tasks.filter((t) => t.id !== id));
		} catch (err) {
			console.error('Ошибка удаления задачи:', err);
			setError('Не удалось удалить задачу.');
		}
	};

	// --- НОВЫЕ ОБРАБОТЧИКИ УДАЛЕНИЯ ---
	const handleDeleteSpace = async (spaceId) => {
		try {
			await deleteSpace(spaceId);
			// Обновляем и пространства, и проекты (т.к. проекты в этом пространстве тоже удалены)
			setSpaces(spaces.filter((s) => s.id !== spaceId));
			setProjects(projects.filter((p) => p.space_id !== spaceId));

			// Если удалили пространство, в котором был открыт проект, переключаемся на инбокс
			if (currentView.type === 'project') {
				const project = projects.find((p) => p.id === currentView.id);
				if (project && project.space_id === spaceId) {
					setCurrentView({ type: 'inbox', name: 'Инбокс' });
				}
			}
		} catch (err) {
			console.error('Ошибка удаления пространства:', err);
			setError('Не удалось удалить пространство.');
		}
	};

	const handleDeleteProject = async (projectId) => {
		try {
			await deleteProject(projectId);
			setProjects(projects.filter((p) => p.id !== projectId));

			// Если удалили текущий открытый проект, переключаемся на инбокс
			if (currentView.type === 'project' && currentView.id === projectId) {
				setCurrentView({ type: 'inbox', name: 'Инбокс' });
			}
		} catch (err) {
			console.error('Ошибка удаления проекта:', err);
			setError('Не удалось удалить проект.');
		}
	};

	return (
		<>
			<div
				className={`main-layout ${
					isSidebarCollapsed ? 'sidebar-collapsed' : ''
				}`}
			>
				<Sidebar
					spaces={spaces}
					projects={projects}
					onSelectView={setCurrentView}
					currentView={currentView}
					isCollapsed={isSidebarCollapsed}
					onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
					onAddSpace={handleAddSpace}
					onAddProject={handleAddProject}
					onDeleteSpace={handleDeleteSpace} // <-- Передаем новую функцию
					onDeleteProject={handleDeleteProject} // <-- Передаем новую функцию
				/>
				<main className="content-area">
					{/* ... (остальной JSX без изменений) ... */}
					<div className="container">
						{' '}
						<div className="app-header">
							{' '}
							<h1>{currentView.name}</h1>{' '}
							<div className="user-info">
								{' '}
								<span>{user?.email}</span>{' '}
								<button onClick={logout} className="button-logout">
									Logout
								</button>{' '}
							</div>{' '}
						</div>{' '}
						<div className="inbox-container">
							{' '}
							{['inbox', 'project'].includes(currentView.type) && (
								<form onSubmit={handleAddTask} className="add-task-form">
									{' '}
									<input
										type="text"
										className="task-input"
										placeholder="Новая мысль или задача..."
										value={newTaskTitle}
										onChange={(e) => setNewTaskTitle(e.target.value)}
									/>{' '}
									<button type="submit">В Инбокс</button>{' '}
								</form>
							)}{' '}
							{error && <p className="error-message">{error}</p>}{' '}
							{loading ? (
								<p>Загрузка задач...</p>
							) : (
								<ul className="task-list">
									{' '}
									{tasks.map((task) => (
										<li
											key={task.id}
											className={`task-item ${
												task.is_completed ? 'completed' : ''
											}`}
										>
											{' '}
											<input
												type="checkbox"
												checked={task.is_completed}
												onChange={() =>
													handleToggleTask(task.id, task.is_completed)
												}
											/>{' '}
											<span>{task.title}</span>{' '}
											<div className="task-actions">
												{' '}
												{currentView.type === 'inbox' && (
													<button
														onClick={() => setMovingTaskId(task.id)}
														className="move-button"
														title="Переместить в проект"
													>
														➔
													</button>
												)}{' '}
												<button
													onClick={() => handleDeleteTask(task.id)}
													className="delete-button"
												>
													×
												</button>{' '}
											</div>{' '}
										</li>
									))}{' '}
								</ul>
							)}{' '}
						</div>{' '}
					</div>
				</main>
			</div>
			{movingTaskId && (
				<MoveTaskModal
					spaces={spaces}
					projects={projects}
					onClose={() => setMovingTaskId(null)}
					onSelectProject={handleMoveTask}
				/>
			)}
		</>
	);
};

export default HomePage;
