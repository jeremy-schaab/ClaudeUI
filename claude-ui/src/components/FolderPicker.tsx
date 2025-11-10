import { useState, useEffect } from 'react'
import axios from 'axios'
import './FolderPicker.css'

interface FolderItem {
  name: string
  path: string
}

interface FolderPickerProps {
  onSelect: (path: string) => void
  onCancel: () => void
  initialPath?: string
}

const FolderPicker: React.FC<FolderPickerProps> = ({ onSelect, onCancel, initialPath }) => {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFolders = async (path?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('http://localhost:3001/api/browse-folders', {
        params: { path }
      })
      setCurrentPath(response.data.currentPath)
      setFolders(response.data.folders)
      setParentPath(response.data.parentPath)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFolders(initialPath)
  }, [initialPath])

  const handleFolderClick = (folderPath: string) => {
    loadFolders(folderPath)
  }

  const handleGoUp = () => {
    if (parentPath) {
      loadFolders(parentPath)
    }
  }

  const handleSelect = () => {
    onSelect(currentPath)
  }

  return (
    <div className="folder-picker-overlay">
      <div className="folder-picker-modal">
        <div className="folder-picker-header">
          <h2>Select Folder</h2>
          <button className="close-btn" onClick={onCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="folder-picker-path">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>{currentPath}</span>
        </div>

        {error && (
          <div className="folder-picker-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="folder-picker-content">
          {loading ? (
            <div className="folder-picker-loading">
              <div className="spinner"></div>
              <span>Loading folders...</span>
            </div>
          ) : (
            <>
              {parentPath && (
                <div className="folder-item parent" onClick={handleGoUp}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span>..</span>
                </div>
              )}
              {folders.length === 0 ? (
                <div className="folder-picker-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>No folders in this directory</p>
                </div>
              ) : (
                folders.map(folder => (
                  <div
                    key={folder.path}
                    className="folder-item"
                    onClick={() => handleFolderClick(folder.path)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{folder.name}</span>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="folder-picker-footer">
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="select-button" onClick={handleSelect}>
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  )
}

export default FolderPicker
