import { Request, Response } from 'express'
import { FolderController } from './folder.controller'
import { FolderService } from '../services/folder.service'

// Mock dependencies
jest.mock('../services/folder.service')
jest.mock('../utils/logger')

describe('FolderController', () => {
  let folderController: FolderController
  let mockFolderService: jest.Mocked<FolderService>
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    folderController = new FolderController()
    mockFolderService = (folderController as any).folderService

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 1 }
    } as any

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    jest.clearAllMocks()
  })

  describe('createFolder', () => {
    it('应该成功创建文件夹', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'test-folder',
        path: '/test-folder'
      }

      mockRequest.body = {
        name: 'test-folder',
        description: 'Test description'
      }

      mockFolderService.createFolder = jest.fn().mockResolvedValue(mockFolder)

      // Act
      await folderController.createFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.createFolder).toHaveBeenCalledWith({
        name: 'test-folder',
        userId: 1,
        parentId: undefined,
        isPublic: false,
        description: 'Test description'
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件夹创建成功',
        data: mockFolder
      })
    })

    it('应该在名称为空时返回 400', async () => {
      // Arrange
      mockRequest.body = { name: '' }

      // Act
      await folderController.createFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '文件夹名称不能为空'
      })
    })

    it('应该在父文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.body = { name: 'folder', parentId: 999 }
      mockFolderService.createFolder = jest.fn().mockRejectedValue(new Error('父文件夹不存在'))

      // Act
      await folderController.createFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })

    it('应该在同名文件夹存在时返回 400', async () => {
      // Arrange
      mockRequest.body = { name: 'existing' }
      mockFolderService.createFolder = jest.fn().mockRejectedValue(new Error('同一目录下已存在同名文件夹'))

      // Act
      await folderController.createFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getFolderById', () => {
    it('应该成功获取文件夹信息', async () => {
      // Arrange
      const mockFolder = { id: 1, name: 'test' }
      mockRequest.params = { id: '1' }
      mockFolderService.getFolderById = jest.fn().mockResolvedValue(mockFolder)

      // Act
      await folderController.getFolderById(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.getFolderById).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFolder
      })
    })

    it('应该在文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockFolderService.getFolderById = jest.fn().mockRejectedValue(new Error('文件夹不存在'))

      // Act
      await folderController.getFolderById(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getUserFolders', () => {
    it('应该成功获取用户的根文件夹列表', async () => {
      // Arrange
      const mockFolders = [
        { id: 1, name: 'folder1' },
        { id: 2, name: 'folder2' }
      ]

      mockRequest.query = { page: '1', limit: '20' }
      mockFolderService.getUserFolders = jest.fn().mockResolvedValue({
        folders: mockFolders,
        total: 2
      })

      // Act
      await folderController.getUserFolders(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.getUserFolders).toHaveBeenCalledWith(1, 1, 20)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          folders: mockFolders,
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
      mockFolderService.getUserFolders = jest.fn().mockResolvedValue({
        folders: [],
        total: 0
      })

      // Act
      await folderController.getUserFolders(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.getUserFolders).toHaveBeenCalledWith(1, 1, 20)
    })
  })

  describe('getSubfolders', () => {
    it('应该成功获取子文件夹列表', async () => {
      // Arrange
      const mockFolders = [{ id: 10, name: 'subfolder' }]

      mockRequest.params = { parentId: '5' }
      mockRequest.query = { page: '1', limit: '10' }
      mockFolderService.getSubfolders = jest.fn().mockResolvedValue({
        folders: mockFolders,
        total: 1
      })

      // Act
      await folderController.getSubfolders(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.getSubfolders).toHaveBeenCalledWith(5, 1, 1, 10)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          folders: mockFolders,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        }
      })
    })

    it('应该在父文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { parentId: '999' }
      mockFolderService.getSubfolders = jest.fn().mockRejectedValue(new Error('父文件夹不存在'))

      // Act
      await folderController.getSubfolders(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('updateFolder', () => {
    it('应该成功更新文件夹信息', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'new-name',
        description: 'Updated'
      }

      mockRequest.params = { id: '1' }
      mockRequest.body = {
        name: 'new-name',
        description: 'Updated',
        isPublic: true
      }

      mockFolderService.updateFolder = jest.fn().mockResolvedValue(mockFolder)

      // Act
      await folderController.updateFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.updateFolder).toHaveBeenCalledWith(1, 1, {
        name: 'new-name',
        description: 'Updated',
        isPublic: true
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件夹信息更新成功',
        data: mockFolder
      })
    })

    it('应该在文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockRequest.body = { name: 'new' }
      mockFolderService.updateFolder = jest.fn().mockRejectedValue(new Error('文件夹不存在'))

      // Act
      await folderController.updateFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })

    it('应该在修改他人文件夹时返回 403', async () => {
      // Arrange
      mockRequest.params = { id: '1' }
      mockRequest.body = { name: 'new' }
      mockFolderService.updateFolder = jest.fn().mockRejectedValue(new Error('只能修改自己的文件夹'))

      // Act
      await folderController.updateFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
    })
  })

  describe('deleteFolder', () => {
    it('应该成功删除文件夹', async () => {
      // Arrange
      mockRequest.params = { id: '1' }
      mockFolderService.deleteFolder = jest.fn().mockResolvedValue(undefined)

      // Act
      await folderController.deleteFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.deleteFolder).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件夹删除成功'
      })
    })

    it('应该在文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockFolderService.deleteFolder = jest.fn().mockRejectedValue(new Error('文件夹不存在'))

      // Act
      await folderController.deleteFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })

    it('应该在有子文件夹时返回 400', async () => {
      // Arrange
      mockRequest.params = { id: '1' }
      mockFolderService.deleteFolder = jest.fn().mockRejectedValue(new Error('请先删除子文件夹'))

      // Act
      await folderController.deleteFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })

  describe('moveFolder', () => {
    it('应该成功移动文件夹', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'folder',
        parentId: 5
      }

      mockRequest.params = { id: '1' }
      mockRequest.body = { targetFolderId: 5 }
      mockFolderService.moveFolder = jest.fn().mockResolvedValue(mockFolder)

      // Act
      await folderController.moveFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.moveFolder).toHaveBeenCalledWith(1, 1, 5)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '文件夹移动成功',
        data: mockFolder
      })
    })

    it('应该能移动到根目录', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'folder',
        parentId: null
      }

      mockRequest.params = { id: '1' }
      mockRequest.body = { targetFolderId: null }
      mockFolderService.moveFolder = jest.fn().mockResolvedValue(mockFolder)

      // Act
      await folderController.moveFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.moveFolder).toHaveBeenCalledWith(1, 1, null)
    })

    it('应该在移动到子文件夹时返回 400', async () => {
      // Arrange
      mockRequest.params = { id: '1' }
      mockRequest.body = { targetFolderId: 5 }
      mockFolderService.moveFolder = jest.fn().mockRejectedValue(new Error('不能将文件夹移动到其子文件夹'))

      // Act
      await folderController.moveFolder(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getFolderTree', () => {
    it('应该成功获取文件夹树', async () => {
      // Arrange
      const mockTree = [
        {
          id: 1,
          name: 'root',
          children: [
            { id: 2, name: 'child', children: [] }
          ]
        }
      ]

      mockFolderService.getFolderTree = jest.fn().mockResolvedValue(mockTree)

      // Act
      await folderController.getFolderTree(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.getFolderTree).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTree
      })
    })

    it('应该在失败时返回 500', async () => {
      // Arrange
      mockFolderService.getFolderTree = jest.fn().mockRejectedValue(new Error('获取失败'))

      // Act
      await folderController.getFolderTree(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getFolderStats', () => {
    it('应该成功获取文件夹统计信息', async () => {
      // Arrange
      const mockStats = {
        fileCount: 10,
        subfolderCount: 3,
        totalSize: 1024000
      }

      mockRequest.params = { id: '1' }
      mockFolderService.getFolderStats = jest.fn().mockResolvedValue(mockStats)

      // Act
      await folderController.getFolderStats(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockFolderService.getFolderStats).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      })
    })

    it('应该在文件夹不存在时返回 404', async () => {
      // Arrange
      mockRequest.params = { id: '999' }
      mockFolderService.getFolderStats = jest.fn().mockRejectedValue(new Error('文件夹不存在'))

      // Act
      await folderController.getFolderStats(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })
})
