import { api, ApiResponse } from './api'
import apiClient from './api'

// 文件类型定义
export interface FileInfo {
  id: number
  name: string
  originalName: string
  path: string
  size: number
  mimeType: string
  extension: string
  checksum: string
  userId: number
  folderId?: number
  isPublic: boolean
  description?: string
  tags?: string
  downloadCount: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// 文件夹类型定义
export interface FolderInfo {
  id: number
  name: string
  path: string
  parentId?: number | null
  level: number
  isPublic: boolean
  userId: number
  description?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// 文件夹树节点
export interface FolderTreeNode {
  id: number
  name: string
  path: string
  level: number
  isPublic: boolean
  children: FolderTreeNode[]
  fileCount?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  files?: T[]
  folders?: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 文件统计信息
export interface FileStats {
  totalFiles: number
  totalSize: number
  recentUploads: FileInfo[]
}

// 文件夹统计信息
export interface FolderStats {
  fileCount: number
  subfolderCount: number
  totalSize: number
}

// 上传选项
export interface UploadOptions {
  folderId?: number
  isPublic?: boolean
  description?: string
  tags?: string
  onProgress?: (percent: number) => void
}

// 文件服务
class FileServiceClass {
  /**
   * 上传文件
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<ApiResponse<FileInfo>> {
    const formData = new FormData()
    formData.append('file', file)

    if (options.folderId) {
      formData.append('folderId', String(options.folderId))
    }
    if (options.isPublic !== undefined) {
      formData.append('isPublic', String(options.isPublic))
    }
    if (options.description) {
      formData.append('description', options.description)
    }
    if (options.tags) {
      formData.append('tags', options.tags)
    }

    const response = await apiClient.post<ApiResponse<FileInfo>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          options.onProgress(percent)
        }
      }
    })

    return response.data
  }

  /**
   * 下载文件
   */
  async downloadFile(fileId: number): Promise<Blob> {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    })
    return response.data
  }

  /**
   * 获取文件信息
   */
  async getFileById(fileId: number): Promise<ApiResponse<FileInfo>> {
    return api.get<FileInfo>(`/files/${fileId}`)
  }

  /**
   * 获取用户的文件列表
   */
  async getUserFiles(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FileInfo>>> {
    return api.get<PaginatedResponse<FileInfo>>('/files', {
      params: { page, limit }
    })
  }

  /**
   * 获取文件夹内的文件
   */
  async getFolderFiles(folderId: number, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FileInfo>>> {
    return api.get<PaginatedResponse<FileInfo>>(`/files/folder/${folderId}`, {
      params: { page, limit }
    })
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: number): Promise<ApiResponse<void>> {
    return api.delete<void>(`/files/${fileId}`)
  }

  /**
   * 更新文件信息
   */
  async updateFileInfo(fileId: number, data: {
    name?: string
    description?: string
    tags?: string
    isPublic?: boolean
  }): Promise<ApiResponse<FileInfo>> {
    return api.put<FileInfo>(`/files/${fileId}`, data)
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(): Promise<ApiResponse<FileStats>> {
    return api.get<FileStats>('/files/stats')
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * 获取文件图标类型
   */
  getFileIconType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ppt'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive'
    if (mimeType.includes('text')) return 'text'
    return 'file'
  }
}

// 文件夹服务
class FolderServiceClass {
  /**
   * 创建文件夹
   */
  async createFolder(data: {
    name: string
    parentId?: number
    isPublic?: boolean
    description?: string
  }): Promise<ApiResponse<FolderInfo>> {
    return api.post<FolderInfo>('/folders', data)
  }

  /**
   * 获取文件夹信息
   */
  async getFolderById(folderId: number): Promise<ApiResponse<FolderInfo>> {
    return api.get<FolderInfo>(`/folders/${folderId}`)
  }

  /**
   * 获取用户的根文件夹列表
   */
  async getUserFolders(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FolderInfo>>> {
    return api.get<PaginatedResponse<FolderInfo>>('/folders', {
      params: { page, limit }
    })
  }

  /**
   * 获取子文件夹列表
   */
  async getSubfolders(parentId: number, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<FolderInfo>>> {
    return api.get<PaginatedResponse<FolderInfo>>(`/folders/${parentId}/subfolders`, {
      params: { page, limit }
    })
  }

  /**
   * 更新文件夹信息
   */
  async updateFolder(folderId: number, data: {
    name?: string
    description?: string
    isPublic?: boolean
  }): Promise<ApiResponse<FolderInfo>> {
    return api.put<FolderInfo>(`/folders/${folderId}`, data)
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(folderId: number): Promise<ApiResponse<void>> {
    return api.delete<void>(`/folders/${folderId}`)
  }

  /**
   * 移动文件夹
   */
  async moveFolder(folderId: number, targetFolderId: number | null): Promise<ApiResponse<FolderInfo>> {
    return api.put<FolderInfo>(`/folders/${folderId}/move`, { targetFolderId })
  }

  /**
   * 获取文件夹树
   */
  async getFolderTree(): Promise<ApiResponse<FolderTreeNode[]>> {
    return api.get<FolderTreeNode[]>('/folders/tree')
  }

  /**
   * 获取文件夹统计信息
   */
  async getFolderStats(folderId: number): Promise<ApiResponse<FolderStats>> {
    return api.get<FolderStats>(`/folders/${folderId}/stats`)
  }
}

export const FileService = new FileServiceClass()
export const FolderService = new FolderServiceClass()
