import { api } from './api'
import type {
  File,
  Folder,
  FileShare,
  FileQueryParams,
  UploadFile,
  CreateShareRequest,
  PaginatedResponse,
  ApiResponse,
} from '@types/index'

export class FileService {
  /**
   * 上传文件
   */
  static async uploadFile(uploadData: UploadFile): Promise<File> {
    const formData = new FormData()
    formData.append('file', uploadData.file)

    if (uploadData.folderId) {
      formData.append('folderId', uploadData.folderId.toString())
    }
    if (uploadData.description) {
      formData.append('description', uploadData.description)
    }
    if (uploadData.isPublic !== undefined) {
      formData.append('isPublic', uploadData.isPublic.toString())
    }
    if (uploadData.tags && uploadData.tags.length > 0) {
      formData.append('tags', uploadData.tags.join(','))
    }

    const response = await api.upload<File>('/files/upload', formData)
    return response.data.data!
  }

  /**
   * 获取文件列表
   */
  static async getFiles(params: FileQueryParams = {}): Promise<PaginatedResponse<File>> {
    const response = await api.get<File[]>('/files', { params })

    // 转换为分页响应格式
    const files = response.data.data || []
    return {
      ...response.data,
      data: {
        items: files,
        total: files.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil(files.length / (params.pageSize || 20)),
      },
    }
  }

  /**
   * 获取文件详情
   */
  static async getFile(fileId: number): Promise<File> {
    const response = await api.get<File>(`/files/${fileId}`)
    return response.data.data!
  }

  /**
   * 下载文件
   */
  static async downloadFile(fileId: number, filename?: string): Promise<void> {
    const response = await api.get(`/files/${fileId}/download`)
    const file = response.data.data!
    return api.download(`/files/${fileId}/download`, filename || file.originalName)
  }

  /**
   * 删除文件
   */
  static async deleteFile(fileId: number): Promise<void> {
    await api.delete(`/files/${fileId}`)
  }

  /**
   * 更新文件信息
   */
  static async updateFile(fileId: number, updateData: Partial<File>): Promise<File> {
    const response = await api.put<File>(`/files/${fileId}`, updateData)
    return response.data.data!
  }

  /**
   * 搜索文件
   */
  static async searchFiles(
    query: string,
    options: {
      mimeType?: string
      extension?: string
      tags?: string[]
      includePublic?: boolean
    } = {}
  ): Promise<File[]> {
    const response = await api.get<File[]>('/files/search', {
      params: { query, ...options },
    })
    return response.data.data || []
  }

  /**
   * 获取文件统计信息
   */
  static async getFileStats(): Promise<{
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
    recentUploads: File[]
  }> {
    const response = await api.get('/files/stats')
    return response.data.data!
  }

  // ==================== 文件夹管理 ====================

  /**
   * 创建文件夹
   */
  static async createFolder(folderData: {
    name: string
    parentId?: number
    description?: string
    isPublic?: boolean
  }): Promise<Folder> {
    const response = await api.post<Folder>('/folders', folderData)
    return response.data.data!
  }

  /**
   * 获取文件夹列表
   */
  static async getFolders(parentId?: number): Promise<Folder[]> {
    const response = await api.get<Folder[]>('/folders', {
      params: parentId ? { parentId } : {},
    })
    return response.data.data || []
  }

  /**
   * 获取文件夹详情
   */
  static async getFolder(folderId: number): Promise<Folder> {
    const response = await api.get<Folder>(`/folders/${folderId}`)
    return response.data.data!
  }

  /**
   * 更新文件夹
   */
  static async updateFolder(folderId: number, updateData: Partial<Folder>): Promise<Folder> {
    const response = await api.put<Folder>(`/folders/${folderId}`, updateData)
    return response.data.data!
  }

  /**
   * 删除文件夹
   */
  static async deleteFolder(folderId: number): Promise<void> {
    await api.delete(`/folders/${folderId}`)
  }

  /**
   * 获取文件夹树结构
   */
  static async getFolderTree(): Promise<Folder[]> {
    const response = await api.get<Folder[]>('/folders/tree')
    return response.data.data || []
  }

  // ==================== 文件分享 ====================

  /**
   * 创建文件分享
   */
  static async createShare(shareData: CreateShareRequest): Promise<FileShare> {
    const response = await api.post<FileShare>('/shares', shareData)
    return response.data.data!
  }

  /**
   * 通过分享码访问文件
   */
  static async getFileByShareCode(shareCode: string, password?: string): Promise<{
    file: File
    share: FileShare
  }> {
    const response = await api.get(`/shares/${shareCode}`, {
      params: password ? { password } : {},
    })
    return response.data.data!
  }

  /**
   * 获取我的分享列表
   */
  static async getMyShares(): Promise<FileShare[]> {
    const response = await api.get<FileShare[]>('/shares/my')
    return response.data.data || []
  }

  /**
   * 删除分享
   */
  static async deleteShare(shareId: number): Promise<void> {
    await api.delete(`/shares/${shareId}`)
  }

  /**
   * 更新分享设置
   */
  static async updateShare(shareId: number, updateData: Partial<FileShare>): Promise<FileShare> {
    const response = await api.put<FileShare>(`/shares/${shareId}`, updateData)
    return response.data.data!
  }

  // ==================== 工具方法 ====================

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
  }

  /**
   * 检查文件类型
   */
  static getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive'
    return 'other'
  }

  /**
   * 生成文件预览URL
   */
  static getPreviewUrl(file: File): string | null {
    const { mimeType, path } = file

    if (mimeType.startsWith('image/')) {
      return `/api/files/preview/${file.id}`
    }

    if (mimeType === 'application/pdf') {
      return `/api/files/preview/${file.id}`
    }

    if (mimeType.startsWith('text/')) {
      return `/api/files/preview/${file.id}`
    }

    return null
  }
}

export default FileService