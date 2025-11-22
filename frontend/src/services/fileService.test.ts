import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileService, FolderService } from './fileService'
import { api } from './api'
import apiClient from './api'

// Mock api and apiClient
vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  },
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      // Arrange
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, name: 'test.txt' }
        }
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      // Act
      const result = await FileService.uploadFile(mockFile)

      // Assert
      expect(apiClient.post).toHaveBeenCalled()
      const call = vi.mocked(apiClient.post).mock.calls[0]
      expect(call[0]).toBe('/files/upload')
      expect(call[1]).toBeInstanceOf(FormData)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该包含上传选项', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const options = {
        folderId: 5,
        isPublic: true,
        description: 'Test file',
        tags: 'tag1,tag2'
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } })

      // Act
      await FileService.uploadFile(mockFile, options)

      // Assert
      const call = vi.mocked(apiClient.post).mock.calls[0]
      const formData = call[1] as FormData
      expect(formData.get('folderId')).toBe('5')
      expect(formData.get('isPublic')).toBe('true')
      expect(formData.get('description')).toBe('Test file')
      expect(formData.get('tags')).toBe('tag1,tag2')
    })
  })

  describe('downloadFile', () => {
    it('应该成功下载文件', async () => {
      // Arrange
      const mockBlob = new Blob(['file content'])
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob })

      // Act
      const result = await FileService.downloadFile(1)

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/files/1/download', {
        responseType: 'blob'
      })
      expect(result).toBe(mockBlob)
    })
  })

  describe('getFileById', () => {
    it('应该成功获取文件信息', async () => {
      // Arrange
      const mockFile = { id: 1, name: 'test.txt' }
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockFile })

      // Act
      const result = await FileService.getFileById(1)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/files/1')
      expect(result.data).toEqual(mockFile)
    })
  })

  describe('getUserFiles', () => {
    it('应该成功获取用户文件列表', async () => {
      // Arrange
      const mockFiles = {
        files: [{ id: 1 }, { id: 2 }],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
      }
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockFiles })

      // Act
      const result = await FileService.getUserFiles(1, 20)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/files', {
        params: { page: 1, limit: 20 }
      })
      expect(result.data).toEqual(mockFiles)
    })

    it('应该使用默认分页参数', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ success: true, data: { files: [], pagination: {} } })

      // Act
      await FileService.getUserFiles()

      // Assert
      expect(api.get).toHaveBeenCalledWith('/files', {
        params: { page: 1, limit: 20 }
      })
    })
  })

  describe('getFolderFiles', () => {
    it('应该成功获取文件夹内的文件', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ success: true, data: { files: [] } })

      // Act
      await FileService.getFolderFiles(5, 2, 10)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/files/folder/5', {
        params: { page: 2, limit: 10 }
      })
    })
  })

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      // Arrange
      vi.mocked(api.delete).mockResolvedValue({ success: true })

      // Act
      await FileService.deleteFile(1)

      // Assert
      expect(api.delete).toHaveBeenCalledWith('/files/1')
    })
  })

  describe('updateFileInfo', () => {
    it('应该成功更新文件信息', async () => {
      // Arrange
      const updateData = { name: 'new-name.txt', description: 'Updated' }
      vi.mocked(api.put).mockResolvedValue({ success: true, data: { id: 1, ...updateData } })

      // Act
      await FileService.updateFileInfo(1, updateData)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/files/1', updateData)
    })
  })

  describe('getFileStats', () => {
    it('应该成功获取文件统计信息', async () => {
      // Arrange
      const mockStats = { totalFiles: 10, totalSize: 1024, recentUploads: [] }
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockStats })

      // Act
      const result = await FileService.getFileStats()

      // Assert
      expect(api.get).toHaveBeenCalledWith('/files/stats')
      expect(result.data).toEqual(mockStats)
    })
  })

  describe('formatFileSize', () => {
    it('应该正确格式化文件大小', () => {
      expect(FileService.formatFileSize(500)).toBe('500.00 B')
      expect(FileService.formatFileSize(1024)).toBe('1.00 KB')
      expect(FileService.formatFileSize(1048576)).toBe('1.00 MB')
      expect(FileService.formatFileSize(1073741824)).toBe('1.00 GB')
    })
  })

  describe('getFileIconType', () => {
    it('应该返回正确的图标类型', () => {
      expect(FileService.getFileIconType('image/png')).toBe('image')
      expect(FileService.getFileIconType('video/mp4')).toBe('video')
      expect(FileService.getFileIconType('audio/mp3')).toBe('audio')
      expect(FileService.getFileIconType('application/pdf')).toBe('pdf')
      expect(FileService.getFileIconType('application/msword')).toBe('word')
      expect(FileService.getFileIconType('application/vnd.ms-excel')).toBe('excel')
      expect(FileService.getFileIconType('application/zip')).toBe('archive')
      expect(FileService.getFileIconType('text/plain')).toBe('text')
      expect(FileService.getFileIconType('application/octet-stream')).toBe('file')
    })
  })
})

describe('FolderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createFolder', () => {
    it('应该成功创建文件夹', async () => {
      // Arrange
      const folderData = { name: 'test-folder', isPublic: false }
      const mockFolder = { id: 1, ...folderData }
      vi.mocked(api.post).mockResolvedValue({ success: true, data: mockFolder })

      // Act
      const result = await FolderService.createFolder(folderData)

      // Assert
      expect(api.post).toHaveBeenCalledWith('/folders', folderData)
      expect(result.data).toEqual(mockFolder)
    })
  })

  describe('getFolderById', () => {
    it('应该成功获取文件夹信息', async () => {
      // Arrange
      const mockFolder = { id: 1, name: 'test' }
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockFolder })

      // Act
      const result = await FolderService.getFolderById(1)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/folders/1')
      expect(result.data).toEqual(mockFolder)
    })
  })

  describe('getUserFolders', () => {
    it('应该成功获取用户的根文件夹列表', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ success: true, data: { folders: [], pagination: {} } })

      // Act
      await FolderService.getUserFolders(1, 20)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/folders', {
        params: { page: 1, limit: 20 }
      })
    })
  })

  describe('getSubfolders', () => {
    it('应该成功获取子文件夹列表', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ success: true, data: { folders: [] } })

      // Act
      await FolderService.getSubfolders(5, 1, 20)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/folders/5/subfolders', {
        params: { page: 1, limit: 20 }
      })
    })
  })

  describe('updateFolder', () => {
    it('应该成功更新文件夹信息', async () => {
      // Arrange
      const updateData = { name: 'new-name', description: 'Updated' }
      vi.mocked(api.put).mockResolvedValue({ success: true, data: { id: 1, ...updateData } })

      // Act
      await FolderService.updateFolder(1, updateData)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/folders/1', updateData)
    })
  })

  describe('deleteFolder', () => {
    it('应该成功删除文件夹', async () => {
      // Arrange
      vi.mocked(api.delete).mockResolvedValue({ success: true })

      // Act
      await FolderService.deleteFolder(1)

      // Assert
      expect(api.delete).toHaveBeenCalledWith('/folders/1')
    })
  })

  describe('moveFolder', () => {
    it('应该成功移动文件夹', async () => {
      // Arrange
      vi.mocked(api.put).mockResolvedValue({ success: true, data: { id: 1, parentId: 5 } })

      // Act
      await FolderService.moveFolder(1, 5)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/folders/1/move', { targetFolderId: 5 })
    })

    it('应该能移动到根目录', async () => {
      // Arrange
      vi.mocked(api.put).mockResolvedValue({ success: true, data: { id: 1, parentId: null } })

      // Act
      await FolderService.moveFolder(1, null)

      // Assert
      expect(api.put).toHaveBeenCalledWith('/folders/1/move', { targetFolderId: null })
    })
  })

  describe('getFolderTree', () => {
    it('应该成功获取文件夹树', async () => {
      // Arrange
      const mockTree = [{ id: 1, name: 'root', children: [] }]
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockTree })

      // Act
      const result = await FolderService.getFolderTree()

      // Assert
      expect(api.get).toHaveBeenCalledWith('/folders/tree')
      expect(result.data).toEqual(mockTree)
    })
  })

  describe('getFolderStats', () => {
    it('应该成功获取文件夹统计信息', async () => {
      // Arrange
      const mockStats = { fileCount: 5, subfolderCount: 2, totalSize: 1024 }
      vi.mocked(api.get).mockResolvedValue({ success: true, data: mockStats })

      // Act
      const result = await FolderService.getFolderStats(1)

      // Assert
      expect(api.get).toHaveBeenCalledWith('/folders/1/stats')
      expect(result.data).toEqual(mockStats)
    })
  })
})
