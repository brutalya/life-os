import React from 'react';

const MoveTaskModal = ({ spaces, projects, onSelectProject, onClose }) => {
	const getProjectsBySpace = (spaceId) => {
		return projects.filter((p) => p.space_id === spaceId);
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>Переместить в проект</h3>
					<button onClick={onClose} className="close-btn">
						×
					</button>
				</div>
				<div className="modal-body">
					{spaces.map((space) => (
						<div key={space.id} className="space-group">
							<h4>{space.title}</h4>
							<ul>
								{getProjectsBySpace(space.id).map((project) => (
									<li
										key={project.id}
										onClick={() => onSelectProject(project.id)}
									>
										{project.title}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default MoveTaskModal;
