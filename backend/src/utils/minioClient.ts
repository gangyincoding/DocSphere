import { Client } from 'minio';
import config from '../config';
import { logger } from './logger';

// 创建 MinIO 客户端实例
const minioClient = new Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

/**
 * MinIO 存储工具类
 */
export class MinioStorage {
  private bucket: string;

  constructor(bucket?: string) {
    this.bucket = bucket || config.minio.bucket;
  }

  /**
   * 初始化 MinIO 存储桶（创建如果不存在）
   */
  public async initializeBucket(): Promise<void> {
    try {
      // 检查存储桶是否存在
      const exists = await minioClient.bucketExists(this.bucket);

      if (!exists) {
        logger.info(`创建存储桶: ${this.bucket}`);
        await minioClient.makeBucket(this.bucket, config.minio.region);

        // 设置存储桶策略为私有（默认）
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Deny',
              Principal: { AWS: ['*'] },
              Action: ['s3:*'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };

        await minioClient.setBucketPolicy(
          this.bucket,
          JSON.stringify(policy)
        );

        logger.info(`存储桶创建成功: ${this.bucket}`);
      } else {
        logger.info(`存储桶已存在: ${this.bucket}`);
      }
    } catch (error) {
      logger.error('初始化存储桶失败:', error);
      throw error;
    }
  }

  /**
   * 上传文件
   */
  public async uploadFile(
    objectName: string,
    buffer: Buffer,
    metaData?: { [key: string]: string }
  ): Promise<string> {
    try {
      const result = await minioClient.putObject(
        this.bucket,
        objectName,
        buffer,
        buffer.length,
        metaData
      );

      const etag = typeof result === 'string' ? result : result.etag;
      logger.info(`文件上传成功: ${objectName}, ETag: ${etag}`);
      return etag;
    } catch (error) {
      logger.error(`文件上传失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 下载文件
   */
  public async downloadFile(objectName: string): Promise<Buffer> {
    try {
      const stream = await minioClient.getObject(this.bucket, objectName);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          logger.info(`文件下载成功: ${objectName}`);
          resolve(Buffer.concat(chunks));
        });
        stream.on('error', (err) => {
          logger.error(`文件下载失败: ${objectName}`, err);
          reject(err);
        });
      });
    } catch (error) {
      logger.error(`文件下载失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 获取文件流（用于流式下载）
   */
  public async getFileStream(objectName: string): Promise<NodeJS.ReadableStream> {
    try {
      const stream = await minioClient.getObject(this.bucket, objectName);
      logger.info(`获取文件流成功: ${objectName}`);
      return stream;
    } catch (error) {
      logger.error(`获取文件流失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  public async deleteFile(objectName: string): Promise<void> {
    try {
      await minioClient.removeObject(this.bucket, objectName);
      logger.info(`文件删除成功: ${objectName}`);
    } catch (error) {
      logger.error(`文件删除失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 复制文件
   */
  public async copyFile(
    sourceObject: string,
    destObject: string
  ): Promise<string> {
    try {
      const result = await minioClient.copyObject(
        this.bucket,
        destObject,
        `/${this.bucket}/${sourceObject}`,
        null as any
      );
      const etag = typeof result === 'string' ? result : (result as any).etag || '';
      logger.info(`文件复制成功: ${sourceObject} -> ${destObject}`);
      return etag;
    } catch (error) {
      logger.error('文件复制失败:', error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   */
  public async fileExists(objectName: string): Promise<boolean> {
    try {
      await minioClient.statObject(this.bucket, objectName);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 获取文件信息
   */
  public async getFileInfo(objectName: string): Promise<any> {
    try {
      const stats = await minioClient.statObject(this.bucket, objectName);
      return stats;
    } catch (error) {
      logger.error(`获取文件信息失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 生成预签名URL（用于临时访问）
   */
  public async getPresignedUrl(
    objectName: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(
        this.bucket,
        objectName,
        expirySeconds
      );
      return url;
    } catch (error) {
      logger.error(`生成预签名URL失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 生成预签名PUT URL（用于直接上传）
   */
  public async getPresignedPutUrl(
    objectName: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    try {
      const url = await minioClient.presignedPutObject(
        this.bucket,
        objectName,
        expirySeconds
      );
      return url;
    } catch (error) {
      logger.error(`生成预签名PUT URL失败: ${objectName}`, error);
      throw error;
    }
  }

  /**
   * 列出文件
   */
  public async listFiles(prefix?: string, maxKeys?: number): Promise<any[]> {
    try {
      const objectsList: any[] = [];
      const stream = minioClient.listObjects(this.bucket, prefix, false);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => objectsList.push(obj));
        stream.on('end', () => {
          logger.info(`列出文件完成: ${objectsList.length} 个文件`);
          resolve(objectsList);
        });
        stream.on('error', (err) => {
          logger.error('列出文件失败', err);
          reject(err);
        });
      });
    } catch (error) {
      logger.error('列出文件失败', error);
      throw error;
    }
  }
}

export { minioClient };
export default new MinioStorage();
