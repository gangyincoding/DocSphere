import { User } from './User';
import { Role } from './Role';
import { Permission } from './Permission';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';
import { Folder } from './Folder';
import { File } from './File';
import { FileShare } from './FileShare';

/**
 * 定义模型之间的关联关系
 */

// 用户与角色的多对多关系
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles',
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users',
});

// 角色与权限的多对多关系
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// 用户角色关联关系
UserRole.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

UserRole.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role',
});

User.hasMany(UserRole, {
  foreignKey: 'userId',
  as: 'userRoles',
});

Role.hasMany(UserRole, {
  foreignKey: 'roleId',
  as: 'roleUsers',
});

// 角色权限关联关系
RolePermission.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role',
});

RolePermission.belongsTo(Permission, {
  foreignKey: 'permissionId',
  as: 'permission',
});

Role.hasMany(RolePermission, {
  foreignKey: 'roleId',
  as: 'rolePermissions',
});

Permission.hasMany(RolePermission, {
  foreignKey: 'permissionId',
  as: 'permissionRoles',
});

// 文件夹关联关系
Folder.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner',
});

Folder.belongsTo(Folder, {
  foreignKey: 'parentId',
  as: 'parent',
});

Folder.hasMany(Folder, {
  foreignKey: 'parentId',
  as: 'children',
});

Folder.hasMany(File, {
  foreignKey: 'folderId',
  as: 'files',
});

User.hasMany(Folder, {
  foreignKey: 'userId',
  as: 'folders',
});

// 文件关联关系
File.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner',
});

File.belongsTo(Folder, {
  foreignKey: 'folderId',
  as: 'folder',
});

File.hasMany(FileShare, {
  foreignKey: 'fileId',
  as: 'shares',
});

User.hasMany(File, {
  foreignKey: 'userId',
  as: 'files',
});

// 文件分享关联关系
FileShare.belongsTo(File, {
  foreignKey: 'fileId',
  as: 'file',
});

FileShare.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

FileShare.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

User.hasMany(FileShare, {
  foreignKey: 'userId',
  as: 'sharedFiles',
});

User.hasMany(FileShare, {
  foreignKey: 'createdBy',
  as: 'createdShares',
});

export {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Folder,
  File,
  FileShare,
};