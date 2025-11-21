import { FileService } from './file.service'
import { File } from '../models/File'
import { Folder } from '../models/Folder'
import { MinioStorage } from '../utils/minioClient'

// Mock dependencies
jest.mock('../models/File')
jest.mock('../models/Folder')
jest.mock('../utils/minioClient')
jest.mock('../utils/logger')

describe('FileService', () => {
  let fileService: FileService
  let mockMinioStorage: jest.Mocked<MinioStorage>

  beforeEach(() => {
    fileService = new FileService()
    mockMinioStorage = (fileService as any).minioStorage
    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      // Arrange
      const uploadData = {
        buffer: Buffer.from('test content'),
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 12,
        userId: 1
      }

      const mockFile = {
        id: 1,
        name: 'generated-name.txt',
        originalName: 'test.txt',
        path: 'root/generated-name.txt',
        size: 12,
        userId: 1
      }

      mockMinioStorage.uploadFile = jest.fn().mockResolvedValue('etag-123')
      ;(File.create as jest.Mock).mockResolvedValue(mockFile)

      // Act
      const result = await fileService.uploadFile(uploadData)

      // Assert
      expect(mockMinioStorage.uploadFile).toHaveBeenCalled()
      expect(File.create).toHaveBeenCalled()
      expect(result).toEqual(mockFile)
    })

    it('应该为文件夹内的文件生成正确的路径', async () => {
      // Arrange
      const uploadData = {
        buffer: Buffer.from('test'),
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 4,
        userId: 1,
        folderId: 5
      }

      mockMinioStorage.uploadFile = jest.fn().mockResolvedValue('etag-123')
      ;(File.create as jest.Mock).mockResolvedValue({ id: 1 })

      // Act
      await fileService.uploadFile(uploadData)

      // Assert
      const uploadCall = mockMinioStorage.uploadFile.mock.calls[0]
      expect(uploadCall[0]).toContain('folder-5/')
    })

    it('应该在上传失败时抛出错误', async () => {
      // Arrange
      const uploadData = {
        buffer: Buffer.from('test'),
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 4,
        userId: 1
      }

      mockMinioStorage.uploadFile = jest.fn().mockRejectedValue(new Error('MinIO error'))

      // Act & Assert
      await expect(fileService.uploadFile(uploadData)).rejects.toThrow('文件上传失败')
    })
  })

  describe('downloadFile', () => {
    it('应该成功下载文件', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        path: 'test/file.txt',
        userId: 1,
        isDeleted: false,
        isExpired: jest.fn().mockReturnValue(false),
        canAccess: jest.fn().mockReturnValue(true),
        recordDownload: jest.fn().mockResolvedValue(undefined)
      }

      const mockBuffer = Buffer.from('file content')

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)
      mockMinioStorage.downloadFile = jest.fn().mockResolvedValue(mockBuffer)

      // Act
      const result = await fileService.downloadFile(1, 1)

      // Assert
      expect(File.findByPk).toHaveBeenCalledWith(1)
      expect(mockFile.canAccess).toHaveBeenCalledWith(1)
      expect(mockMinioStorage.downloadFile).toHaveBeenCalledWith('test/file.txt')
      expect(mockFile.recordDownload).toHaveBeenCalled()
      expect(result.buffer).toEqual(mockBuffer)
      expect(result.file).toEqual(mockFile)
    })

    it('应该在文件不存在时抛出错误', async () => {
      // Arrange
      ;(File.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(fileService.downloadFile(999, 1)).rejects.toThrow('文件不存在')
    })

    it('应该在文件已删除时抛出错误', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        isDeleted: true
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act & Assert
      await expect(fileService.downloadFile(1, 1)).rejects.toThrow('文件已被删除')
    })

    it('应该在文件已过期时抛出错误', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        isDeleted: false,
        isExpired: jest.fn().mockReturnValue(true)
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act & Assert
      await expect(fileService.downloadFile(1, 1)).rejects.toThrow('文件已过期')
    })

    it('应该在没有权限时抛出错误', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        isDeleted: false,
        isExpired: jest.fn().mockReturnValue(false),
        canAccess: jest.fn().mockReturnValue(false)
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act & Assert
      await expect(fileService.downloadFile(1, 2)).rejects.toThrow('没有权限访问此文件')
    })
  })

  describe('getFileById', () => {
    it('应该成功获取文件信息', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        name: 'test.txt',
        isDeleted: false,
        canAccess: jest.fn().mockReturnValue(true)
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act
      const result = await fileService.getFileById(1, 1)

      // Assert
      expect(File.findByPk).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockFile)
    })

    it('应该在文件不存在时抛出错误', async () => {
      // Arrange
      ;(File.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(fileService.getFileById(999, 1)).rejects.toThrow('文件不存在')
    })
  })

  describe('getUserFiles', () => {
    it('应该成功获取用户的文件列表', async () => {
      // Arrange
      const mockFiles = [
        { id: 1, name: 'file1.txt', userId: 1 },
        { id: 2, name: 'file2.txt', userId: 1 }
      ]

      ;(File.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockFiles,
        count: 2
      })

      // Act
      const result = await fileService.getUserFiles(1, 1, 20)

      // Assert
      expect(File.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1,
          isDeleted: false
        },
        order: [['createdAt', 'DESC']],
        limit: 20,
        offset: 0
      })
      expect(result.files).toEqual(mockFiles)
      expect(result.total).toBe(2)
    })

    it('应该正确处理分页', async () => {
      // Arrange
      ;(File.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      })

      // Act
      await fileService.getUserFiles(1, 3, 10)

      // Assert
      expect(File.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20 // (3-1) * 10
        })
      )
    })
  })

  describe('getFolderFiles', () => {
    it('应该成功获取文件夹内的文件', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'test-folder',
        canAccess: jest.fn().mockReturnValue(true)
      }

      const mockFiles = [
        { id: 1, name: 'file1.txt', folderId: 1 }
      ]

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(File.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockFiles,
        count: 1
      })

      // Act
      const result = await fileService.getFolderFiles(1, 1, 1, 20)

      // Assert
      expect(Folder.findByPk).toHaveBeenCalledWith(1)
      expect(mockFolder.canAccess).toHaveBeenCalledWith(1)
      expect(result.files).toEqual(mockFiles)
    })

    it('应该在文件夹不存在时抛出错误', async () => {
      // Arrange
      ;(Folder.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(fileService.getFolderFiles(999, 1)).rejects.toThrow('文件夹不存在')
    })

    it('应该在没有权限时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        canAccess: jest.fn().mockReturnValue(false)
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act & Assert
      await expect(fileService.getFolderFiles(1, 2)).rejects.toThrow('没有权限访问此文件夹')
    })
  })

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        userId: 1,
        isDeleted: false,
        softDelete: jest.fn().mockResolvedValue(undefined)
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act
      await fileService.deleteFile(1, 1)

      // Assert
      expect(File.findByPk).toHaveBeenCalledWith(1)
      expect(mockFile.softDelete).toHaveBeenCalledWith(1)
    })

    it('应该在文件不存在时抛出错误', async () => {
      // Arrange
      ;(File.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(fileService.deleteFile(999, 1)).rejects.toThrow('文件不存在')
    })

    it('应该在删除他人文件时抛出错误', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act & Assert
      await expect(fileService.deleteFile(1, 2)).rejects.toThrow('只能删除自己的文件')
    })

    it('应该在文件已删除时抛出错误', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        userId: 1,
        isDeleted: true
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act & Assert
      await expect(fileService.deleteFile(1, 1)).rejects.toThrow('文件已被删除')
    })
  })

  describe('updateFileInfo', () => {
    it('应该成功更新文件信息', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        userId: 1,
        isDeleted: false,
        updateInfo: jest.fn().mockResolvedValue(undefined)
      }

      const updateData = {
        name: 'new-name.txt',
        description: 'Updated description',
        tags: 'tag1,tag2',
        isPublic: true
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act
      const result = await fileService.updateFileInfo(1, 1, updateData)

      // Assert
      expect(File.findByPk).toHaveBeenCalledWith(1)
      expect(mockFile.updateInfo).toHaveBeenCalledWith(updateData)
      expect(result).toEqual(mockFile)
    })

    it('应该在更新他人文件时抛出错误', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(File.findByPk as jest.Mock).mockResolvedValue(mockFile)

      // Act & Assert
      await expect(
        fileService.updateFileInfo(1, 2, { name: 'new.txt' })
      ).rejects.toThrow('只能修改自己的文件')
    })
  })

  describe('getFileStats', () => {
    it('应该成功获取文件统计信息', async () => {
      // Arrange
      const mockFiles = [
        { size: 1024 },
        { size: 2048 },
        { size: 512 }
      ]

      const mockRecentUploads = [
        { id: 1, name: 'file1.txt' },
        { id: 2, name: 'file2.txt' }
      ]

      ;(File.count as jest.Mock).mockResolvedValue(3)
      ;(File.findAll as jest.Mock)
        .mockResolvedValueOnce(mockFiles)
        .mockResolvedValueOnce(mockRecentUploads)

      // Act
      const result = await fileService.getFileStats(1)

      // Assert
      expect(result.totalFiles).toBe(3)
      expect(result.totalSize).toBe(3584) // 1024 + 2048 + 512
      expect(result.recentUploads).toEqual(mockRecentUploads)
    })
  })

  describe('formatFileSize', () => {
    it('应该正确格式化文件大小', () => {
      expect(FileService.formatFileSize(500)).toBe('500.00 B')
      expect(FileService.formatFileSize(1024)).toBe('1.00 KB')
      expect(FileService.formatFileSize(1048576)).toBe('1.00 MB')
      expect(FileService.formatFileSize(1073741824)).toBe('1.00 GB')
      expect(FileService.formatFileSize(1024 * 1024 * 1.5)).toBe('1.50 MB')
    })
  })
})
