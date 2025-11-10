import React from 'react'

interface ProjectBadgeProps {
  project: {
    id?: number
    name: string
    color: string
  } | null
  onClick?: () => void
}

const ProjectBadge: React.FC<ProjectBadgeProps> = ({ project, onClick }) => {
  if (!project) {
    return (
      <div className="project-badge" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <span className="project-badge-dot" style={{ backgroundColor: '#6366f1' }}></span>
        <span className="project-badge-name">No Project</span>
      </div>
    )
  }

  return (
    <div className="project-badge" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <span className="project-badge-dot" style={{ backgroundColor: project.color }}></span>
      <span className="project-badge-name">{project.name}</span>
    </div>
  )
}

export default ProjectBadge
