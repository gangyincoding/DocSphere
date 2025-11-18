import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FileList from './FileList'
import { FileService } from '@services/fileService'

// Mock FileService
vi.mock('@services/fileService', () => ({
  FileService: {
    getFiles: vi.fn(),
    downloadFile: vi.fn(),
    deleteFile: vi.fn(),
    getFileType: vi.fn((mimeType: string) => {
      if (mimeType.startsWith('image/')) return 'image'
      if (mimeType === 'application/pdf') return 'pdf'
      if (mimeType.startsWith('text/')) return 'text'
      return 'other'
    }),
    formatFileSize: vi.fn((size: number) => `${size} bytes`),
  },
}))

// Mock FilePreview component
vi.mock('./FilePreview', () => ({
  default: ({ visible, onClose }: { visible: boolean; onClose: () => void }) =>
    visible ? (
      <div data-testid="file-preview">
        <button onClick={onClose}>Close Preview</button>
      </div>
    ) : null,
}))

// Mock utility functions
vi.mock('@utils/index', () => ({
  formatDateTime: vi.fn((date: string) => '2023-01-01 12:00:00'),
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
  getFileType: vi.fn((mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.startsWith('text/')) return 'text'
    return 'other'
  }),
  getColorByType: vi.fn((type: string) => 'blue'),
}))

describe('FileList Component', () => {
  const defaultProps = {
    onFileSelect: vi.fn(),
    onRefresh: vi.fn(),
  }

  const mockFiles = [
    {
      id: 1,
      originalName: 'test.txt',
      mimeType: 'text/plain',
      size: 1024,
      createdAt: '2023-01-01T12:00:00Z',
      downloadCount: 5,
      isPublic: true,
    },
    {
      id: 2,
      originalName: 'image.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      createdAt: '2023-01-02T12:00:00Z',
      downloadCount: 3,
      isPublic: false,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FileService.getFiles).mockResolvedValue({
      data: {
        items: mockFiles,
        total: 2,
      },
    } as any)
  })

  it('renders file list correctly', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    vi.mocked(FileService.getFiles).mockImplementation(() => new Promise(() => {}))

    render(<FileList {...defaultProps} />)

    // 检查是否有loading状态
    expect(screen.getByText('文件列表')).toBeInTheDocument()
  })

  it('displays empty state when no files', async () => {
    vi.mocked(FileService.getFiles).mockResolvedValue({
      data: {
        items: [],
        total: 0,
      },
    } as any)

    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('暂无文件')).toBeInTheDocument()
    })
  })

  it('handles file search', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('搜索文件')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    fireEvent.click(screen.getByTitle('Search'))

    await waitFor(() => {
      expect(FileService.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        })
      )
    })
  })

  it('handles file type filter', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    const filterSelect = screen.getByText('文件类型')
    fireEvent.mouseDown(filterSelect)

    const imageOption = screen.getByText('图片')
    fireEvent.click(imageOption)

    await waitFor(() => {
      expect(FileService.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image',
        })
      )
    })
  })

  it('handles file download', async () => {
    vi.mocked(FileService.downloadFile).mockResolvedValue(undefined as any)

    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    // 找到下载按钮并点击
    const downloadButtons = screen.getAllByTitle('下载')
    fireEvent.click(downloadButtons[0])

    await waitFor(() => {
      expect(FileService.downloadFile).toHaveBeenCalledWith(1, 'test.txt')
    })
  })

  it('handles file preview', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    // 找到预览按钮并点击
    const previewButtons = screen.getAllByTitle('预览')
    fireEvent.click(previewButtons[0])

    await waitFor(() => {
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0])
    })

    // 检查预览组件是否显示
    expect(screen.getByTestId('file-preview')).toBeInTheDocument()
  })

  it('handles file delete', async () => {
    vi.mocked(FileService.deleteFile).mockResolvedValue(undefined as any)

    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    // 找到更多操作按钮
    const moreButtons = screen.getAllByTitle('更多操作')
    fireEvent.click(moreButtons[0])

    // 点击删除选项
    const deleteOption = screen.getByText('删除')
    fireEvent.click(deleteOption)

    // 确认删除
    const confirmButton = screen.getByText('确定')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(FileService.deleteFile).toHaveBeenCalledWith(1)
    })
  })

  it('handles batch selection', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    // 选择第一个文件
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // 第一个checkbox是全选，第二个是第一个文件

    // 批量删除按钮应该出现
    expect(screen.queryByText('批量删除')).toBeInTheDocument()
  })

  it('handles batch delete', async () => {
    vi.mocked(FileService.deleteFile).mockResolvedValue(undefined as any)

    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    // 选择文件
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // 选择第一个文件
    fireEvent.click(checkboxes[2]) // 选择第二个文件

    // 点击批量删除
    const batchDeleteButton = screen.getByText('批量删除')
    fireEvent.click(batchDeleteButton)

    // 确认删除
    const confirmButton = screen.getByText('确定')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(FileService.deleteFile).toHaveBeenCalledWith(1)
      expect(FileService.deleteFile).toHaveBeenCalledWith(2)
    })
  })

  it('handles sorting', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    // 点击表头排序
    const fileNameHeader = screen.getByText('文件名')
    fireEvent.click(fileNameHeader)

    await waitFor(() => {
      expect(FileService.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'originalName',
        })
      )
    })
  })

  it('calls onRefresh when refresh button is clicked', async () => {
    render(<FileList {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTitle('刷新')
    fireEvent.click(refreshButton)

    expect(defaultProps.onRefresh).toHaveBeenCalled()
  })
})