import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface ContextPreset {
  id?: number
  project_id: number
  name: string
  description?: string
  file_patterns?: string
  exclude_patterns?: string
  explicit_files?: string
  is_default?: boolean
}

interface ContextPresetFormProps {
  preset?: ContextPreset | null
  projectId: number
  onSave: (preset: ContextPreset) => void | Promise<void>
  onCancel: () => void
}

const ContextPresetForm: React.FC<ContextPresetFormProps> = ({ preset, projectId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ContextPreset>({
    project_id: projectId,
    name: '',
    description: '',
    file_patterns: '',
    exclude_patterns: '',
    explicit_files: '',
    is_default: false
  })
  const [error, setError] = useState<string | null>(null)
  const [fileCount, setFileCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    if (preset) {
      setFormData({
        ...preset,
        file_patterns: Array.isArray(preset.file_patterns) ? preset.file_patterns.join('\n') : preset.file_patterns || '',
        exclude_patterns: Array.isArray(preset.exclude_patterns) ? preset.exclude_patterns.join('\n') : preset.exclude_patterns || '',
        explicit_files: Array.isArray(preset.explicit_files) ? preset.explicit_files.join('\n') : preset.explicit_files || ''
      })
    }
  }, [preset])

  const handlePreview = async () => {
    if (!formData.file_patterns && !formData.explicit_files) {
      return
    }

    setIsLoadingPreview(true)
    try {
      const patterns = (formData.file_patterns || '').split('\n').filter(p => p.trim())
      const excludes = (formData.exclude_patterns || '').split('\n').filter(p => p.trim())
      const explicit = (formData.explicit_files || '').split('\n').filter(p => p.trim())

      // Create temporary preset to get file count
      const tempPresetData = {
        ...formData,
        file_patterns: JSON.stringify(patterns),
        exclude_patterns: JSON.stringify(excludes),
        explicit_files: JSON.stringify(explicit)
      }

      const response = await axios.post(
        `http://localhost:3001/api/projects/${projectId}/presets`,
        tempPresetData
      )

      const presetId = response.data.data.id

      // Get resolved files
      const filesResponse = await axios.get(
        `http://localhost:3001/api/projects/${projectId}/presets/${presetId}/files`
      )

      setFileCount(filesResponse.data.data.count)

      // Delete temporary preset
      await axios.delete(`http://localhost:3001/api/projects/${projectId}/presets/${presetId}`)
    } catch (err: any) {
      console.error('Preview failed:', err)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const patterns = (formData.file_patterns || '').split('\n').filter(p => p.trim())
      const excludes = (formData.exclude_patterns || '').split('\n').filter(p => p.trim())
      const explicit = (formData.explicit_files || '').split('\n').filter(p => p.trim())

      const presetData = {
        ...formData,
        file_patterns: JSON.stringify(patterns),
        exclude_patterns: JSON.stringify(excludes),
        explicit_files: JSON.stringify(explicit)
      }

      if (preset?.id) {
        await axios.patch(
          `http://localhost:3001/api/projects/${projectId}/presets/${preset.id}`,
          presetData
        )
      } else {
        await axios.post(
          `http://localhost:3001/api/projects/${projectId}/presets`,
          presetData
        )
      }

      onSave(formData)
    } catch (err: any) {
      console.error('Failed to save preset:', err)
      setError(err.response?.data?.error?.message || 'Failed to save preset')
    }
  }

  return (
    <form className="preset-form" onSubmit={handleSubmit}>
      <h2>{preset?.id ? 'Edit Preset' : 'Create Context Preset'}</h2>

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
        <label htmlFor="name">Preset Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Full Stack"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Frontend and backend code"
        />
      </div>

      <div className="form-group">
        <label htmlFor="file_patterns">Include Patterns (glob)</label>
        <textarea
          id="file_patterns"
          value={formData.file_patterns || ''}
          onChange={(e) => setFormData({ ...formData, file_patterns: e.target.value })}
          placeholder={"src/**/*.ts\nlib/**/*.js\n(one pattern per line)"}
          rows={4}
        />
        <small>Glob patterns to match files (e.g., src/**/*.ts)</small>
      </div>

      <div className="form-group">
        <label htmlFor="exclude_patterns">Exclude Patterns (glob)</label>
        <textarea
          id="exclude_patterns"
          value={formData.exclude_patterns || ''}
          onChange={(e) => setFormData({ ...formData, exclude_patterns: e.target.value })}
          placeholder={"**/*.test.ts\nnode_modules/**\n(one pattern per line)"}
          rows={3}
        />
        <small>Patterns to exclude from matches</small>
      </div>

      <div className="form-group">
        <label htmlFor="explicit_files">Explicit Files</label>
        <textarea
          id="explicit_files"
          value={formData.explicit_files || ''}
          onChange={(e) => setFormData({ ...formData, explicit_files: e.target.value })}
          placeholder={"config/settings.json\nREADME.md\n(one file per line)"}
          rows={3}
        />
        <small>Specific files to always include</small>
      </div>

      {fileCount !== null && (
        <div className="preset-preview">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''} will be included</span>
        </div>
      )}

      <div className="form-group">
        <div className="checkbox-group">
          <input
            id="is_default"
            type="checkbox"
            checked={formData.is_default || false}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          />
          <label htmlFor="is_default">Set as default preset for this project</label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="preview-btn"
          onClick={handlePreview}
          disabled={isLoadingPreview}
        >
          {isLoadingPreview ? 'Loading...' : 'Preview Files'}
        </button>
        <button type="submit" className="save-btn">
          {preset?.id ? 'Update Preset' : 'Create Preset'}
        </button>
      </div>
    </form>
  )
}

export default ContextPresetForm
