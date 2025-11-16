import { api } from './api'
import type {
  User,
  Role,
  Permission,
  PaginatedResponse,
  ApiResponse,
} from '@types/index'

export class PermissionService {
  // ==================== 用户管理 ====================

  /**
   * 获取用户列表
   */
  static async getUsers(params: {
    page?: number
    pageSize?: number
    search?: string
    isActive?: boolean
  } = {}): Promise<PaginatedResponse<User>> {
    const response = await api.get<User[]>('/users', { params })
    const users = response.data.data || []

    return {
      ...response.data,
      data: {
        items: users,
        total: users.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil(users.length / (params.pageSize || 20)),
      },
    }
  }

  /**
   * 获取用户详情
   */
  static async getUser(userId: number): Promise<User> {
    const response = await api.get<User>(`/users/${userId}`)
    return response.data.data!
  }

  /**
   * 创建用户
   */
  static async createUser(userData: {
    email: string
    password: string
    name: string
    phone?: string
    roleIds?: number[]
  }): Promise<User> {
    const response = await api.post<User>('/users', userData)
    return response.data.data!
  }

  /**
   * 更新用户
   */
  static async updateUser(userId: number, updateData: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, updateData)
    return response.data.data!
  }

  /**
   * 删除用户
   */
  static async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/${userId}`)
  }

  /**
   * 切换用户状态
   */
  static async toggleUserStatus(userId: number): Promise<User> {
    const response = await api.patch<User>(`/users/${userId}/toggle-status`)
    return response.data.data!
  }

  /**
   * 重置用户密码
   */
  static async resetUserPassword(userId: number, newPassword: string): Promise<void> {
    await api.put(`/users/${userId}/reset-password`, { password: newPassword })
  }

  // ==================== 角色管理 ====================

  /**
   * 获取角色列表
   */
  static async getRoles(params: {
    page?: number
    pageSize?: number
    search?: string
    isActive?: boolean
  } = {}): Promise<PaginatedResponse<Role>> {
    const response = await api.get<Role[]>('/roles', { params })
    const roles = response.data.data || []

    return {
      ...response.data,
      data: {
        items: roles,
        total: roles.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil(roles.length / (params.pageSize || 20)),
      },
    }
  }

  /**
   * 获取角色详情
   */
  static async getRole(roleId: number): Promise<Role> {
    const response = await api.get<Role>(`/roles/${roleId}`)
    return response.data.data!
  }

  /**
   * 创建角色
   */
  static async createRole(roleData: {
    name: string
    code: string
    description?: string
    level?: number
    permissionIds?: number[]
  }): Promise<Role> {
    const response = await api.post<Role>('/roles', roleData)
    return response.data.data!
  }

  /**
   * 更新角色
   */
  static async updateRole(roleId: number, updateData: Partial<Role>): Promise<Role> {
    const response = await api.put<Role>(`/roles/${roleId}`, updateData)
    return response.data.data!
  }

  /**
   * 删除角色
   */
  static async deleteRole(roleId: number): Promise<void> {
    await api.delete(`/roles/${roleId}`)
  }

  /**
   * 切换角色状态
   */
  static async toggleRoleStatus(roleId: number): Promise<Role> {
    const response = await api.patch<Role>(`/roles/${roleId}/toggle-status`)
    return response.data.data!
  }

  /**
   * 为角色分配权限
   */
  static async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
    await api.post(`/roles/${roleId}/permissions`, { permissionIds })
  }

  /**
   * 移除角色权限
   */
  static async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<void> {
    await api.delete(`/roles/${roleId}/permissions`, { data: { permissionIds } })
  }

  /**
   * 获取角色的权限列表
   */
  static async getRolePermissions(roleId: number): Promise<Permission[]> {
    const response = await api.get<Permission[]>(`/roles/${roleId}/permissions`)
    return response.data.data || []
  }

  // ==================== 权限管理 ====================

  /**
   * 获取权限列表
   */
  static async getPermissions(params: {
    page?: number
    pageSize?: number
    search?: string
    resource?: string
    action?: string
    isActive?: boolean
  } = {}): Promise<PaginatedResponse<Permission>> {
    const response = await api.get<Permission[]>('/permissions', { params })
    const permissions = response.data.data || []

    return {
      ...response.data,
      data: {
        items: permissions,
        total: permissions.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil(permissions.length / (params.pageSize || 20)),
      },
    }
  }

  /**
   * 获取权限详情
   */
  static async getPermission(permissionId: number): Promise<Permission> {
    const response = await api.get<Permission>(`/permissions/${permissionId}`)
    return response.data.data!
  }

  /**
   * 创建权限
   */
  static async createPermission(permissionData: {
    name: string
    code: string
    description?: string
    resource: string
    action: string
  }): Promise<Permission> {
    const response = await api.post<Permission>('/permissions', permissionData)
    return response.data.data!
  }

  /**
   * 更新权限
   */
  static async updatePermission(permissionId: number, updateData: Partial<Permission>): Promise<Permission> {
    const response = await api.put<Permission>(`/permissions/${permissionId}`, updateData)
    return response.data.data!
  }

  /**
   * 删除权限
   */
  static async deletePermission(permissionId: number): Promise<void> {
    await api.delete(`/permissions/${permissionId}`)
  }

  /**
   * 切换权限状态
   */
  static async togglePermissionStatus(permissionId: number): Promise<Permission> {
    const response = await api.patch<Permission>(`/permissions/${permissionId}/toggle-status`)
    return response.data.data!
  }

  /**
   * 获取权限资源列表
   */
  static async getResources(): Promise<string[]> {
    const response = await api.get<string[]>('/permissions/resources')
    return response.data.data || []
  }

  /**
   * 获取权限操作列表
   */
  static async getActions(): Promise<string[]> {
    const response = await api.get<string[]>('/permissions/actions')
    return response.data.data || []
  }

  // ==================== 用户角色管理 ====================

  /**
   * 为用户分配角色
   */
  static async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
    await api.post(`/users/${userId}/roles`, { roleIds })
  }

  /**
   * 移除用户角色
   */
  static async removeRolesFromUser(userId: number, roleIds: number[]): Promise<void> {
    await api.delete(`/users/${userId}/roles`, { data: { roleIds } })
  }

  /**
   * 获取用户的角色列表
   */
  static async getUserRoles(userId: number): Promise<Role[]> {
    const response = await api.get<Role[]>(`/users/${userId}/roles`)
    return response.data.data || []
  }

  /**
   * 获取用户的权限列表
   */
  static async getUserPermissions(userId: number): Promise<Permission[]> {
    const response = await api.get<Permission[]>(`/users/${userId}/permissions`)
    return response.data.data || []
  }

  // ==================== 权限检查 ====================

  /**
   * 检查用户是否有特定权限
   */
  static async checkPermission(userId: number, resource: string, action: string): Promise<boolean> {
    try {
      const response = await api.post('/permissions/check', {
        userId,
        resource,
        action,
      })
      return response.data.data || false
    } catch (error) {
      return false
    }
  }

  /**
   * 批量检查权限
   */
  static async checkMultiplePermissions(
    userId: number,
    permissions: Array<{ resource: string; action: string }>
  ): Promise<Record<string, boolean>> {
    try {
      const response = await api.post('/permissions/check-batch', {
        userId,
        permissions,
      })
      return response.data.data || {}
    } catch (error) {
      return {}
    }
  }

  // ==================== 系统初始化 ====================

  /**
   * 初始化系统权限
   */
  static async initializePermissions(): Promise<void> {
    await api.post('/permissions/initialize')
  }

  /**
   * 初始化系统角色
   */
  static async initializeRoles(): Promise<void> {
    await api.post('/roles/initialize')
  }

  /**
   * 获取系统权限统计
   */
  static async getPermissionStats(): Promise<{
    totalUsers: number
    totalRoles: number
    totalPermissions: number
    activeUsers: number
    activeRoles: number
    activePermissions: number
  }> {
    const response = await api.get('/permissions/stats')
    return response.data.data!
  }
}

export default PermissionService