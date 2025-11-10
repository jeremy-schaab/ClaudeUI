import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ProjectBadge from './ProjectBadge'

interface Project {
  id?: number
  name: string
  path: string
  color: string
  is_favorite?: boolean
  last_accessed?: string
  tags?: string
}

interface ProjectSwitcherProps {
  currentProject: Project | null
  onProjectSelect: (project: Project) => void
  onManageProjects: () => void
  onNewProject: () => void
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  currentProject,
  onProjectSelect,
  onManageProjects,
  onNewProject
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:3001/api/projects')
      setProjects(response.data.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project: Project) => {
    onProjectSelect(project)
    setIsOpen(false)
  }

  const favoriteProjects = projects.filter(p => p.is_favorite)
  const recentProjects = projects
    .filter(p => !p.is_favorite)
    .sort((a, b) => new Date(b.last_accessed!).getTime() - new Date(a.last_accessed!).getTime())
    .slice(0, 5)
  const otherProjects = projects.filter(p => !p.is_favorite && !recentProjects.includes(p))

  return (
    <div className="project-switcher" ref={dropdownRef}>
      <button
        className="project-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ProjectBadge project={currentProject} />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="project-switcher-dropdown">
          {loading ? (
            <div className="project-switcher-loading">Loading projects...</div>
          ) : (
            <>
              {favoriteProjects.length > 0 && (
                <div className="project-section">
                  <div className="project-section-header">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>Favorites</span>
                  </div>
                  {favoriteProjects.map(project => (
                    <button
                      key={project.id}
                      className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <span className="project-item-dot" style={{ backgroundColor: project.color }}></span>
                      <span className="project-item-name">{project.name}</span>
                      {currentProject?.id === project.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {recentProjects.length > 0 && (
                <div className="project-section">
                  <div className="project-section-header">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Recent</span>
                  </div>
                  {recentProjects.map(project => (
                    <button
                      key={project.id}
                      className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <span className="project-item-dot" style={{ backgroundColor: project.color }}></span>
                      <span className="project-item-name">{project.name}</span>
                      {currentProject?.id === project.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {otherProjects.length > 0 && (
                <div className="project-section">
                  <div className="project-section-header">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span>All Projects</span>
                  </div>
                  {otherProjects.map(project => (
                    <button
                      key={project.id}
                      className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <span className="project-item-dot" style={{ backgroundColor: project.color }}></span>
                      <span className="project-item-name">{project.name}</span>
                      {currentProject?.id === project.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {projects.length === 0 && (
                <div className="project-switcher-empty">
                  <p>No projects yet</p>
                </div>
              )}

              <div className="project-switcher-actions">
                <button className="project-action-btn" onClick={() => { onNewProject(); setIsOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Project</span>
                </button>
                <button className="project-action-btn" onClick={() => { onManageProjects(); setIsOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m5.7-13.7l-4.2 4.2m-3-3l-4.2 4.2m11.1 2.1l-4.2 4.2m-3 3l-4.2 4.2m13.7-5.7h-6m-6 0H1" />
                  </svg>
                  <span>Manage Projects</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectSwitcher
