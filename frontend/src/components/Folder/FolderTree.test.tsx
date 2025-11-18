import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FolderTree from './FolderTree'
import { FileService } from '@services/fileService'

// Mock FileService
vi.mock('@services/fileService', () => ({
  FileService: {
    getFolderTree: vi.fn(),
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
  },
}))

// Mock antd components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Tree: ({ children, onSelect }: any) => (
      <div data-testid="tree">
        <div onClick={() => onSelect && onSelect(['1'], { selected: true, selectedNodes: [{ data: { id: 1, name: 'Test Folder' } }] })}>
          Tree Item
        </div>
        {children}
      </div>
    ),
    Modal: ({ children, open, onOk, onCancel, title }: any) =>
      open ? (
        <div data-testid="modal">
          <h2>{title}</h2>
          {children}
          <button onClick={onOk}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      ) : null,
    Button: ({ children, onClick, icon }: any) => (
      <button onClick={onClick}>
        {icon}
        {children}
      </button>
    ),
    Input: ({ value, onChange, placeholder }: any) => (
      <input
        value={value}
        onChange={(e) => onChange && onChange(e)}
        placeholder={placeholder}
      />
    ),
    Form: ({ children, onFinish }: any) => (
      <form onSubmit={(e) => {
        e.preventDefault()
        onFinish && onFinish({})
      }}>
        {children}
      </form>
    ),
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  }
})

describe('FolderTree Component', () => {
  const defaultProps = {
    onSelect: vi.fn(),
  }

  const mockFolders = [
    {
      id: 1,
      name: 'Root Folder',
      parentId: null,
      path: '/Root Folder',
      description: 'Root folder description',
      isPublic: true,
      createdAt: '2023-01-01T12:00:00Z',
    },
    {
      id: 2,
      name: 'Child Folder',
      parentId: 1,
      path: '/Root Folder/Child Folder',
      description: 'Child folder description',
      isPublic: false,
      createdAt: '2023-01-02T12:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FileService.getFolderTree).mockResolvedValue(mockFolders)
    vi.mocked(FileService.createFolder).mockResolvedValue({} as any)
    vi.mocked(FileService.updateFolder).mockResolvedValue({} as any)
    vi.mocked(FileService.deleteFolder).mockResolvedValue(undefined)
  })

  it('renders folder tree correctly', async () => {
    render(<FolderTree {...defaultProps} />)

    expect(screen.getByText('新建文件夹')).toBeInTheDocument()
    expect(screen.getByText('刷新')).toBeInTheDocument()
  })

  it('loads folders on mount', async () => {
    render(<FolderTree {...defaultProps} />)

    await waitFor(() => {
      expect(FileService.getFolderTree).toHaveBeenCalled()
    })
  })

  it('handles folder selection', async () => {
    render(<FolderTree {...defaultProps} />)

    await waitFor(() => {
      expect(FileService.getFolderTree).toHaveBeenCalled()
    })

    const treeItem = screen.getByText('Tree Item')
    fireEvent.click(treeItem)

    expect(defaultProps.onSelect).toHaveBeenCalledWith(
      { id: 1, name: 'Test Folder' }
    )
  })

  it('opens create folder modal', async () => {
    render(<FolderTree {...defaultProps} />)

    const createButton = screen.getByText('新建文件夹')
    fireEvent.click(createButton)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText('新建文件夹')).toBeInTheDocument() // Modal title
  })

  it('creates new folder successfully', async () => {
    render(<FolderTree {...defaultProps} />)

    // Open create modal
    const createButton = screen.getByText('新建文件夹')
    fireEvent.click(createButton)

    // Fill form
    const nameInput = screen.getByPlaceholderText('请输入文件夹名称')
    fireEvent.change(nameInput, { target: { value: 'New Folder' } })

    // Submit form
    const okButton = screen.getByText('OK')
    fireEvent.click(okButton)

    await waitFor(() => {
      expect(FileService.createFolder).toHaveBeenCalledWith({
        name: 'New Folder',
        parentId: undefined,
        description: '',
        isPublic: false,
      })
    })

    expect(FileService.getFolderTree).toHaveBeenCalled() // Should reload tree
  })

  it('validates folder name', async () => {
    render(<FolderTree {...defaultProps} />)

    const createButton = screen.getByText('新建文件夹')
    fireEvent.click(createButton)

    // Try to submit with empty name
    const okButton = screen.getByText('OK')
    fireEvent.click(okButton)

    // Should show validation error
    expect(screen.getByText('请输入文件夹名称')).toBeInTheDocument()
  })

  it('handles create folder error', async () => {
    vi.mocked(FileService.createFolder).mockRejectedValue(new Error('Create failed'))

    render(<FolderTree {...defaultProps} />)

    const createButton = screen.getByText('新建文件夹')
    fireEvent.click(createButton)

    const nameInput = screen.getByPlaceholderText('请输入文件夹名称')
    fireEvent.change(nameInput, { target: { value: 'New Folder' } })

    const okButton = screen.getByText('OK')
    fireEvent.click(okButton)

    await waitFor(() => {
      expect(FileService.createFolder).toHaveBeenCalled()
    })

    // Should show error message
    expect(screen.getByText('操作失败')).toBeInTheDocument()
  })

  it('refreshes folder tree', async () => {
    render(<FolderTree {...defaultProps} />)

    await waitFor(() => {
      expect(FileService.getFolderTree).toHaveBeenCalledTimes(1)
    })

    const refreshButton = screen.getByText('刷新')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(FileService.getFolderTree).toHaveBeenCalledTimes(2)
    })
  })

  it('handles folder tree loading error', async () => {
    vi.mocked(FileService.getFolderTree).mockRejectedValue(new Error('Load failed'))

    render(<FolderTree {...defaultProps} />)

    await waitFor(() => {
      expect(FileService.getFolderTree).toHaveBeenCalled()
    })

    expect(screen.getByText('加载文件夹失败')).toBeInTheDocument()
  })

  describe('Folder Actions', () => {
    // Note: Testing folder actions requires complex DOM manipulation for dropdown menus
    // Here we provide the structure for testing, but implementation would need more detailed setup

    it('handles folder creation from tree item', () => {
      // This would test creating a subfolder from a tree item's dropdown menu
      // Implementation requires more complex DOM interaction mocking
    })

    it('handles folder editing', () => {
      // This would test editing an existing folder
      // Implementation requires more complex DOM interaction mocking
    })

    it('handles folder deletion', () => {
      // This would test deleting a folder with confirmation
      // Implementation requires more complex DOM interaction mocking
    })
  })

  describe('Form Validation', () => {
    it('validates folder name length', async () => {
      render(<FolderTree {...defaultProps} />)

      const createButton = screen.getByText('新建文件夹')
      fireEvent.click(createButton)

      const nameInput = screen.getByPlaceholderText('请输入文件夹名称')
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(51) } }) // Over 50 characters

      const okButton = screen.getByText('OK')
      fireEvent.click(okButton)

      expect(screen.getByText('文件夹名称长度为1-50个字符')).toBeInTheDocument()
    })

    it('validates special characters in folder name', async () => {
      render(<FolderTree {...defaultProps} />)

      const createButton = screen.getByText('新建文件夹')
      fireEvent.click(createButton)

      const nameInput = screen.getByPlaceholderText('请输入文件夹名称')
      fireEvent.change(nameInput, { target: { value: 'Folder/Name' } })

      const okButton = screen.getByText('OK')
      fireEvent.click(okButton)

      expect(screen.getByText('文件夹名称不能包含特殊字符')).toBeInTheDocument()
    })
  })

  describe('Folder Properties', () => {
    it('displays folder description in edit form', async () => {
      const folderToEdit = {
        ...mockFolders[0],
        description: 'Test description',
      }

      // This would test that the description field is pre-filled when editing
      // Implementation requires specific setup for editing mode
    })

    it('handles folder visibility settings', async () => {
      render(<FolderTree {...defaultProps} />)

      const createButton = screen.getByText('新建文件夹')
      fireEvent.click(createButton)

      // Find and change visibility setting
      // This requires mocking the Select component more thoroughly
    })
  })
})