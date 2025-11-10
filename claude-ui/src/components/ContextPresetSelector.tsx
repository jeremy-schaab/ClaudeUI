import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

interface ContextPreset {
  id: number
  name: string
  description?: string
  is_default: boolean
}

interface ContextPresetSelectorProps {
  projectId: number | null
  onApplyPreset: (files: string[]) => void
  onManagePresets: () => void
}

const ContextPresetSelector: React.FC<ContextPresetSelectorProps> = ({
  projectId,
  onApplyPreset,
  onManagePresets
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [presets, setPresets] = useState<ContextPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && projectId) {
      loadPresets()
    }
  }, [isOpen, projectId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadPresets = async () => {
    if (!projectId) return

    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:3001/api/projects/${projectId}/presets`)
      setPresets(response.data.data || [])
    } catch (err) {
      console.error('Failed to load presets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyPreset = async (presetId: number) => {
    if (!projectId) return

    setApplying(presetId)
    try {
      const response = await axios.get(
        `http://localhost:3001/api/projects/${projectId}/presets/${presetId}/files`
      )

      const files = response.data.data.files || []
      onApplyPreset(files)
      setIsOpen(false)
    } catch (err) {
      console.error('Failed to apply preset:', err)
    } finally {
      setApplying(null)
    }
  }

  if (!projectId) {
    return (
      <div className="preset-selector-disabled">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
        <span>Select a project to use presets</span>
      </div>
    )
  }

  return (
    <div className="preset-selector" ref={dropdownRef}>
      <button
        className="preset-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Select context preset"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
        <span>Presets</span>
        <svg
          width="12"
          height="12"
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
        <div className="preset-selector-dropdown">
          {loading ? (
            <div className="preset-selector-loading">Loading presets...</div>
          ) : presets.length === 0 ? (
            <div className="preset-selector-empty">
              <p>No presets for this project</p>
              <button className="create-preset-btn" onClick={() => { onManagePresets(); setIsOpen(false); }}>
                Create Preset
              </button>
            </div>
          ) : (
            <>
              <div className="preset-list">
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    className="preset-item"
                    onClick={() => handleApplyPreset(preset.id)}
                    disabled={applying === preset.id}
                  >
                    <div className="preset-item-header">
                      {preset.is_default && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="default-star">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                      <span className="preset-name">{preset.name}</span>
                    </div>
                    {preset.description && (
                      <span className="preset-description">{preset.description}</span>
                    )}
                    {applying === preset.id && (
                      <div className="preset-applying">
                        <div className="spinner"></div>
                        <span>Applying...</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="preset-selector-actions">
                <button className="manage-presets-btn" onClick={() => { onManagePresets(); setIsOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m5.7-13.7l-4.2 4.2m-3-3l-4.2 4.2m11.1 2.1l-4.2 4.2m-3 3l-4.2 4.2m13.7-5.7h-6m-6 0H1" />
                  </svg>
                  <span>Manage Presets</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ContextPresetSelector
