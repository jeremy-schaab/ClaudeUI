import React, { useState, useEffect } from 'react'
import axios from 'axios'
import FolderPicker from './FolderPicker'

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

interface ProjectFormProps {
  project?: Project | null
  onSave: (project: Project) => void | Promise<void>
  onCancel: () => void
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Project>({
    name: '',
    path: '',
    description: '',
    color: '#6366f1',
    tags: '',
    is_favorite: false
  })
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFolderPicker, setShowFolderPicker] = useState(false)

  useEffect(() => {
    if (project) {
      setFormData(project)
    }
  }, [project])

  const handleDetectProject = async () => {
    if (!formData.path) {
      setError('Please enter a project path first')
      return
    }

    setIsDetecting(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:3001/api/project-detections', {
        path: formData.path
      })

      const detected = response.data.data
      setDetectionResult(detected)

      // Auto-fill form with detected values
      setFormData(prev => ({
        ...prev,
        name: detected.name || prev.name,
        color: detected.suggestedColor || prev.color,
        tags: detected.suggestedTags ? detected.suggestedTags.join(', ') : prev.tags,
        description: detected.metadata?.frameworks?.length > 0
          ? `${detected.projectType} project with ${detected.metadata.frameworks.join(', ')}`
          : `${detected.projectType} project`
      }))
    } catch (err: any) {
      console.error('Detection failed:', err)
      setError(err.response?.data?.error?.message || 'Failed to detect project')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (project?.id) {
        // Update existing project
        await axios.patch(`http://localhost:3001/api/projects/${project.id}`, formData)
      } else {
        // Create new project
        const response = await axios.post('http://localhost:3001/api/projects', formData)
        formData.id = response.data.data.id
      }
      onSave(formData)
    } catch (err: any) {
      console.error('Failed to save project:', err)
      setError(err.response?.data?.error?.message || 'Failed to save project')
    }
  }

  const handleUseCurrent = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/settings/CLI_ROOT')
      const currentPath = response.data.value || ''
      setFormData(prev => ({ ...prev, path: currentPath }))
    } catch (err) {
      console.error('Failed to get current path:', err)
    }
  }

  const handleFolderSelect = (path: string) => {
    setFormData(prev => ({ ...prev, path }))
    setShowFolderPicker(false)
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h2>{project?.id ? 'Edit Project' : 'Create New Project'}</h2>

      {error && (
        <div className="form-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="path">Project Path *</label>
        <div className="path-input-group">
          <input
            id="path"
            type="text"
            value={formData.path}
            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
            placeholder="C:\Users\you\projects\my-app"
            required
          />
          <button type="button" className="browse-btn" onClick={() => setShowFolderPicker(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Browse
          </button>
          <button type="button" className="use-current-btn" onClick={handleUseCurrent}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Use Current
          </button>
          <button
            type="button"
            className="detect-btn"
            onClick={handleDetectProject}
            disabled={isDetecting || !formData.path}
          >
            {isDetecting ? (
              <>
                <div className="spinner"></div>
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>Auto-Detect</span>
              </>
            )}
          </button>
        </div>
        {detectionResult && (
          <div className="detection-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>
              Detected: {detectionResult.projectType}
              {detectionResult.framework && ` · ${detectionResult.framework}`}
              {detectionResult.language && ` · ${detectionResult.language}`}
            </span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="name">Project Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Awesome Project"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="A brief description of your project..."
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="color">Color</label>
          <div className="color-input-group">
            <input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
            <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#6366f1"
              className="color-hex-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="favorite">Favorite</label>
          <div className="checkbox-group">
            <input
              id="favorite"
              type="checkbox"
              checked={formData.is_favorite || false}
              onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
            />
            <label htmlFor="favorite">Mark as favorite</label>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          type="text"
          value={formData.tags || ''}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="web, typescript, react (comma-separated)"
        />
        <small>Comma-separated tags for organizing projects</small>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="save-btn">
          {project?.id ? 'Update Project' : 'Create Project'}
        </button>
      </div>

      {showFolderPicker && (
        <FolderPicker
          onSelect={handleFolderSelect}
          onCancel={() => setShowFolderPicker(false)}
          initialPath={formData.path}
        />
      )}
    </form>
  )
}

export default ProjectForm
