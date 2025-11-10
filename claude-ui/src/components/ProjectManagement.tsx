import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ProjectForm from './ProjectForm'
import ContextPresetForm from './ContextPresetForm'

interface Project {
  id?: number
  name: string
  path: string
  description?: string
  color: string
  tags?: string
  is_favorite?: boolean
  last_accessed?: string
}

interface ContextPreset {
  id: number
  name: string
  description?: string
  is_default: boolean
}

interface ProjectManagementProps {
  onClose: () => void
  currentProjectId?: number | null
  onProjectSelect?: (project: Project) => void | Promise<void>
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({ onClose, currentProjectId, onProjectSelect }) => {
  const [view, setView] = useState<'list' | 'create-project' | 'edit-project' | 'manage-presets' | 'create-preset' | 'edit-preset'>('list')
  const [projects, setProjects] = useState<Project[]>([])
  const [presets, setPresets] = useState<ContextPreset[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<ContextPreset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
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

  const loadPresetsForProject = async (projectId: number) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/projects/${projectId}/presets`)
      setPresets(response.data.data || [])
    } catch (err) {
      console.error('Failed to load presets:', err)
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project? Conversations will be preserved.')) {
      return
    }

    try {
      await axios.delete(`http://localhost:3001/api/projects/${projectId}`)
      await loadProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const handleToggleFavorite = async (project: Project) => {
    try {
      await axios.patch(`http://localhost:3001/api/projects/${project.id}`, {
        is_favorite: !project.is_favorite
      })
      await loadProjects()
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setView('edit-project')
  }

  const handleManagePresets = async (project: Project) => {
    setSelectedProject(project)
    await loadPresetsForProject(project.id!)
    setView('manage-presets')
  }

  const handleDeletePreset = async (presetId: number) => {
    if (!selectedProject || !confirm('Are you sure you want to delete this preset?')) {
      return
    }

    try {
      await axios.delete(`http://localhost:3001/api/projects/${selectedProject.id!}/presets/${presetId}`)
      await loadPresetsForProject(selectedProject.id!)
    } catch (err) {
      console.error('Failed to delete preset:', err)
    }
  }

  const handleSaveProject = async (_project: Project) => {
    await loadProjects()
    setView('list')
    setSelectedProject(null)
  }

  const handleSavePreset = async () => {
    if (selectedProject) {
      await loadPresetsForProject(selectedProject.id!)
    }
    setView('manage-presets')
    setSelectedPreset(null)
  }

  const renderProjectList = () => (
    <div className="project-list-view">
      <div className="project-list-header">
        <h2>Projects</h2>
        <button className="create-project-btn" onClick={() => setView('create-project')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <p>No projects yet</p>
          <button className="create-first-btn" onClick={() => setView('create-project')}>
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-card-title">
                  <span className="project-dot" style={{ backgroundColor: project.color }}></span>
                  <h3>{project.name}</h3>
                  {project.id === currentProjectId && (
                    <span className="current-badge">Current</span>
                  )}
                </div>
                <button
                  className={`favorite-btn ${project.is_favorite ? 'active' : ''}`}
                  onClick={() => handleToggleFavorite(project)}
                  title={project.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={project.is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              </div>

              {project.description && (
                <p className="project-description">{project.description}</p>
              )}

              <div className="project-path">{project.path}</div>

              {project.tags && (() => {
                try {
                  const parsedTags = JSON.parse(project.tags);
                  return Array.isArray(parsedTags) && parsedTags.length > 0 && (
                    <div className="project-tags">
                      {parsedTags.map((tag: string) => (
                        <span key={tag} className="project-tag">{tag}</span>
                      ))}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              <div className="project-card-actions">
                {onProjectSelect && project.id !== currentProjectId && (
                  <button className="use-btn" onClick={() => onProjectSelect(project)}>
                    Use Project
                  </button>
                )}
                <button className="presets-btn" onClick={() => handleManagePresets(project)}>
                  Presets
                </button>
                <button className="edit-btn" onClick={() => handleEditProject(project)}>
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDeleteProject(project.id!)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderPresetManagement = () => (
    <div className="preset-management-view">
      <div className="preset-management-header">
        <button className="back-btn" onClick={() => setView('list')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Projects</span>
        </button>
        <h2>Presets for {selectedProject?.name}</h2>
        <button className="create-preset-btn" onClick={() => {
          setSelectedPreset(null)
          setView('create-preset')
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Preset</span>
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <p>No presets for this project</p>
          <button className="create-first-btn" onClick={() => {
            setSelectedPreset(null)
            setView('create-preset')
          }}>
            Create First Preset
          </button>
        </div>
      ) : (
        <div className="presets-list">
          {presets.map(preset => (
            <div key={preset.id} className="preset-list-item">
              <div className="preset-list-item-header">
                {preset.is_default && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="default-star">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
                <h3>{preset.name}</h3>
              </div>
              {preset.description && (
                <p className="preset-description">{preset.description}</p>
              )}
              <div className="preset-list-item-actions">
                <button className="edit-preset-btn" onClick={() => {
                  setSelectedPreset(preset as any)
                  setView('edit-preset')
                }}>
                  Edit
                </button>
                <button className="delete-preset-btn" onClick={() => handleDeletePreset(preset.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="project-management-modal" onClick={onClose}>
      <div className="project-management-content" onClick={(e) => e.stopPropagation()}>
        <div className="project-management-header">
          <h1>Project Management</h1>
          <button className="close-modal-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="project-management-body">
          {view === 'list' && renderProjectList()}
          {view === 'create-project' && (
            <ProjectForm onSave={handleSaveProject} onCancel={() => setView('list')} />
          )}
          {view === 'edit-project' && selectedProject && (
            <ProjectForm project={selectedProject} onSave={handleSaveProject} onCancel={() => setView('list')} />
          )}
          {view === 'manage-presets' && renderPresetManagement()}
          {view === 'create-preset' && selectedProject && (
            <ContextPresetForm
              projectId={selectedProject.id!}
              onSave={handleSavePreset}
              onCancel={() => setView('manage-presets')}
            />
          )}
          {view === 'edit-preset' && selectedProject && selectedPreset && (
            <ContextPresetForm
              preset={selectedPreset as any}
              projectId={selectedProject.id!}
              onSave={handleSavePreset}
              onCancel={() => setView('manage-presets')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectManagement
