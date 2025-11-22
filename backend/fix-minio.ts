/**
 * MinIO 诊断和修复脚本
 * 用于检查和修复 MinIO 配置问题
 */

import * as Minio from 'minio'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
}

const bucketName = process.env.MINIO_BUCKET || 'docsphere'
const region = process.env.MINIO_REGION || 'us-east-1'

async function testMinIOConnection() {
  console.log('🔍 MinIO 配置诊断')
  console.log('==================')
  console.log('配置信息:')
  console.log(`  - 端点: ${minioConfig.endPoint}:${minioConfig.port}`)
  console.log(`  - 使用 SSL: ${minioConfig.useSSL}`)
  console.log(`  - 访问密钥: ${minioConfig.accessKey}`)
  console.log(`  - 密钥: ${minioConfig.secretKey.substring(0, 4)}****`)
  console.log(`  - 存储桶: ${bucketName}`)
  console.log(`  - 区域: ${region}`)
  console.log('')

  // 尝试连接 MinIO
  console.log('📡 测试连接...')
  const minioClient = new Minio.Client(minioConfig)

  try {
    // 测试1: 列出所有存储桶
    console.log('✅ 测试 1: 列出所有存储桶')
    const buckets = await minioClient.listBuckets()
    console.log(`   找到 ${buckets.length} 个存储桶:`)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (创建于: ${bucket.creationDate})`)
    })
    console.log('')

    // 测试2: 检查目标存储桶是否存在
    console.log(`✅ 测试 2: 检查存储桶 "${bucketName}" 是否存在`)
    const bucketExists = await minioClient.bucketExists(bucketName)

    if (bucketExists) {
      console.log(`   ✓ 存储桶 "${bucketName}" 已存在`)
    } else {
      console.log(`   ✗ 存储桶 "${bucketName}" 不存在`)
      console.log(`   正在创建存储桶...`)

      await minioClient.makeBucket(bucketName, region)
      console.log(`   ✓ 存储桶 "${bucketName}" 创建成功`)
    }
    console.log('')

    // 测试3: 测试文件上传
    console.log('✅ 测试 3: 测试文件上传')
    const testFileName = 'test-file.txt'
    const testContent = 'This is a test file for MinIO connection.'

    await minioClient.putObject(
      bucketName,
      testFileName,
      Buffer.from(testContent),
      testContent.length,
      { 'Content-Type': 'text/plain' }
    )
    console.log(`   ✓ 测试文件上传成功: ${testFileName}`)
    console.log('')

    // 测试4: 测试文件下载
    console.log('✅ 测试 4: 测试文件下载')
    const stream = await minioClient.getObject(bucketName, testFileName)
    let downloadedContent = ''

    await new Promise<void>((resolve, reject) => {
      stream.on('data', chunk => {
        downloadedContent += chunk.toString()
      })
      stream.on('end', () => resolve())
      stream.on('error', reject)
    })

    if (downloadedContent === testContent) {
      console.log('   ✓ 文件下载成功，内容匹配')
    } else {
      console.log('   ✗ 文件内容不匹配')
    }
    console.log('')

    // 测试5: 清理测试文件
    console.log('✅ 测试 5: 清理测试文件')
    await minioClient.removeObject(bucketName, testFileName)
    console.log(`   ✓ 测试文件已删除: ${testFileName}`)
    console.log('')

    // 总结
    console.log('✅ 所有测试通过！')
    console.log('==================')
    console.log('MinIO 配置正确，可以正常使用文件上传功能。')

  } catch (error: any) {
    console.log('')
    console.log('❌ 测试失败')
    console.log('==================')
    console.error('错误信息:', error.message)

    if (error.code === 'SignatureDoesNotMatch') {
      console.log('')
      console.log('🔧 修复建议:')
      console.log('签名不匹配错误。请检查以下配置:')
      console.log('1. 检查 MinIO 服务器的访问密钥和密钥是否正确')
      console.log('2. 默认凭据: minioadmin / minioadmin')
      console.log('3. 当前配置凭据:', minioConfig.accessKey, '/', minioConfig.secretKey)
      console.log('')
      console.log('尝试修改 backend/.env 文件中的配置:')
      console.log('MINIO_ACCESS_KEY=minioadmin')
      console.log('MINIO_SECRET_KEY=minioadmin')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('')
      console.log('🔧 修复建议:')
      console.log('无法连接到 MinIO 服务器。请确保:')
      console.log(`1. MinIO 服务正在运行在 ${minioConfig.endPoint}:${minioConfig.port}`)
      console.log('2. 使用 Docker 启动 MinIO:')
      console.log('   docker run -p 9000:9000 -p 9001:9001 \\')
      console.log('     -e MINIO_ROOT_USER=minioadmin \\')
      console.log('     -e MINIO_ROOT_PASSWORD=minioadmin \\')
      console.log('     minio/minio server /data --console-address ":9001"')
    }

    console.log('')
    process.exit(1)
  }
}

// 运行测试
testMinIOConnection()
  .then(() => {
    console.log('✨ 诊断完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 诊断过程出错:', error)
    process.exit(1)
  })
