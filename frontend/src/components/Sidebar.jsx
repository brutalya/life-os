import React, { useState } from 'react';

const AddItemForm = ({ placeholder, onSubmit, onCancel }) => {
	// ... (без изменений)
	const [title, setTitle] = useState('');
	const handleSubmit = (e) => {
		e.preventDefault();
		if (title.trim()) {
			onSubmit(title);
			setTitle('');
		}
	};
	return (
		<form onSubmit={handleSubmit} className="sidebar-form">
			{' '}
			<input
				type="text"
				autoFocus
				placeholder={placeholder}
				value={title}
				onChange={(e) => setTitle(e.target.value)}
			/>{' '}
			<div className="sidebar-form-actions">
				{' '}
				<button type="submit">✓</button>{' '}
				<button type="button" onClick={onCancel}>
					×
				</button>{' '}
			</div>{' '}
		</form>
	);
};

const Sidebar = ({
	spaces,
	projects,
	onSelectView,
	currentView,
	isCollapsed,
	onToggleCollapse,
	onAddSpace,
	onAddProject,
	onDeleteSpace, // <-- Новый prop
	onDeleteProject, // <-- Новый prop
}) => {
	const [addingSpace, setAddingSpace] = useState(false);
	const [addingProjectForSpace, setAddingProjectForSpace] = useState(null);

	const getProjectsBySpace = (spaceId) =>
		projects.filter((p) => p.space_id === spaceId);

	// --- НОВЫЕ ОБРАБОТЧИКИ ---
	const handleDeleteSpace = (e, spaceId) => {
		e.stopPropagation(); // Останавливаем всплытие, чтобы не сработал клик по li
		if (
			window.confirm(
				'Вы уверены, что хотите удалить это пространство? Все вложенные проекты и задачи будут удалены.'
			)
		) {
			onDeleteSpace(spaceId);
		}
	};
	const handleDeleteProject = (e, projectId) => {
		e.stopPropagation(); // Останавливаем всплытие
		if (
			window.confirm(
				'Вы уверены, что хотите удалить этот проект? Все задачи в нем будут удалены.'
			)
		) {
			onDeleteProject(projectId);
		}
	};

	if (isCollapsed) {
		return (
			<aside className="sidebar collapsed">
				{' '}
				<button onClick={onToggleCollapse} className="collapse-btn">
					»
				</button>{' '}
			</aside>
		);
	}

	return (
		<aside className="sidebar">
			<div className="sidebar-header">
				{' '}
				<h3>Меню</h3>{' '}
				<button onClick={onToggleCollapse} className="collapse-btn">
					«
				</button>{' '}
			</div>
			<div className="sidebar-section">
				<ul>
					{' '}
					<li
						className={currentView.type === 'inbox' ? 'active' : ''}
						onClick={() => onSelectView({ type: 'inbox', name: 'Инбокс' })}
					>
						{' '}
						Инбокс{' '}
					</li>{' '}
				</ul>
			</div>
			<div className="sidebar-section">
				<div className="section-header">
					{' '}
					<h3>Пространства</h3>{' '}
				</div>
				<ul>
					{spaces.map((space) => (
						<div key={space.id} className="space-container">
							<div className="section-header space-header">
								<span>{space.title}</span>
								<div className="header-actions">
									<button
										onClick={() => setAddingProjectForSpace(space.id)}
										className="add-btn"
									>
										+
									</button>
									<button
										onClick={(e) => handleDeleteSpace(e, space.id)}
										className="delete-sidebar-btn"
									>
										×
									</button>
								</div>
							</div>
							{addingProjectForSpace === space.id && (
								<AddItemForm
									placeholder="Новый проект..."
									onSubmit={(title) => {
										onAddProject(title, space.id);
										setAddingProjectForSpace(null);
									}}
									onCancel={() => setAddingProjectForSpace(null)}
								/>
							)}
							<ul>
								{getProjectsBySpace(space.id).map((project) => (
									<li
										key={project.id}
										className={
											currentView.type === 'project' &&
											currentView.id === project.id
												? 'active'
												: ''
										}
										onClick={() =>
											onSelectView({
												type: 'project',
												id: project.id,
												name: project.title,
											})
										}
									>
										{project.title}
										<button
											onClick={(e) => handleDeleteProject(e, project.id)}
											className="delete-sidebar-btn"
										>
											×
										</button>
									</li>
								))}
							</ul>
						</div>
					))}
				</ul>
				{!addingSpace ? (
					<button
						onClick={() => setAddingSpace(true)}
						className="button-add-space"
					>
						+ Новое пространство
					</button>
				) : (
					<AddItemForm
						placeholder="Новое пространство..."
						onSubmit={(title) => {
							onAddSpace(title);
							setAddingSpace(false);
						}}
						onCancel={() => setAddingSpace(false)}
					/>
				)}
			</div>
		</aside>
	);
};

export default Sidebar;
