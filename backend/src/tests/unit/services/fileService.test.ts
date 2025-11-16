import fileService from '../../../services/fileService';
import { File, Folder, User, FileShare } from '../../../models/associations';
import { sequelize } from '../../../config/database';
import { ValidationError, NotFoundError, ConflictError, DatabaseError } from '../../../utils/errors';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileService', () => {
  let user: User;
  let testFilePath: string;

  beforeAll(async () => {
    await sequelize.authenticate();

    // 创建测试目录
    testFilePath = path.join(__dirname, '../../../test-uploads');
    await fs.mkdir(testFilePath, { recursive: true });
  });

  afterAll(async () => {
    await sequelize.close();

    // 清理测试目录
    try {
      await fs.rm(testFilePath, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
  });

  describe('uploadFile', () => {
    const fileBuffer = Buffer.from('test file content');
    const fileData = {
      originalName: 'test.txt',
      buffer: fileBuffer,
      size: fileBuffer.length,
      mimeType: 'text/plain',
    };

    it('应该成功上传文件', async () => {
      const file = await fileService.uploadFile(user.id, fileData);

      expect(file.id).toBeDefined();
      expect(file.originalName).toBe(fileData.originalName);
      expect(file.size).toBe(fileData.size);
      expect(file.mimeType).toBe(fileData.mimeType);
      expect(file.extension).toBe('txt');
      expect(file.userId).toBe(user.id);
      expect(file.isPublic).toBe(false);
      expect(file.checksum).toBeDefined();
      expect(file.downloadCount).toBe(0);
    });

    it('应该为公开文件设置正确的标志', async () => {
      const publicFileData = { ...fileData, isPublic: true };
      const file = await fileService.uploadFile(user.id, publicFileData);

      expect(file.isPublic).toBe(true);
    });

    it('应该支持添加标签', async () => {
      const taggedFileData = {
        ...fileData,
        tags: ['document', 'test', 'important']
      };
      const file = await fileService.uploadFile(user.id, taggedFileData);

      expect(file.tags).toBe('document,test,important');
    });

    it('应该支持上传到指定文件夹', async () => {
      const folder = await Folder.create({
        name: 'Test Folder',
        path: '/Test Folder',
        level: 0,
        isPublic: false,
        userId: user.id,
      });

      const fileDataWithFolder = { ...fileData, folderId: folder.id };
      const file = await fileService.uploadFile(user.id, fileDataWithFolder);

      expect(file.folderId).toBe(folder.id);
    });

    it('应该拒绝上传到不存在的文件夹', async () => {
      const fileDataWithInvalidFolder = { ...fileData, folderId: 9999 };

      await expect(fileService.uploadFile(user.id, fileDataWithInvalidFolder))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝上传到无权限的文件夹', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const privateFolder = await Folder.create({
        name: 'Private Folder',
        path: '/Private Folder',
        level: 0,
        isPublic: false,
        userId: otherUser.id,
      });

      const fileDataWithPrivateFolder = { ...fileData, folderId: privateFolder.id };

      await expect(fileService.uploadFile(user.id, fileDataWithPrivateFolder))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝上传过大的文件', async () => {
      const largeFileData = {
        ...fileData,
        size: 200 * 1024 * 1024, // 200MB，超过100MB限制
      };

      await expect(fileService.uploadFile(user.id, largeFileData))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝上传重复文件', async () => {
      await fileService.uploadFile(user.id, fileData);

      await expect(fileService.uploadFile(user.id, fileData))
        .rejects.toThrow(ConflictError);
    });

    it('应该拒绝不存在的用户', async () => {
      await expect(fileService.uploadFile(9999, fileData))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('downloadFile', () => {
    let file: File;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileData = {
        originalName: 'test.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
      };

      file = await fileService.uploadFile(user.id, fileData);
    });

    it('应该成功下载文件', async () => {
      const result = await fileService.downloadFile(file.id, user.id);

      expect(result.file.id).toBe(file.id);
      expect(result.path).toBeDefined();
      expect(result.file.downloadCount).toBe(1); // 应该增加下载计数
    });

    it('应该拒绝下载不存在的文件', async () => {
      await expect(fileService.downloadFile(9999, user.id))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝下载已删除的文件', async () => {
      await file.softDelete(user.id);

      await expect(fileService.downloadFile(file.id, user.id))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝无权访问私有文件', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      await expect(fileService.downloadFile(file.id, otherUser.id))
        .rejects.toThrow(ValidationError);
    });

    it('应该允许访问公开文件', async () => {
      await file.update({ isPublic: true });

      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const result = await fileService.downloadFile(file.id, otherUser.id);
      expect(result.file.id).toBe(file.id);
    });
  });

  describe('createFolder', () => {
    const folderData = {
      name: 'Test Folder',
      description: 'A test folder',
    };

    it('应该成功创建根文件夹', async () => {
      const folder = await fileService.createFolder(user.id, folderData);

      expect(folder.id).toBeDefined();
      expect(folder.name).toBe(folderData.name);
      expect(folder.description).toBe(folderData.description);
      expect(folder.path).toBe('/Test Folder');
      expect(folder.level).toBe(0);
      expect(folder.userId).toBe(user.id);
      expect(folder.isPublic).toBe(false);
      expect(folder.parentId).toBeNull();
    });

    it('应该成功创建子文件夹', async () => {
      const parentFolder = await fileService.createFolder(user.id, {
        name: 'Parent Folder',
      });

      const childFolderData = {
        ...folderData,
        name: 'Child Folder',
        parentId: parentFolder.id,
      };

      const childFolder = await fileService.createFolder(user.id, childFolderData);

      expect(childFolder.parentId).toBe(parentFolder.id);
      expect(childFolder.level).toBe(1);
      expect(childFolder.path).toBe('/Parent Folder/Child Folder');
    });

    it('应该拒绝重复的文件夹名称', async () => {
      await fileService.createFolder(user.id, folderData);

      await expect(fileService.createFolder(user.id, folderData))
        .rejects.toThrow(ConflictError);
    });

    it('应该拒绝在不存在的父文件夹中创建文件夹', async () => {
      const folderDataWithInvalidParent = {
        ...folderData,
        parentId: 9999,
      };

      await expect(fileService.createFolder(user.id, folderDataWithInvalidParent))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝在无权限的父文件夹中创建文件夹', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const privateFolder = await Folder.create({
        name: 'Private Folder',
        path: '/Private Folder',
        level: 0,
        isPublic: false,
        userId: otherUser.id,
      });

      const folderDataWithPrivateParent = {
        ...folderData,
        parentId: privateFolder.id,
      };

      await expect(fileService.createFolder(user.id, folderDataWithPrivateParent))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteFile', () => {
    let file: File;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileData = {
        originalName: 'test.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
      };

      file = await fileService.uploadFile(user.id, fileData);
    });

    it('应该成功删除文件', async () => {
      await fileService.deleteFile(file.id, user.id);

      const deletedFile = await File.findByPk(file.id);
      expect(deletedFile!.isDeleted).toBe(true);
      expect(deletedFile!.deletedBy).toBe(user.id);
      expect(deletedFile!.deletedAt).toBeDefined();
    });

    it('应该删除相关的分享记录', async () => {
      // 创建一些分享记录
      await FileShare.create({
        fileId: file.id,
        userId: user.id,
        shareType: 'link',
        shareCode: 'test-share-code',
        createdBy: user.id,
        isActive: true,
      });

      await fileService.deleteFile(file.id, user.id);

      const shares = await FileShare.findAll({
        where: { fileId: file.id },
      });
      expect(shares).toHaveLength(0);
    });

    it('应该拒绝删除不存在的文件', async () => {
      await expect(fileService.deleteFile(9999, user.id))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝删除其他用户的文件', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const fileBuffer = Buffer.from('other file content');
      const fileData = {
        originalName: 'other.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
      };

      const otherFile = await fileService.uploadFile(otherUser.id, fileData);

      await expect(fileService.deleteFile(otherFile.id, user.id))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getFiles', () => {
    beforeEach(async () => {
      // 创建一些测试文件
      for (let i = 0; i < 5; i++) {
        const fileBuffer = Buffer.from(`test file ${i} content`);
        await fileService.uploadFile(user.id, {
          originalName: `test${i}.txt`,
          buffer: fileBuffer,
          size: fileBuffer.length,
          mimeType: 'text/plain',
        });
      }
    });

    it('应该返回文件列表', async () => {
      const result = await fileService.getFiles({});

      expect(result.files).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    it('应该支持分页', async () => {
      const result = await fileService.getFiles({
        page: 1,
        pageSize: 2,
      });

      expect(result.files).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('应该支持搜索', async () => {
      const result = await fileService.getFiles({
        search: 'test0',
      });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].originalName).toContain('test0');
    });

    it('应该支持按文件类型过滤', async () => {
      // 上传不同类型的文件
      const imageBuffer = Buffer.from('fake image content');
      await fileService.uploadFile(user.id, {
        originalName: 'test.jpg',
        buffer: imageBuffer,
        size: imageBuffer.length,
        mimeType: 'image/jpeg',
      });

      const result = await fileService.getFiles({
        mimeType: 'image',
      });

      expect(result.files.some(file => file.mimeType.includes('image'))).toBe(true);
    });

    it('应该支持按文件夹过滤', async () => {
      const folder = await fileService.createFolder(user.id, {
        name: 'Test Folder',
      });

      const fileBuffer = Buffer.from('file in folder');
      const file = await fileService.uploadFile(user.id, {
        originalName: 'folder-file.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
        folderId: folder.id,
      });

      const result = await fileService.getFiles({
        folderId: folder.id,
      });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].id).toBe(file.id);
    });

    it('应该支持按公开状态过滤', async () => {
      // 创建一个公开文件
      const publicFileBuffer = Buffer.from('public file content');
      await fileService.uploadFile(user.id, {
        originalName: 'public.txt',
        buffer: publicFileBuffer,
        size: publicFileBuffer.length,
        mimeType: 'text/plain',
        isPublic: true,
      });

      const result = await fileService.getFiles({
        isPublic: true,
      });

      expect(result.files.every(file => file.isPublic)).toBe(true);
    });
  });

  describe('getFile', () => {
    let file: File;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileData = {
        originalName: 'test.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
      };

      file = await fileService.uploadFile(user.id, fileData);
    });

    it('应该返回文件详情', async () => {
      const result = await fileService.getFile(file.id, user.id);

      expect(result.id).toBe(file.id);
      expect(result.originalName).toBe(file.originalName);
      expect(result.size).toBe(file.size);
      expect(result.userId).toBe(user.id);
    });

    it('应该返回关联的用户信息', async () => {
      const result = await fileService.getFile(file.id, user.id);

      expect(result.owner).toBeDefined();
      expect(result.owner.id).toBe(user.id);
      expect(result.owner.email).toBe(user.email);
    });

    it('应该拒绝访问不存在的文件', async () => {
      await expect(fileService.getFile(9999, user.id))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝访问已删除的文件', async () => {
      await file.softDelete(user.id);

      await expect(fileService.getFile(file.id, user.id))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝访问其他用户的私有文件', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      await expect(fileService.getFile(file.id, otherUser.id))
        .rejects.toThrow(ValidationError);
    });

    it('应该允许访问公开文件', async () => {
      await file.update({ isPublic: true });

      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const result = await fileService.getFile(file.id, otherUser.id);
      expect(result.id).toBe(file.id);
    });
  });

  describe('createShare', () => {
    let file: File;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileData = {
        originalName: 'test.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
      };

      file = await fileService.uploadFile(user.id, fileData);
    });

    it('应该创建链接分享', async () => {
      const shareData = {
        fileId: file.id,
        shareType: 'link' as const,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
        maxAccessCount: 100,
        password: 'password123',
      };

      const share = await fileService.createShare(user.id, shareData);

      expect(share.id).toBeDefined();
      expect(share.fileId).toBe(file.id);
      expect(share.shareType).toBe('link');
      expect(share.shareCode).toBeDefined();
      expect(share.expiresAt).toBeDefined();
      expect(share.maxAccessCount).toBe(100);
      expect(share.password).toBe('password123');
      expect(share.canDownload).toBe(true);
    });

    it('应该创建用户分享', async () => {
      const shareData = {
        fileId: file.id,
        shareType: 'user' as const,
      };

      const share = await fileService.createShare(user.id, shareData);

      expect(share.shareType).toBe('user');
      expect(share.shareCode).toBeUndefined();
    });

    it('应该创建公开分享', async () => {
      const shareData = {
        fileId: file.id,
        shareType: 'public' as const,
      };

      const share = await fileService.createShare(user.id, shareData);

      expect(share.shareType).toBe('public');
      expect(share.shareCode).toBeUndefined();
    });

    it('应该拒绝分享不存在的文件', async () => {
      const shareData = {
        fileId: 9999,
        shareType: 'link' as const,
      };

      await expect(fileService.createShare(user.id, shareData))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝分享其他用户的文件', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const otherFileBuffer = Buffer.from('other file content');
      const fileData = {
        originalName: 'other.txt',
        buffer: otherFileBuffer,
        size: otherFileBuffer.length,
        mimeType: 'text/plain',
      };

      const otherFile = await fileService.uploadFile(otherUser.id, fileData);

      const shareData = {
        fileId: otherFile.id,
        shareType: 'link' as const,
      };

      await expect(fileService.createShare(user.id, shareData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getFileByShareCode', () => {
    let file: File;
    let share: FileShare;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileData = {
        originalName: 'test.txt',
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'text/plain',
      };

      file = await fileService.uploadFile(user.id, fileData);

      const shareData = {
        fileId: file.id,
        shareType: 'link' as const,
        canDownload: true,
      };

      share = await fileService.createShare(user.id, shareData);
    });

    it('应该通过分享代码访问文件', async () => {
      const result = await fileService.getFileByShareCode(share.shareCode!);

      expect(result.file.id).toBe(file.id);
      expect(result.share.id).toBe(share.id);
      expect(result.share.accessCount).toBe(1); // 应该增加访问计数
    });

    it('应该拒绝无效的分享代码', async () => {
      await expect(fileService.getFileByShareCode('invalid-code'))
        .rejects.toThrow(NotFoundError);
    });

    it('应该拒绝已过期的分享', async () => {
      await share.update({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天过期
      });

      await expect(fileService.getFileByShareCode(share.shareCode!))
        .rejects.toThrow(ValidationError);
    });

    it('应该拒绝达到访问次数限制的分享', async () => {
      await share.update({
        maxAccessCount: 1,
      });

      // 第一次访问应该成功
      await fileService.getFileByShareCode(share.shareCode!);

      // 第二次访问应该失败
      await expect(fileService.getFileByShareCode(share.shareCode!))
        .rejects.toThrow(ValidationError);
    });

    it('应该验证密码保护的分享', async () => {
      await share.update({
        password: 'share-password',
      });

      await expect(fileService.getFileByShareCode(share.shareCode!))
        .rejects.toThrow(ValidationError);

      const result = await fileService.getFileByShareCode(share.shareCode!, 'share-password');
      expect(result.file.id).toBe(file.id);
    });
  });

  describe('searchFiles', () => {
    beforeEach(async () => {
      // 创建一些测试文件
      const files = [
        {
          originalName: 'document.pdf',
          buffer: Buffer.from('pdf content'),
          mimeType: 'application/pdf',
          tags: ['document', 'important'],
        },
        {
          originalName: 'image.jpg',
          buffer: Buffer.from('jpg content'),
          mimeType: 'image/jpeg',
          tags: ['image'],
        },
        {
          originalName: 'text.txt',
          buffer: Buffer.from('text content'),
          mimeType: 'text/plain',
          tags: ['document'],
        },
      ];

      for (const fileData of files) {
        await fileService.uploadFile(user.id, fileData);
      }
    });

    it('应该搜索文件名', async () => {
      const results = await fileService.searchFiles(user.id, 'document');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(file => file.originalName.includes('document'))).toBe(true);
    });

    it('应该搜索标签', async () => {
      const results = await fileService.searchFiles(user.id, 'image', {
        tags: ['image'],
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(file => file.tags?.includes('image'))).toBe(true);
    });

    it('应该包含公开文件', async () => {
      // 创建一个公开文件
      const publicFileBuffer = Buffer.from('public content');
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      await fileService.uploadFile(otherUser.id, {
        originalName: 'public.txt',
        buffer: publicFileBuffer,
        size: publicFileBuffer.length,
        mimeType: 'text/plain',
        isPublic: true,
      });

      const results = await fileService.searchFiles(user.id, 'public', {
        includePublic: true,
      });

      expect(results.some(file => file.isPublic)).toBe(true);
    });

    it('应该支持按文件类型过滤', async () => {
      const results = await fileService.searchFiles(user.id, 'document', {
        mimeType: 'application',
      });

      expect(results.some(file => file.mimeType.includes('application'))).toBe(true);
    });

    it('应该限制搜索结果数量', async () => {
      const results = await fileService.searchFiles(user.id, '');

      expect(results.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getFileStats', () => {
    beforeEach(async () => {
      // 创建不同类型的测试文件
      const files = [
        {
          originalName: 'text1.txt',
          buffer: Buffer.from('text content 1'),
          mimeType: 'text/plain',
        },
        {
          originalName: 'text2.txt',
          buffer: Buffer.from('text content 2'),
          mimeType: 'text/plain',
        },
        {
          originalName: 'image.jpg',
          buffer: Buffer.from('jpg content'),
          mimeType: 'image/jpeg',
        },
      ];

      for (const fileData of files) {
        await fileService.uploadFile(user.id, fileData);
      }
    });

    it('应该返回文件统计信息', async () => {
      const stats = await fileService.getFileStats(user.id);

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.fileTypes).toBeDefined();
      expect(stats.fileTypes['text']).toBeGreaterThan(0);
      expect(stats.fileTypes['image']).toBeGreaterThan(0);
      expect(stats.recentUploads).toHaveLength(3);
    });

    it('应该只计算指定用户的文件', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      const otherFileBuffer = Buffer.from('other file content');
      await fileService.uploadFile(otherUser.id, {
        originalName: 'other.txt',
        buffer: otherFileBuffer,
        size: otherFileBuffer.length,
        mimeType: 'text/plain',
      });

      const stats = await fileService.getFileStats(user.id);
      expect(stats.totalFiles).toBe(3); // 只有当前用户的文件
    });
  });
});