import { Request, Response } from 'express';
import permissionService from '../services/permissionService';
import { successResponse, errorResponse, asyncHandler } from '../utils/response';
import { validationResult } from 'express-validator';

/**
 * 权限控制器
 */
export class PermissionController {
  /**
   * 创建权限
   */
  public createPermission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { name, code, description, resource, action, module } = req.body;

    try {
      const permission = await permissionService.createPermission({
        name,
        code,
        description,
        resource,
        action,
        module,
      });

      successResponse(res, permission, '权限创建成功', 201);
    } catch (error: any) {
      if (error.name === 'ConflictError') {
        errorResponse(res, error.message, 409);
      } else if (error.name === 'ValidationError') {
        errorResponse(res, error.message, 400);
      } else {
        errorResponse(res, '创建权限失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 创建角色
   */
  public createRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { name, code, description, level } = req.body;

    try {
      const role = await permissionService.createRole({
        name,
        code,
        description,
        level,
      });

      successResponse(res, role, '角色创建成功', 201);
    } catch (error: any) {
      if (error.name === 'ConflictError') {
        errorResponse(res, error.message, 409);
      } else if (error.name === 'ValidationError') {
        errorResponse(res, error.message, 400);
      } else {
        errorResponse(res, '创建角色失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 为角色分配权限
   */
  public assignPermissionToRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { roleId, permissionId } = req.body;
    const grantedBy = (req as any).user.id;

    try {
      await permissionService.assignPermissionToRole(roleId, permissionId, grantedBy);
      successResponse(res, null, '权限分配成功');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        errorResponse(res, error.message, 404);
      } else if (error.name === 'ConflictError') {
        errorResponse(res, error.message, 409);
      } else {
        errorResponse(res, '分配权限失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 为用户分配角色
   */
  public assignRoleToUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { userId, roleId, expiresAt } = req.body;
    const assignedBy = (req as any).user.id;

    try {
      await permissionService.assignRoleToUser(userId, roleId, assignedBy, expiresAt ? new Date(expiresAt) : undefined);
      successResponse(res, null, '角色分配成功');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        errorResponse(res, error.message, 404);
      } else if (error.name === 'ConflictError') {
        errorResponse(res, error.message, 409);
      } else {
        errorResponse(res, '分配角色失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 检查用户权限
   */
  public checkUserPermission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { userId, resource, action } = req.body;

    try {
      const hasPermission = await permissionService.checkUserPermission(userId, {
        resource,
        action,
        resourceId: req.body.resourceId,
      });

      successResponse(res, { hasPermission }, '权限检查完成');
    } catch (error: any) {
      errorResponse(res, '权限检查失败，请稍后重试', 500);
    }
  });

  /**
   * 获取用户权限
   */
  public getUserPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        errorResponse(res, '无效的用户ID', 400);
        return;
      }

      const permissions = await permissionService.getUserPermissions(userId);
      successResponse(res, { permissions }, '获取用户权限成功');
    } catch (error: any) {
      errorResponse(res, '获取用户权限失败，请稍后重试', 500);
    }
  });

  /**
   * 获取当前用户权限
   */
  public getCurrentUserPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const permissions = await permissionService.getUserPermissions(userId);
      successResponse(res, { permissions }, '获取用户权限成功');
    } catch (error: any) {
      errorResponse(res, '获取用户权限失败，请稍后重试', 500);
    }
  });

  /**
   * 获取用户角色
   */
  public getUserRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        errorResponse(res, '无效的用户ID', 400);
        return;
      }

      const roles = await permissionService.getUserRoles(userId);
      successResponse(res, { roles }, '获取用户角色成功');
    } catch (error: any) {
      errorResponse(res, '获取用户角色失败，请稍后重试', 500);
    }
  });

  /**
   * 获取当前用户角色
   */
  public getCurrentUserRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const roles = await permissionService.getUserRoles(userId);
      successResponse(res, { roles }, '获取用户角色成功');
    } catch (error: any) {
      errorResponse(res, '获取用户角色失败，请稍后重试', 500);
    }
  });

  /**
   * 获取角色权限
   */
  public getRolePermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) {
        errorResponse(res, '无效的角色ID', 400);
        return;
      }

      const permissions = await permissionService.getRolePermissions(roleId);
      successResponse(res, { permissions }, '获取角色权限成功');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        errorResponse(res, error.message, 404);
      } else {
        errorResponse(res, '获取角色权限失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 撤销角色权限
   */
  public revokePermissionFromRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { roleId, permissionId } = req.body;

    try {
      await permissionService.revokePermissionFromRole(roleId, permissionId);
      successResponse(res, null, '权限撤销成功');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        errorResponse(res, error.message, 404);
      } else {
        errorResponse(res, '撤销权限失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 撤销用户角色
   */
  public revokeRoleFromUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      errorResponse(res, `输入验证失败: ${errorMessages.join(', ')}`, 400);
      return;
    }

    const { userId, roleId } = req.body;

    try {
      await permissionService.revokeRoleFromUser(userId, roleId);
      successResponse(res, null, '角色撤销成功');
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        errorResponse(res, error.message, 404);
      } else {
        errorResponse(res, '撤销角色失败，请稍后重试', 500);
      }
    }
  });

  /**
   * 初始化系统权限和角色
   */
  public initializeSystemPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await permissionService.initializeSystemPermissions();
      successResponse(res, null, '系统权限初始化完成');
    } catch (error: any) {
      errorResponse(res, '系统权限初始化失败，请稍后重试', 500);
    }
  });
}

export default new PermissionController();