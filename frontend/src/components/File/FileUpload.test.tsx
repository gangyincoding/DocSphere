import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FileUpload from './FileUpload'
import { FileService } from '@services/fileService'

// Mock FileService
vi.mock('@services/fileService', () => ({
  FileService: {
    uploadFile: vi.fn(),
    formatFileSize: vi.fn((size: number) => `${size} bytes`),
  },
}))

describe('FileUpload Component', () => {
  const defaultProps = {
    onUploadSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload button correctly', () => {
    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByText('上传文件')
    expect(uploadButton).toBeInTheDocument()
  })

  it('opens upload modal when button is clicked', () => {
    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    // 检查模态框标题是否存在
    expect(screen.getByText('上传文件')).toBeInTheDocument()
  })

  it('shows drag and drop area in modal', () => {
    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    // 检查拖拽上传区域的文本
    expect(screen.getByText(/点击或拖拽文件到此区域上传/)).toBeInTheDocument()
  })

  it('handles file selection correctly', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    // 获取拖拽区域
    const dropArea = screen.getByText(/点击或拖拽文件到此区域上传/)

    // 模拟文件选择
    fireEvent.change(dropArea.closest('input')!, {
      target: { files: [mockFile] },
    })

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })
  })

  it('validates file size correctly', async () => {
    // 创建一个超过100MB的文件
    const largeFile = new File(['x'.repeat(100 * 1024 * 1024 + 1)], 'large.txt', {
      type: 'text/plain',
    })

    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    const dropArea = screen.getByText(/点击或拖拽文件到此区域上传/)
    const input = dropArea.closest('input')!

    // 尝试选择大文件
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    })

    fireEvent.change(input)

    // 应该显示错误消息
    await waitFor(() => {
      expect(screen.getByText('文件大小不能超过 100MB!')).toBeInTheDocument()
    })
  })

  it('uploads file successfully', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const mockResponse = {
      id: 1,
      originalName: 'test.txt',
      size: 4,
      mimeType: 'text/plain',
    }

    vi.mocked(FileService.uploadFile).mockResolvedValue(mockResponse as any)

    render(<FileUpload {...defaultProps} />)

    // 打开上传模态框
    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    // 添加文件
    const dropArea = screen.getByText(/点击或拖拽文件到此区域上传/)
    const input = dropArea.closest('input')!

    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    })

    fireEvent.change(input)

    // 点击上传按钮
    const startUploadButton = screen.getByText('开始上传')
    fireEvent.click(startUploadButton)

    await waitFor(() => {
      expect(FileService.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        folderId: undefined,
        description: undefined,
        isPublic: false,
        tags: [],
      })
    })

    await waitFor(() => {
      expect(defaultProps.onUploadSuccess).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('handles upload failure gracefully', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

    vi.mocked(FileService.uploadFile).mockRejectedValue(new Error('Upload failed'))

    render(<FileUpload {...defaultProps} />)

    // 打开上传模态框
    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    // 添加文件
    const dropArea = screen.getByText(/点击或拖拽文件到此区域上传/)
    const input = dropArea.closest('input')!

    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    })

    fireEvent.change(input)

    // 点击上传按钮
    const startUploadButton = screen.getByText('开始上传')
    fireEvent.click(startUploadButton)

    await waitFor(() => {
      expect(screen.getByText('test.txt 上传失败')).toBeInTheDocument()
    })
  })

  it('closes modal when cancel button is clicked', () => {
    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByText('上传文件')
    fireEvent.click(uploadButton)

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    // 模态框应该关闭，不再能找到模态框内的内容
    expect(screen.queryByText(/点击或拖拽文件到此区域上传/)).not.toBeInTheDocument()
  })
})