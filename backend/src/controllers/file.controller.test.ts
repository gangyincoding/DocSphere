import { Request, Response } from 'express'
import { FileController } from './file.controller'
import { FileService } from '../services/file.service'

// Mock dependencies
jest.mock('../services/file.service')
jest.mock('../utils/logger')

describe('FileController', () => {
  let fileController: FileController
  let mockFileService: jest.Mocked<FileService>
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    fileController = new FileController()
    mockFileService = (fileController as any).fileService

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 1 }
    } as any

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    }

    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 4
      }

      const mockUploadedFile = {
        id: 1,
        name: 'uploaded.txt',
        originalName: 'test.txt'
      }

      mockRequest.file = mockFile as any
      mockRequest.body = {
        folderId: '5',
        isPublic: 'true',
        description: 'Test file',
        tags: 'tag1,tag2'
      }

      mockFileService.uploadFile = jest.fn().mockResolvedValue(mockUploadedFile)

      // Act
      await fileController.uploadFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.uploadFile).toHaveBeenCalledWith({
        buffer: mockFile.buffer,
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 4,
        userId: 1,
        folderId: 5,
        isPublic: true,
        description: 'Test file',
        tags: 'tag1,tag2'
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件上传成功',
        data: mockUploadedFile
      })
    })

    it('应该在未提供文件时返回 400', async () => {
      // Arrange
      mockRequest.file = undefined

      // Act
      await fileController.uploadFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供文件'
      })
    })

    it('应该在上传失败时返回 500', async () => {
      // Arrange
      mockRequest.file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 4
      } as any

      mockFileService.uploadFile = jest.fn().mockRejectedValue(new Error('上传失败'))

      // Act
      await fileController.uploadFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '上传失败'
      })
    })
  })

  describe('downloadFile', () => {
    it('应该成功下载文件', async () => {
      // Arrange
      const mockBuffer = Buffer.from('file content')
      const mockFile = {
        id: 1,
        mimeType: 'text/plain',
        originalName: 'test.txt'
      }

      mockRequest.params = { id: '1' }
      mockFileService.downloadFile = jest.fn().mockResolvedValue({
        buffer: mockBuffer,
        file: mockFile
      })

      // Act
      await fileController.downloadFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.downloadFile).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain')
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test.txt"'
      )
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer)
    })

    it('应该在文件不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockFileService.downloadFile = jest.fn().mockRejectedValue(new Error('文件不存在'))

      // Act
      await fileController.downloadFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '文件不存在'
      })
    })

    it('应该在没有权限时返回 403', async () => {
      // Arrange
      mockRequest.params = { id: '1' }
      mockFileService.downloadFile = jest.fn().mockRejectedValue(new Error('没有权限'))

      // Act
      await fileController.downloadFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
    })
  })

  describe('getFileById', () => {
    it('应该成功获取文件信息', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        name: 'test.txt'
      }

      mockRequest.params = { id: '1' }
      mockFileService.getFileById = jest.fn().mockResolvedValue(mockFile)

      // Act
      await fileController.getFileById(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.getFileById).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFile
      })
    })

    it('应该在文件不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockFileService.getFileById = jest.fn().mockRejectedValue(new Error('文件不存在'))

      // Act
      await fileController.getFileById(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getUserFiles', () => {
    it('应该成功获取用户文件列表', async () => {
      // Arrange
      const mockFiles = [
        { id: 1, name: 'file1.txt' },
        { id: 2, name: 'file2.txt' }
      ]

      mockRequest.query = { page: '1', limit: '20' }
      mockFileService.getUserFiles = jest.fn().mockResolvedValue({
        files: mockFiles,
        total: 2
      })

      // Act
      await fileController.getUserFiles(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.getUserFiles).toHaveBeenCalledWith(1, 1, 20)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      })
    })

    it('应该使用默认分页参数', async () => {
      // Arrange
      mockRequest.query = {}
      mockFileService.getUserFiles = jest.fn().mockResolvedValue({
        files: [],
        total: 0
      })

      // Act
      await fileController.getUserFiles(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.getUserFiles).toHaveBeenCalledWith(1, 1, 20)
    })
  })

  describe('getFolderFiles', () => {
    it('应该成功获取文件夹内的文件', async () => {
      // Arrange
      const mockFiles = [{ id: 1, name: 'file1.txt' }]

      mockRequest.params = { folderId: '5' }
      mockRequest.query = { page: '2', limit: '10' }
      mockFileService.getFolderFiles = jest.fn().mockResolvedValue({
        files: mockFiles,
        total: 15
      })

      // Act
      await fileController.getFolderFiles(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.getFolderFiles).toHaveBeenCalledWith(5, 1, 2, 10)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          files: mockFiles,
          pagination: {
            page: 2,
            limit: 10,
            total: 15,
            totalPages: 2
          }
        }
      })
    })

    it('应该在文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { folderId: '999' }
      mockFileService.getFolderFiles = jest.fn().mockRejectedValue(new Error('文件夹不存在'))

      // Act
      await fileController.getFolderFiles(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      // Arrange
      mockRequest.params = { id: '1' }
      mockFileService.deleteFile = jest.fn().mockResolvedValue(undefined)

      // Act
      await fileController.deleteFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.deleteFile).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件删除成功'
      })
    })

    it('应该在文件不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockFileService.deleteFile = jest.fn().mockRejectedValue(new Error('文件不存在'))

      // Act
      await fileController.deleteFile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('updateFileInfo', () => {
    it('应该成功更新文件信息', async () => {
      // Arrange
      const updateData = {
        name: 'new-name.txt',
        description: 'Updated',
        tags: 'tag1,tag2',
        isPublic: true
      }

      const mockUpdatedFile = {
        id: 1,
        ...updateData
      }

      mockRequest.params = { id: '1' }
      mockRequest.body = updateData
      mockFileService.updateFileInfo = jest.fn().mockResolvedValue(mockUpdatedFile)

      // Act
      await fileController.updateFileInfo(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.updateFileInfo).toHaveBeenCalledWith(1, 1, updateData)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件信息更新成功',
        data: mockUpdatedFile
      })
    })

    it('应该在文件不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockRequest.body = { name: 'new.txt' }
      mockFileService.updateFileInfo = jest.fn().mockRejectedValue(new Error('文件不存在'))

      // Act
      await fileController.updateFileInfo(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getFileStats', () => {
    it('应该成功获取文件统计信息', async () => {
      // Arrange
      const mockStats = {
        totalFiles: 10,
        totalSize: 1024000,
        recentUploads: []
      }

      mockFileService.getFileStats = jest.fn().mockResolvedValue(mockStats)

      // Act
      await fileController.getFileStats(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFileService.getFileStats).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      })
    })

    it('应该在获取统计失败时返回 500', async () => {
      // Arrange
      mockFileService.getFileStats = jest.fn().mockRejectedValue(new Error('统计失败'))

      // Act
      await fileController.getFileStats(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })
})
