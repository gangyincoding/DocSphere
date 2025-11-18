#!/bin/bash
# DocSphere MinIO Docker 启动脚本

echo "🚀 启动 DocSphere MinIO 服务..."
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查是否存在 minio/data 目录
if [ ! -d "./minio/data" ]; then
    echo "📁 创建 MinIO 数据目录..."
    mkdir -p minio/data
fi

echo "🐳 启动 MinIO 容器..."
echo "API: http://localhost:9000"
echo "Console: http://localhost:9001"
echo "用户名: minioadmin"
echo "密码: minioadmin123"
echo ""

# 启动 MinIO
docker run -d \
  --name docsphere-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v "$(pwd)/minio/data:/data" \
  minio/minio server /data --console-address ":9001"

echo ""
echo "✅ MinIO 服务启动成功！"
echo "📋 使用 'docker stop docsphere-minio' 停止服务"
echo "📋 使用 'docker rm docsphere-minio' 删除容器"
