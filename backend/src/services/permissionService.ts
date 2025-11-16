import { Permission, Role, User, UserRole, RolePermission } from '../models/associations';
import { Op, Transaction, sequelize } from 'sequelize';
import { ValidationError, NotFoundError, ConflictError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

// 权限创建数据接口
export interface CreatePermissionData {
  name: string;
  code: string;
  description?: string;
  resource: string;
  action: string;
  module: string;
}

// 角色创建数据接口
export interface CreateRoleData {
  name: string;
  code: string;
  description?: string;
  level?: number;
}

// 权限检查接口
export interface PermissionCheck {
  resource: string;
  action: string;
  resourceId?: string;
}

export class PermissionService {
  /**
   * 创建权限
   */
  public async createPermission(data: CreatePermissionData): Promise<Permission> {
    try {
      // 检查权限代码是否已存在
      const existingPermission = await Permission.findOne({
        where: { code: data.code }
      });

      if (existingPermission) {
        throw new ConflictError('权限代码已存在');
      }

      const permission = await Permission.create({
        name: data.name,
        code: data.code,
        description: data.description || '',
        resource: data.resource,
        action: data.action,
        module: data.module,
        isActive: true,
      });

      logger.info(`权限创建成功: ${permission.code}`, { permissionId: permission.id });

      return permission;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('创建权限失败', { error, permissionData: data });
      throw new DatabaseError('创建权限失败');
    }
  }

  /**
   * 创建角色
   */
  public async createRole(data: CreateRoleData): Promise<Role> {
    try {
      // 检查角色代码是否已存在
      const existingRole = await Role.findOne({
        where: { code: data.code }
      });

      if (existingRole) {
        throw new ConflictError('角色代码已存在');
      }

      const role = await Role.create({
        name: data.name,
        code: data.code,
        description: data.description || '',
        level: data.level || 0,
        isSystem: false,
        isActive: true,
      });

      logger.info(`角色创建成功: ${role.code}`, { roleId: role.id });

      return role;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('创建角色失败', { error, roleData: data });
      throw new DatabaseError('创建角色失败');
    }
  }

  /**
   * 为角色分配权限
   */
  public async assignPermissionToRole(
    roleId: number,
    permissionId: number,
    grantedBy: number
  ): Promise<void> {
    try {
      // 检查角色是否存在
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new NotFoundError('角色不存在');
      }

      // 检查权限是否存在
      const permission = await Permission.findByPk(permissionId);
      if (!permission) {
        throw new NotFoundError('权限不存在');
      }

      // 检查是否已经分配
      const existingAssignment = await RolePermission.findOne({
        where: { roleId, permissionId }
      });

      if (existingAssignment) {
        throw new ConflictError('该权限已分配给此角色');
      }

      await RolePermission.create({
        roleId,
        permissionId,
        grantedBy,
        isActive: true,
      });

      logger.info('角色权限分配成功', { roleId, permissionId, grantedBy });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('分配权限失败', { error, roleId, permissionId, grantedBy });
      throw new DatabaseError('分配权限失败');
    }
  }

  /**
   * 为用户分配角色
   */
  public async assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // 检查用户是否存在
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      // 检查角色是否存在
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new NotFoundError('角色不存在');
      }

      // 检查是否已经分配
      const existingAssignment = await UserRole.findOne({
        where: { userId, roleId }
      });

      if (existingAssignment) {
        throw new ConflictError('该角色已分配给此用户');
      }

      await UserRole.create({
        userId,
        roleId,
        assignedBy,
        expiresAt,
        isActive: true,
      });

      logger.info('用户角色分配成功', { userId, roleId, assignedBy, expiresAt });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('分配角色失败', { error, userId, roleId, assignedBy });
      throw new DatabaseError('分配角色失败');
    }
  }

  /**
   * 检查用户是否具有指定权限
   */
  public async checkUserPermission(
    userId: number,
    permissionCheck: PermissionCheck
  ): Promise<boolean> {
    try {
      // 查找匹配的权限代码
      const permissionCode = this.buildPermissionCode(
        permissionCheck.resource,
        permissionCheck.action
      );

      const permission = await Permission.findOne({
        where: {
          code: permissionCode,
          isActive: true,
        },
        include: [{
          model: Role,
          as: 'roles',
          where: {
            isActive: true,
          },
          include: [{
            model: UserRole,
            as: 'roleUsers',
            where: {
              userId,
              isActive: true,
              [Op.or]: [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: new Date() } }
              ]
            },
            required: true,
          }],
          required: true,
        }],
      });

      return !!permission;
    } catch (error) {
      logger.error('检查用户权限失败', { error, userId, permissionCheck });
      return false;
    }
  }

  /**
   * 获取用户的所有权限
   */
  public async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          where: {
            isActive: true,
          },
          include: [{
            model: Permission,
            as: 'permissions',
            where: {
              isActive: true,
            },
            through: {
              where: {
                isActive: true,
              },
            },
          }],
          through: {
            where: {
              isActive: true,
              [Op.or]: [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: new Date() } }
              ]
            },
          },
        }],
      });

      if (!user) {
        return [];
      }

      // 收集所有权限并去重
      const allPermissions: Permission[] = [];
      const permissionMap = new Map<number, Permission>();

      for (const role of user.roles) {
        for (const permission of role.permissions) {
          if (!permissionMap.has(permission.id)) {
            permissionMap.set(permission.id, permission);
            allPermissions.push(permission);
          }
        }
      }

      return allPermissions;
    } catch (error) {
      logger.error('获取用户权限失败', { error, userId });
      throw new DatabaseError('获取用户权限失败');
    }
  }

  /**
   * 获取用户的所有角色
   */
  public async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const userRoles = await UserRole.findAll({
        where: {
          userId,
          isActive: true,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: {
            isActive: true,
          },
        }],
      });

      return userRoles.map(ur => ur.role!);
    } catch (error) {
      logger.error('获取用户角色失败', { error, userId });
      throw new DatabaseError('获取用户角色失败');
    }
  }

  /**
   * 检查用户是否具有指定角色
   */
  public async checkUserRole(userId: number, roleCode: string): Promise<boolean> {
    try {
      const userRole = await UserRole.findOne({
        where: {
          userId,
          isActive: true,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        },
        include: [{
          model: Role,
          as: 'role',
          where: {
            code: roleCode,
            isActive: true,
          },
        }],
      });

      return !!userRole;
    } catch (error) {
      logger.error('检查用户角色失败', { error, userId, roleCode });
      return false;
    }
  }

  /**
   * 获取角色的所有权限
   */
  public async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const role = await Role.findByPk(roleId, {
        include: [{
          model: Permission,
          as: 'permissions',
          where: {
            isActive: true,
          },
          through: {
            where: {
              isActive: true,
            },
          },
        }],
      });

      if (!role) {
        throw new NotFoundError('角色不存在');
      }

      return role.permissions;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('获取角色权限失败', { error, roleId });
      throw new DatabaseError('获取角色权限失败');
    }
  }

  /**
   * 撤销角色权限
   */
  public async revokePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    try {
      const rolePermission = await RolePermission.findOne({
        where: { roleId, permissionId }
      });

      if (!rolePermission) {
        throw new NotFoundError('角色权限关联不存在');
      }

      await rolePermission.destroy();

      logger.info('角色权限撤销成功', { roleId, permissionId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('撤销权限失败', { error, roleId, permissionId });
      throw new DatabaseError('撤销权限失败');
    }
  }

  /**
   * 撤销用户角色
   */
  public async revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
    try {
      const userRole = await UserRole.findOne({
        where: { userId, roleId }
      });

      if (!userRole) {
        throw new NotFoundError('用户角色关联不存在');
      }

      await userRole.destroy();

      logger.info('用户角色撤销成功', { userId, roleId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('撤销角色失败', { error, userId, roleId });
      throw new DatabaseError('撤销角色失败');
    }
  }

  /**
   * 初始化系统权限和角色
   */
  public async initializeSystemPermissions(): Promise<void> {
    try {
      await sequelize.transaction(async (t: Transaction) => {
        // 创建系统角色
        const adminRole = await Role.findOrCreate({
          where: { code: 'admin' },
          defaults: {
            name: '系统管理员',
            code: 'admin',
            description: '系统管理员，拥有所有权限',
            level: 1000,
            isSystem: true,
            isActive: true,
          },
          transaction: t,
        });

        const userRole = await Role.findOrCreate({
          where: { code: 'user' },
          defaults: {
            name: '普通用户',
            code: 'user',
            description: '普通用户，拥有基本权限',
            level: 100,
            isSystem: true,
            isActive: true,
          },
          transaction: t,
        });

        // 创建系统权限
        const permissions = [
          // 用户管理权限
          { name: '用户列表查看', code: 'user:list', resource: 'user', action: 'list', module: 'user' },
          { name: '用户创建', code: 'user:create', resource: 'user', action: 'create', module: 'user' },
          { name: '用户查看', code: 'user:read', resource: 'user', action: 'read', module: 'user' },
          { name: '用户更新', code: 'user:update', resource: 'user', action: 'update', module: 'user' },
          { name: '用户删除', code: 'user:delete', resource: 'user', action: 'delete', module: 'user' },
          { name: '用户管理', code: 'user:manage', resource: 'user', action: 'manage', module: 'user' },

          // 文件管理权限
          { name: '文件上传', code: 'file:upload', resource: 'file', action: 'upload', module: 'file' },
          { name: '文件下载', code: 'file:download', resource: 'file', action: 'download', module: 'file' },
          { name: '文件列表查看', code: 'file:list', resource: 'file', action: 'list', module: 'file' },
          { name: '文件查看', code: 'file:read', resource: 'file', action: 'read', module: 'file' },
          { name: '文件更新', code: 'file:update', resource: 'file', action: 'update', module: 'file' },
          { name: '文件删除', code: 'file:delete', resource: 'file', action: 'delete', module: 'file' },
          { name: '文件共享', code: 'file:share', resource: 'file', action: 'share', module: 'file' },

          // 文件夹管理权限
          { name: '文件夹创建', code: 'folder:create', resource: 'folder', action: 'create', module: 'file' },
          { name: '文件夹列表查看', code: 'folder:list', resource: 'folder', action: 'list', module: 'file' },
          { name: '文件夹查看', code: 'folder:read', resource: 'folder', action: 'read', module: 'file' },
          { name: '文件夹更新', code: 'folder:update', resource: 'folder', action: 'update', module: 'file' },
          { name: '文件夹删除', code: 'folder:delete', resource: 'folder', action: 'delete', module: 'file' },

          // 权限管理权限
          { name: '权限列表查看', code: 'permission:list', resource: 'permission', action: 'list', module: 'permission' },
          { name: '权限创建', code: 'permission:create', resource: 'permission', action: 'create', module: 'permission' },
          { name: '权限查看', code: 'permission:read', resource: 'permission', action: 'read', module: 'permission' },
          { name: '权限更新', code: 'permission:update', resource: 'permission', action: 'update', module: 'permission' },
          { name: '权限删除', code: 'permission:delete', resource: 'permission', action: 'delete', module: 'permission' },

          // 角色管理权限
          { name: '角色列表查看', code: 'role:list', resource: 'role', action: 'list', module: 'permission' },
          { name: '角色创建', code: 'role:create', resource: 'role', action: 'create', module: 'permission' },
          { name: '角色查看', code: 'role:read', resource: 'role', action: 'read', module: 'permission' },
          { name: '角色更新', code: 'role:update', resource: 'role', action: 'update', module: 'permission' },
          { name: '角色删除', code: 'role:delete', resource: 'role', action: 'delete', module: 'permission' },

          // 系统管理权限
          { name: '系统配置查看', code: 'system:read', resource: 'system', action: 'read', module: 'system' },
          { name: '系统配置更新', code: 'system:update', resource: 'system', action: 'update', module: 'system' },
          { name: '系统管理', code: 'system:admin', resource: 'system', action: 'admin', module: 'system' },

          // 审计日志权限
          { name: '审计日志查看', code: 'audit:read', resource: 'audit', action: 'read', module: 'audit' },
          { name: '审计日志管理', code: 'audit:admin', resource: 'audit', action: 'admin', module: 'audit' },
        ];

        const createdPermissions = await Promise.all(
          permissions.map(permission =>
            Permission.findOrCreate({
              where: { code: permission.code },
              defaults: {
                ...permission,
                isActive: true,
              },
              transaction: t,
            })
          )
        );

        // 为管理员角色分配所有权限
        const adminRoleId = adminRole[0].id;
        const permissionIds = createdPermissions.map(([permission]) => permission.id);

        await Promise.all(
          permissionIds.map(permissionId =>
            RolePermission.findOrCreate({
              where: { roleId: adminRoleId, permissionId },
              defaults: {
                roleId: adminRoleId,
                permissionId,
                grantedBy: 1, // 系统管理员
                isActive: true,
              },
              transaction: t,
            })
          )
        );

        // 为普通用户角色分配基本权限
        const userRoleId = userRole[0].id;
        const basicPermissions = [
          'file:upload', 'file:download', 'file:list', 'file:read',
          'folder:create', 'folder:list', 'folder:read',
        ];

        await Promise.all(
          basicPermissions.map(permissionCode =>
            RolePermission.findOrCreate({
              where: {
                roleId: userRoleId,
                permissionId: createdPermissions.find(([p]) => p.code === permissionCode)![0].id,
              },
              defaults: {
                roleId: userRoleId,
                permissionId: createdPermissions.find(([p]) => p.code === permissionCode)![0].id,
                grantedBy: 1,
                isActive: true,
              },
              transaction: t,
            })
          )
        );
      });

      logger.info('系统权限和角色初始化完成');
    } catch (error) {
      logger.error('系统权限初始化失败', { error });
      throw new DatabaseError('系统权限初始化失败');
    }
  }

  /**
   * 构建权限代码
   */
  private buildPermissionCode(resource: string, action: string): string {
    return `${resource}:${action}`;
  }
}

export default new PermissionService();