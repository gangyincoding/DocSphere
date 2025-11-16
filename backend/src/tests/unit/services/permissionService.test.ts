import permissionService from '../../../services/permissionService';
import { User, Role, Permission, UserRole, RolePermission } from '../../../models/associations';
import { sequelize } from '../../../config/database';
import { ConflictError, NotFoundError, DatabaseError } from '../../../utils/errors';

describe('PermissionService', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('createPermission', () => {
    it('应该成功创建权限', async () => {
      const permissionData = {
        name: '用户查看权限',
        code: 'user:read',
        description: '查看用户信息',
        resource: 'user',
        action: 'read',
        module: 'user'
      };

      const permission = await permissionService.createPermission(permissionData);

      expect(permission.id).toBeDefined();
      expect(permission.name).toBe(permissionData.name);
      expect(permission.code).toBe(permissionData.code);
      expect(permission.description).toBe(permissionData.description);
      expect(permission.resource).toBe(permissionData.resource);
      expect(permission.action).toBe(permissionData.action);
      expect(permission.module).toBe(permissionData.module);
      expect(permission.isActive).toBe(true);
    });

    it('应该拒绝重复的权限代码', async () => {
      const permissionData = {
        name: '用户查看权限',
        code: 'user:read',
        description: '查看用户信息',
        resource: 'user',
        action: 'read',
        module: 'user'
      };

      await permissionService.createPermission(permissionData);

      await expect(permissionService.createPermission(permissionData))
        .rejects.toThrow(ConflictError);
    });

    it('应该处理无效的权限代码格式', async () => {
      const invalidPermissionData = {
        name: '测试权限',
        code: 'invalid code with spaces',
        description: '测试',
        resource: 'user',
        action: 'read',
        module: 'user'
      };

      await expect(permissionService.createPermission(invalidPermissionData))
        .rejects.toThrow();
    });
  });

  describe('createRole', () => {
    it('应该成功创建角色', async () => {
      const roleData = {
        name: '管理员角色',
        code: 'admin_role',
        description: '系统管理员角色',
        level: 1000
      };

      const role = await permissionService.createRole(roleData);

      expect(role.id).toBeDefined();
      expect(role.name).toBe(roleData.name);
      expect(role.code).toBe(roleData.code);
      expect(role.description).toBe(roleData.description);
      expect(role.level).toBe(roleData.level);
      expect(role.isSystem).toBe(false);
      expect(role.isActive).toBe(true);
    });

    it('应该使用默认值', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role'
      };

      const role = await permissionService.createRole(roleData);

      expect(role.level).toBe(0);
      expect(role.isSystem).toBe(false);
      expect(role.isActive).toBe(true);
    });

    it('应该拒绝重复的角色代码', async () => {
      const roleData = {
        name: '测试角色',
        code: 'test_role'
      };

      await permissionService.createRole(roleData);

      await expect(permissionService.createRole(roleData))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('assignPermissionToRole', () => {
    let role: Role;
    let permission: Permission;

    beforeEach(async () => {
      role = await Role.create({
        name: '测试角色',
        code: 'test_role',
        level: 10,
        isActive: true,
      });

      permission = await Permission.create({
        name: '测试权限',
        code: 'test:permission',
        resource: 'test',
        action: 'read',
        module: 'test',
        isActive: true,
      });
    });

    it('应该成功为角色分配权限', async () => {
      await permissionService.assignPermissionToRole(role.id, permission.id, 1);

      const rolePermission = await RolePermission.findOne({
        where: { roleId: role.id, permissionId: permission.id }
      });

      expect(rolePermission).toBeDefined();
      expect(rolePermission!.roleId).toBe(role.id);
      expect(rolePermission!.permissionId).toBe(permission.id);
      expect(rolePermission!.grantedBy).toBe(1);
      expect(rolePermission!.isActive).toBe(true);
    });

    it('应该拒绝不存在的角色', async () => {
      await expect(permissionService.assignPermissionToRole(9999, permission.id, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝不存在的权限', async () => {
      await expect(permissionService.assignPermissionToRole(role.id, 9999, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝重复分配', async () => {
      await permissionService.assignPermissionToRole(role.id, permission.id, 1);

      await expect(permissionService.assignPermissionToRole(role.id, permission.id, 1))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('assignRoleToUser', () => {
    let user: User;
    let role: Role;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      role = await Role.create({
        name: '测试角色',
        code: 'test_role',
        level: 10,
        isActive: true,
      });
    });

    it('应该成功为用户分配角色', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);

      const userRole = await UserRole.findOne({
        where: { userId: user.id, roleId: role.id }
      });

      expect(userRole).toBeDefined();
      expect(userRole!.userId).toBe(user.id);
      expect(userRole!.roleId).toBe(role.id);
      expect(userRole!.assignedBy).toBe(1);
      expect(userRole!.isActive).toBe(true);
      expect(userRole!.expiresAt).toBeNull();
    });

    it('应该支持设置过期时间', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30天后过期

      await permissionService.assignRoleToUser(user.id, role.id, 1, expiresAt);

      const userRole = await UserRole.findOne({
        where: { userId: user.id, roleId: role.id }
      });

      expect(userRole!.expiresAt).toEqual(expiresAt);
    });

    it('应该拒绝不存在的用户', async () => {
      await expect(permissionService.assignRoleToUser(9999, role.id, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝不存在的角色', async () => {
      await expect(permissionService.assignRoleToUser(user.id, 9999, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝重复分配', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);

      await expect(permissionService.assignRoleToUser(user.id, role.id, 1))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('checkUserPermission', () => {
    let user: User;
    let role: Role;
    let permission: Permission;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      role = await Role.create({
        name: '测试角色',
        code: 'test_role',
        level: 10,
        isActive: true,
      });

      permission = await Permission.create({
        name: '用户查看权限',
        code: 'user:read',
        resource: 'user',
        action: 'read',
        module: 'user',
        isActive: true,
      });
    });

    it('应该返回用户具有权限时为true', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);
      await permissionService.assignPermissionToRole(role.id, permission.id, 1);

      const hasPermission = await permissionService.checkUserPermission(user.id, {
        resource: 'user',
        action: 'read'
      });

      expect(hasPermission).toBe(true);
    });

    it('应该返回用户没有权限时为false', async () => {
      const hasPermission = await permissionService.checkUserPermission(user.id, {
        resource: 'user',
        action: 'read'
      });

      expect(hasPermission).toBe(false);
    });

    it('应该忽略非活跃的权限', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);
      await permissionService.assignPermissionToRole(role.id, permission.id, 1);

      // 停用权限
      await permission.update({ isActive: false });

      const hasPermission = await permissionService.checkUserPermission(user.id, {
        resource: 'user',
        action: 'read'
      });

      expect(hasPermission).toBe(false);
    });

    it('应该忽略过期的角色', async () => {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() - 1); // 已过期

      await permissionService.assignRoleToUser(user.id, role.id, 1, expiresAt);
      await permissionService.assignPermissionToRole(role.id, permission.id, 1);

      const hasPermission = await permissionService.checkUserPermission(user.id, {
        resource: 'user',
        action: 'read'
      });

      expect(hasPermission).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    let user: User;
    let role1: Role;
    let role2: Role;
    let permission1: Permission;
    let permission2: Permission;
    let permission3: Permission;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      role1 = await Role.create({
        name: '角色1',
        code: 'role1',
        isActive: true,
      });

      role2 = await Role.create({
        name: '角色2',
        code: 'role2',
        isActive: true,
      });

      permission1 = await Permission.create({
        name: '权限1',
        code: 'permission1',
        resource: 'test',
        action: 'read',
        module: 'test',
        isActive: true,
      });

      permission2 = await Permission.create({
        name: '权限2',
        code: 'permission2',
        resource: 'test',
        action: 'write',
        module: 'test',
        isActive: true,
      });

      permission3 = await Permission.create({
        name: '权限3',
        code: 'permission3',
        resource: 'test',
        action: 'delete',
        module: 'test',
        isActive: true,
      });
    });

    it('应该获取用户的所有权限', async () => {
      // 分配两个角色给用户
      await permissionService.assignRoleToUser(user.id, role1.id, 1);
      await permissionService.assignRoleToUser(user.id, role2.id, 1);

      // 为角色1分配权限1和权限2
      await permissionService.assignPermissionToRole(role1.id, permission1.id, 1);
      await permissionService.assignPermissionToRole(role1.id, permission2.id, 1);

      // 为角色2分配权限3
      await permissionService.assignPermissionToRole(role2.id, permission3.id, 1);

      const permissions = await permissionService.getUserPermissions(user.id);

      expect(permissions).toHaveLength(3);
      expect(permissions.map(p => p.code)).toContain('permission1');
      expect(permissions.map(p => p.code)).toContain('permission2');
      expect(permissions.map(p => p.code)).toContain('permission3');
    });

    it('应该去重重复的权限', async () => {
      await permissionService.assignRoleToUser(user.id, role1.id, 1);
      await permissionService.assignRoleToUser(user.id, role2.id, 1);

      // 两个角色都分配同一个权限
      await permissionService.assignPermissionToRole(role1.id, permission1.id, 1);
      await permissionService.assignPermissionToRole(role2.id, permission1.id, 1);

      const permissions = await permissionService.getUserPermissions(user.id);

      expect(permissions).toHaveLength(1);
      expect(permissions[0].code).toBe('permission1');
    });

    it('应该返回空数组当用户没有权限时', async () => {
      const permissions = await permissionService.getUserPermissions(user.id);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('getUserRoles', () => {
    let user: User;
    let role1: Role;
    let role2: Role;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      role1 = await Role.create({
        name: '角色1',
        code: 'role1',
        isActive: true,
      });

      role2 = await Role.create({
        name: '角色2',
        code: 'role2',
        isActive: true,
      });
    });

    it('应该获取用户的所有角色', async () => {
      await permissionService.assignRoleToUser(user.id, role1.id, 1);
      await permissionService.assignRoleToUser(user.id, role2.id, 1);

      const roles = await permissionService.getUserRoles(user.id);

      expect(roles).toHaveLength(2);
      expect(roles.map(r => r.code)).toContain('role1');
      expect(roles.map(r => r.code)).toContain('role2');
    });

    it('应该过滤过期的角色', async () => {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() - 1); // 已过期

      await permissionService.assignRoleToUser(user.id, role1.id, 1);
      await permissionService.assignRoleToUser(user.id, role2.id, 1, expiresAt);

      const roles = await permissionService.getUserRoles(user.id);

      expect(roles).toHaveLength(1);
      expect(roles[0].code).toBe('role1');
    });

    it('应该只返回活跃的角色', async () => {
      await permissionService.assignRoleToUser(user.id, role1.id, 1);
      await permissionService.assignRoleToUser(user.id, role2.id, 1);

      // 停用角色2
      await role2.update({ isActive: false });

      const roles = await permissionService.getUserRoles(user.id);

      expect(roles).toHaveLength(1);
      expect(roles[0].code).toBe('role1');
    });
  });

  describe('checkUserRole', () => {
    let user: User;
    let role: Role;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      role = await Role.create({
        name: '测试角色',
        code: 'test_role',
        level: 10,
        isActive: true,
      });
    });

    it('应该返回用户有角色时为true', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);

      const hasRole = await permissionService.checkUserRole(user.id, 'test_role');

      expect(hasRole).toBe(true);
    });

    it('应该返回用户没有角色时为false', async () => {
      const hasRole = await permissionService.checkUserRole(user.id, 'test_role');

      expect(hasRole).toBe(false);
    });

    it('应该检查正确的角色代码', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);

      const hasRole = await permissionService.checkUserRole(user.id, 'wrong_role');

      expect(hasRole).toBe(false);
    });
  });

  describe('revokePermissionFromRole', () => {
    let role: Role;
    let permission: Permission;

    beforeEach(async () => {
      role = await Role.create({
        name: '测试角色',
        code: 'test_role',
        level: 10,
        isActive: true,
      });

      permission = await Permission.create({
        name: '测试权限',
        code: 'test:permission',
        resource: 'test',
        action: 'read',
        module: 'test',
        isActive: true,
      });
    });

    it('应该成功撤销角色权限', async () => {
      await permissionService.assignPermissionToRole(role.id, permission.id, 1);
      await permissionService.revokePermissionFromRole(role.id, permission.id);

      const rolePermission = await RolePermission.findOne({
        where: { roleId: role.id, permissionId: permission.id }
      });

      expect(rolePermission).toBeNull();
    });

    it('应该拒绝撤销不存在的关联', async () => {
      await expect(permissionService.revokePermissionFromRole(role.id, permission.id))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('revokeRoleFromUser', () => {
    let user: User;
    let role: Role;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      role = await Role.create({
        name: '测试角色',
        code: 'test_role',
        level: 10,
        isActive: true,
      });
    });

    it('应该成功撤销用户角色', async () => {
      await permissionService.assignRoleToUser(user.id, role.id, 1);
      await permissionService.revokeRoleFromUser(user.id, role.id);

      const userRole = await UserRole.findOne({
        where: { userId: user.id, roleId: role.id }
      });

      expect(userRole).toBeNull();
    });

    it('应该拒绝撤销不存在的关联', async () => {
      await expect(permissionService.revokeRoleFromUser(user.id, role.id))
        .rejects.toThrow(NotFoundError);
    });
  });
});