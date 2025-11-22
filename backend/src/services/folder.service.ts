import { Folder, FolderCreationAttributes } from '../models/Folder'
import { File } from '../models/File'
import { logger } from '../utils/logger'
import { Op } from 'sequelize'

export interface CreateFolderData {
  name: string
  userId: number
  parentId?: number
  isPublic?: boolean
  description?: string
}

export interface UpdateFolderData {
  name?: string
  description?: string
  isPublic?: boolean
}

export interface FolderTreeNode {
  id: number
  name: string
  path: string
  level: number
  isPublic: boolean
  children: FolderTreeNode[]
  fileCount?: number
}

export class FolderService {
  /**
   * 创建文件夹
   */
  async createFolder(data: CreateFolderData): Promise<Folder> {
    try {
      // 验证父文件夹
      let parentFolder: Folder | null = null
      let level = 0
      let path = `/${data.name}`

      if (data.parentId) {
        parentFolder = await Folder.findByPk(data.parentId)

        if (!parentFolder) {
          throw new Error('父文件夹不存在')
        }

        if (parentFolder.isDeleted) {
          throw new Error('父文件夹已被删除')
        }

        if (parentFolder.userId !== data.userId) {
          throw new Error('没有权限在此文件夹下创建子文件夹')
        }

        level = parentFolder.level + 1
        path = `${parentFolder.path}/${data.name}`

        // 检查层级限制
        if (level > 10) {
          throw new Error('文件夹层级不能超过10层')
        }
      }

      // 检查同名文件夹
      const existingFolder = await Folder.findOne({
        where: {
          name: data.name,
          parentId: data.parentId || null,
          userId: data.userId,
          isDeleted: false
        }
      })

      if (existingFolder) {
        throw new Error('同一目录下已存在同名文件夹')
      }

      // 创建文件夹
      const folderData: FolderCreationAttributes = {
        name: data.name,
        path,
        level,
        userId: data.userId,
        parentId: data.parentId,
        isPublic: data.isPublic ?? false,
        description: data.description
      }

      const folder = await Folder.create(folderData)
      logger.info(`文件夹创建成功: ${folder.id} - ${data.name}`)

      return folder
    } catch (error) {
      logger.error('创建文件夹失败:', error)
      throw error
    }
  }

  /**
   * 获取文件夹信息
   */
  async getFolderById(folderId: number, userId: number): Promise<Folder> {
    const folder = await Folder.findByPk(folderId)

    if (!folder) {
      throw new Error('文件夹不存在')
    }

    if (folder.isDeleted) {
      throw new Error('文件夹已被删除')
    }

    if (!folder.canAccess(userId)) {
      throw new Error('没有权限访问此文件夹')
    }

    return folder
  }

  /**
   * 获取用户的所有根文件夹
   */
  async getUserFolders(userId: number, page: number = 1, limit: number = 20): Promise<{ folders: Folder[]; total: number }> {
    const offset = (page - 1) * limit

    const { rows: folders, count: total } = await Folder.findAndCountAll({
      where: {
        userId,
        parentId: null,
        isDeleted: false
      },
      order: [['name', 'ASC']],
      limit,
      offset
    })

    return { folders, total }
  }

  /**
   * 获取子文件夹
   */
  async getSubfolders(parentId: number, userId: number, page: number = 1, limit: number = 20): Promise<{ folders: Folder[]; total: number }> {
    // 验证父文件夹权限
    const parentFolder = await Folder.findByPk(parentId)

    if (!parentFolder) {
      throw new Error('父文件夹不存在')
    }

    if (parentFolder.isDeleted) {
      throw new Error('父文件夹已被删除')
    }

    if (!parentFolder.canAccess(userId)) {
      throw new Error('没有权限访问此文件夹')
    }

    const offset = (page - 1) * limit

    const { rows: folders, count: total } = await Folder.findAndCountAll({
      where: {
        parentId,
        isDeleted: false
      },
      order: [['name', 'ASC']],
      limit,
      offset
    })

    return { folders, total }
  }

  /**
   * 更新文件夹信息
   */
  async updateFolder(folderId: number, userId: number, updateData: UpdateFolderData): Promise<Folder> {
    const folder = await Folder.findByPk(folderId)

    if (!folder) {
      throw new Error('文件夹不存在')
    }

    if (folder.userId !== userId) {
      throw new Error('只能修改自己的文件夹')
    }

    if (folder.isDeleted) {
      throw new Error('文件夹已被删除')
    }

    // 如果修改名称，检查同名
    if (updateData.name && updateData.name !== folder.name) {
      const existingFolder = await Folder.findOne({
        where: {
          name: updateData.name,
          parentId: folder.parentId || null,
          userId,
          isDeleted: false,
          id: { [Op.ne]: folderId }
        }
      })

      if (existingFolder) {
        throw new Error('同一目录下已存在同名文件夹')
      }

      // 更新路径
      const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'))
      folder.path = parentPath ? `${parentPath}/${updateData.name}` : `/${updateData.name}`
      folder.name = updateData.name
    }

    if (updateData.description !== undefined) {
      folder.description = updateData.description
    }

    if (updateData.isPublic !== undefined) {
      folder.isPublic = updateData.isPublic
    }

    await folder.save()
    logger.info(`文件夹信息更新成功: ${folderId}`)

    return folder
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(folderId: number, userId: number): Promise<void> {
    const folder = await Folder.findByPk(folderId)

    if (!folder) {
      throw new Error('文件夹不存在')
    }

    if (folder.userId !== userId) {
      throw new Error('只能删除自己的文件夹')
    }

    if (folder.isDeleted) {
      throw new Error('文件夹已被删除')
    }

    // 检查是否有子文件夹
    const subfolderCount = await Folder.count({
      where: {
        parentId: folderId,
        isDeleted: false
      }
    })

    if (subfolderCount > 0) {
      throw new Error('请先删除子文件夹')
    }

    // 检查是否有文件
    const fileCount = await File.count({
      where: {
        folderId,
        isDeleted: false
      }
    })

    if (fileCount > 0) {
      throw new Error('请先删除文件夹内的文件')
    }

    // 软删除
    await folder.softDelete(userId)
    logger.info(`文件夹删除成功: ${folderId} by user ${userId}`)
  }

  /**
   * 移动文件夹
   */
  async moveFolder(folderId: number, userId: number, newParentId: number | null): Promise<Folder> {
    const folder = await Folder.findByPk(folderId)

    if (!folder) {
      throw new Error('文件夹不存在')
    }

    if (folder.userId !== userId) {
      throw new Error('只能移动自己的文件夹')
    }

    if (folder.isDeleted) {
      throw new Error('文件夹已被删除')
    }

    // 不能移动到自己内部
    if (newParentId === folderId) {
      throw new Error('不能将文件夹移动到自身')
    }

    // 验证目标文件夹
    let newLevel = 0
    let newPath = `/${folder.name}`

    if (newParentId) {
      const targetFolder = await Folder.findByPk(newParentId)

      if (!targetFolder) {
        throw new Error('目标文件夹不存在')
      }

      if (targetFolder.isDeleted) {
        throw new Error('目标文件夹已被删除')
      }

      if (targetFolder.userId !== userId) {
        throw new Error('没有权限移动到此文件夹')
      }

      // 检查是否移动到子文件夹
      if (targetFolder.path.startsWith(folder.path + '/')) {
        throw new Error('不能将文件夹移动到其子文件夹')
      }

      newLevel = targetFolder.level + 1
      newPath = `${targetFolder.path}/${folder.name}`

      if (newLevel > 10) {
        throw new Error('移动后文件夹层级不能超过10层')
      }

      // 检查同名
      const existingFolder = await Folder.findOne({
        where: {
          name: folder.name,
          parentId: newParentId,
          userId,
          isDeleted: false,
          id: { [Op.ne]: folderId }
        }
      })

      if (existingFolder) {
        throw new Error('目标目录下已存在同名文件夹')
      }
    }

    folder.parentId = newParentId
    folder.level = newLevel
    folder.path = newPath
    await folder.save()

    logger.info(`文件夹移动成功: ${folderId} -> ${newParentId || 'root'}`)

    return folder
  }

  /**
   * 获取文件夹树
   */
  async getFolderTree(userId: number): Promise<FolderTreeNode[]> {
    // 获取用户所有未删除的文件夹
    const folders = await Folder.findAll({
      where: {
        userId,
        isDeleted: false
      },
      order: [['level', 'ASC'], ['name', 'ASC']]
    })

    // 构建树结构
    const folderMap = new Map<number, FolderTreeNode>()
    const rootNodes: FolderTreeNode[] = []

    // 第一遍：创建所有节点
    for (const folder of folders) {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        level: folder.level,
        isPublic: folder.isPublic,
        children: []
      })
    }

    // 第二遍：建立父子关系
    for (const folder of folders) {
      const node = folderMap.get(folder.id)!

      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!
        parent.children.push(node)
      } else {
        rootNodes.push(node)
      }
    }

    return rootNodes
  }

  /**
   * 获取文件夹统计信息
   */
  async getFolderStats(folderId: number, userId: number): Promise<{
    fileCount: number
    subfolderCount: number
    totalSize: number
  }> {
    const folder = await this.getFolderById(folderId, userId)

    const fileCount = await File.count({
      where: {
        folderId: folder.id,
        isDeleted: false
      }
    })

    const subfolderCount = await Folder.count({
      where: {
        parentId: folder.id,
        isDeleted: false
      }
    })

    const files = await File.findAll({
      where: {
        folderId: folder.id,
        isDeleted: false
      },
      attributes: ['size']
    })

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    return {
      fileCount,
      subfolderCount,
      totalSize
    }
  }
}
