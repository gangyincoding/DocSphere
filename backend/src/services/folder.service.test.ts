import { FolderService } from './folder.service'
import { Folder } from '../models/Folder'
import { File } from '../models/File'
import { Op } from 'sequelize'

// Mock dependencies
jest.mock('../models/Folder')
jest.mock('../models/File')
jest.mock('../utils/logger')

describe('FolderService', () => {
  let folderService: FolderService

  beforeEach(() => {
    folderService = new FolderService()
    jest.clearAllMocks()
  })

  describe('createFolder', () => {
    it('应该成功创建根文件夹', async () => {
      // Arrange
      const createData = {
        name: 'test-folder',
        userId: 1
      }

      const mockFolder = {
        id: 1,
        name: 'test-folder',
        path: '/test-folder',
        level: 0,
        userId: 1
      }

      ;(Folder.findOne as jest.Mock).mockResolvedValue(null)
      ;(Folder.create as jest.Mock).mockResolvedValue(mockFolder)

      // Act
      const result = await folderService.createFolder(createData)

      // Assert
      expect(Folder.findOne).toHaveBeenCalledWith({
        where: {
          name: 'test-folder',
          parentId: null,
          userId: 1,
          isDeleted: false
        }
      })
      expect(Folder.create).toHaveBeenCalledWith({
        name: 'test-folder',
        path: '/test-folder',
        level: 0,
        userId: 1,
        parentId: undefined,
        isPublic: false,
        description: undefined
      })
      expect(result).toEqual(mockFolder)
    })

    it('应该成功创建子文件夹', async () => {
      // Arrange
      const createData = {
        name: 'sub-folder',
        userId: 1,
        parentId: 5
      }

      const mockParent = {
        id: 5,
        name: 'parent',
        path: '/parent',
        level: 0,
        userId: 1,
        isDeleted: false
      }

      const mockFolder = {
        id: 2,
        name: 'sub-folder',
        path: '/parent/sub-folder',
        level: 1,
        userId: 1,
        parentId: 5
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockParent)
      ;(Folder.findOne as jest.Mock).mockResolvedValue(null)
      ;(Folder.create as jest.Mock).mockResolvedValue(mockFolder)

      // Act
      const result = await folderService.createFolder(createData)

      // Assert
      expect(Folder.findByPk).toHaveBeenCalledWith(5)
      expect(result.level).toBe(1)
    })

    it('应该在父文件夹不存在时抛出错误', async () => {
      // Arrange
      const createData = {
        name: 'sub-folder',
        userId: 1,
        parentId: 999
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(folderService.createFolder(createData)).rejects.toThrow('父文件夹不存在')
    })

    it('应该在同名文件夹存在时抛出错误', async () => {
      // Arrange
      const createData = {
        name: 'existing-folder',
        userId: 1
      }

      ;(Folder.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'existing-folder' })

      // Act & Assert
      await expect(folderService.createFolder(createData)).rejects.toThrow('同一目录下已存在同名文件夹')
    })

    it('应该在层级超过10层时抛出错误', async () => {
      // Arrange
      const createData = {
        name: 'deep-folder',
        userId: 1,
        parentId: 5
      }

      const mockParent = {
        id: 5,
        level: 10,
        userId: 1,
        isDeleted: false,
        path: '/a/b/c/d/e/f/g/h/i/j'
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockParent)

      // Act & Assert
      await expect(folderService.createFolder(createData)).rejects.toThrow('文件夹层级不能超过10层')
    })
  })

  describe('getFolderById', () => {
    it('应该成功获取文件夹', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'test',
        isDeleted: false,
        canAccess: jest.fn().mockReturnValue(true)
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act
      const result = await folderService.getFolderById(1, 1)

      // Assert
      expect(Folder.findByPk).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockFolder)
    })

    it('应该在文件夹不存在时抛出错误', async () => {
      // Arrange
      ;(Folder.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(folderService.getFolderById(999, 1)).rejects.toThrow('文件夹不存在')
    })

    it('应该在文件夹已删除时抛出错误', async () => {
      // Arrange
      const mockFolder = { id: 1, isDeleted: true }
      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act & Assert
      await expect(folderService.getFolderById(1, 1)).rejects.toThrow('文件夹已被删除')
    })

    it('应该在没有权限时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        isDeleted: false,
        canAccess: jest.fn().mockReturnValue(false)
      }
      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act & Assert
      await expect(folderService.getFolderById(1, 2)).rejects.toThrow('没有权限访问此文件夹')
    })
  })

  describe('getUserFolders', () => {
    it('应该成功获取用户的根文件夹列表', async () => {
      // Arrange
      const mockFolders = [
        { id: 1, name: 'folder1' },
        { id: 2, name: 'folder2' }
      ]

      ;(Folder.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockFolders,
        count: 2
      })

      // Act
      const result = await folderService.getUserFolders(1, 1, 20)

      // Assert
      expect(Folder.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1,
          parentId: null,
          isDeleted: false
        },
        order: [['name', 'ASC']],
        limit: 20,
        offset: 0
      })
      expect(result.folders).toEqual(mockFolders)
      expect(result.total).toBe(2)
    })
  })

  describe('getSubfolders', () => {
    it('应该成功获取子文件夹列表', async () => {
      // Arrange
      const mockParent = {
        id: 5,
        isDeleted: false,
        canAccess: jest.fn().mockReturnValue(true)
      }

      const mockFolders = [{ id: 10, name: 'sub1' }]

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockParent)
      ;(Folder.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockFolders,
        count: 1
      })

      // Act
      const result = await folderService.getSubfolders(5, 1)

      // Assert
      expect(result.folders).toEqual(mockFolders)
    })

    it('应该在父文件夹不存在时抛出错误', async () => {
      // Arrange
      ;(Folder.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(folderService.getSubfolders(999, 1)).rejects.toThrow('父文件夹不存在')
    })
  })

  describe('updateFolder', () => {
    it('应该成功更新文件夹信息', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'old-name',
        path: '/old-name',
        userId: 1,
        isDeleted: false,
        parentId: null,
        description: '',
        isPublic: false,
        save: jest.fn().mockResolvedValue(undefined)
      }

      const updateData = {
        name: 'new-name',
        description: 'Updated'
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(Folder.findOne as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await folderService.updateFolder(1, 1, updateData)

      // Assert
      expect(mockFolder.name).toBe('new-name')
      expect(mockFolder.description).toBe('Updated')
      expect(mockFolder.save).toHaveBeenCalled()
    })

    it('应该在修改他人文件夹时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act & Assert
      await expect(
        folderService.updateFolder(1, 2, { name: 'new' })
      ).rejects.toThrow('只能修改自己的文件夹')
    })

    it('应该在重名时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'old',
        userId: 1,
        isDeleted: false,
        parentId: null
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(Folder.findOne as jest.Mock).mockResolvedValue({ id: 2, name: 'existing' })

      // Act & Assert
      await expect(
        folderService.updateFolder(1, 1, { name: 'existing' })
      ).rejects.toThrow('同一目录下已存在同名文件夹')
    })
  })

  describe('deleteFolder', () => {
    it('应该成功删除空文件夹', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        userId: 1,
        isDeleted: false,
        softDelete: jest.fn().mockResolvedValue(undefined)
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(Folder.count as jest.Mock).mockResolvedValue(0)
      ;(File.count as jest.Mock).mockResolvedValue(0)

      // Act
      await folderService.deleteFolder(1, 1)

      // Assert
      expect(mockFolder.softDelete).toHaveBeenCalledWith(1)
    })

    it('应该在文件夹不存在时抛出错误', async () => {
      // Arrange
      ;(Folder.findByPk as jest.Mock).mockResolvedValue(null)

      // Act & Assert
      await expect(folderService.deleteFolder(999, 1)).rejects.toThrow('文件夹不存在')
    })

    it('应该在删除他人文件夹时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act & Assert
      await expect(folderService.deleteFolder(1, 2)).rejects.toThrow('只能删除自己的文件夹')
    })

    it('应该在有子文件夹时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(Folder.count as jest.Mock).mockResolvedValue(2)

      // Act & Assert
      await expect(folderService.deleteFolder(1, 1)).rejects.toThrow('请先删除子文件夹')
    })

    it('应该在有文件时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(Folder.count as jest.Mock).mockResolvedValue(0)
      ;(File.count as jest.Mock).mockResolvedValue(5)

      // Act & Assert
      await expect(folderService.deleteFolder(1, 1)).rejects.toThrow('请先删除文件夹内的文件')
    })
  })

  describe('moveFolder', () => {
    it('应该成功移动文件夹到根目录', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'folder',
        path: '/parent/folder',
        level: 1,
        userId: 1,
        isDeleted: false,
        parentId: 5,
        save: jest.fn().mockResolvedValue(undefined)
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act
      const result = await folderService.moveFolder(1, 1, null)

      // Assert
      expect(mockFolder.parentId).toBeNull()
      expect(mockFolder.level).toBe(0)
      expect(mockFolder.path).toBe('/folder')
      expect(mockFolder.save).toHaveBeenCalled()
    })

    it('应该成功移动到另一个文件夹', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'folder',
        path: '/folder',
        level: 0,
        userId: 1,
        isDeleted: false,
        parentId: null,
        save: jest.fn().mockResolvedValue(undefined)
      }

      const mockTarget = {
        id: 5,
        path: '/target',
        level: 0,
        userId: 1,
        isDeleted: false
      }

      ;(Folder.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockFolder)
        .mockResolvedValueOnce(mockTarget)
      ;(Folder.findOne as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await folderService.moveFolder(1, 1, 5)

      // Assert
      expect(mockFolder.parentId).toBe(5)
      expect(mockFolder.level).toBe(1)
      expect(mockFolder.path).toBe('/target/folder')
    })

    it('应该在移动到自身时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        userId: 1,
        isDeleted: false
      }

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)

      // Act & Assert
      await expect(folderService.moveFolder(1, 1, 1)).rejects.toThrow('不能将文件夹移动到自身')
    })

    it('应该在移动到子文件夹时抛出错误', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        name: 'parent',
        path: '/parent',
        userId: 1,
        isDeleted: false
      }

      const mockTarget = {
        id: 5,
        path: '/parent/child',
        userId: 1,
        isDeleted: false,
        level: 1
      }

      ;(Folder.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockFolder)
        .mockResolvedValueOnce(mockTarget)

      // Act & Assert
      await expect(folderService.moveFolder(1, 1, 5)).rejects.toThrow('不能将文件夹移动到其子文件夹')
    })
  })

  describe('getFolderTree', () => {
    it('应该成功构建文件夹树', async () => {
      // Arrange
      const mockFolders = [
        { id: 1, name: 'root1', path: '/root1', level: 0, isPublic: false, parentId: null },
        { id: 2, name: 'root2', path: '/root2', level: 0, isPublic: true, parentId: null },
        { id: 3, name: 'child', path: '/root1/child', level: 1, isPublic: false, parentId: 1 }
      ]

      ;(Folder.findAll as jest.Mock).mockResolvedValue(mockFolders)

      // Act
      const result = await folderService.getFolderTree(1)

      // Assert
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('root1')
      expect(result[0].children.length).toBe(1)
      expect(result[0].children[0].name).toBe('child')
      expect(result[1].name).toBe('root2')
      expect(result[1].children.length).toBe(0)
    })

    it('应该返回空数组当没有文件夹时', async () => {
      // Arrange
      ;(Folder.findAll as jest.Mock).mockResolvedValue([])

      // Act
      const result = await folderService.getFolderTree(1)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getFolderStats', () => {
    it('应该成功获取文件夹统计信息', async () => {
      // Arrange
      const mockFolder = {
        id: 1,
        isDeleted: false,
        canAccess: jest.fn().mockReturnValue(true)
      }

      const mockFiles = [
        { size: 1024 },
        { size: 2048 }
      ]

      ;(Folder.findByPk as jest.Mock).mockResolvedValue(mockFolder)
      ;(File.count as jest.Mock).mockResolvedValue(2)
      ;(Folder.count as jest.Mock).mockResolvedValue(3)
      ;(File.findAll as jest.Mock).mockResolvedValue(mockFiles)

      // Act
      const result = await folderService.getFolderStats(1, 1)

      // Assert
      expect(result.fileCount).toBe(2)
      expect(result.subfolderCount).toBe(3)
      expect(result.totalSize).toBe(3072)
    })
  })
})
