@echo off
echo.
echo 🚀 启动 DocSphere MinIO 服务...
echo.

REM 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

REM 检查是否存在 minio\data 目录
if not exist "minio\data" (
    echo 📁 创建 MinIO 数据目录...
    mkdir minio\data
)

echo 🐳 启动 MinIO 容器...
echo API: http://localhost:9000
echo Console: http://localhost:9001
echo 用户名: minioadmin
echo 密码: minioadmin123
echo.

REM 停止并删除现有容器
docker stop docsphere-minio >nul 2>&1
docker rm docsphere-minio >nul 2>&1

REM 启动 MinIO
docker run -d ^
  --name docsphere-minio ^
  -p 9000:9000 ^
  -p 9001:9001 ^
  -e MINIO_ROOT_USER=minioadmin ^
  -e MINIO_ROOT_PASSWORD=minioadmin123 ^
  -v "%cd%\minio\data:/data" ^
  minio/minio server /data --console-address ":9001"

if %errorlevel% equ 0 (
    echo.
    echo ✅ MinIO 服务启动成功！
    echo 📋 使用 'docker stop docsphere-minio' 停止服务
    echo 📋 使用 'docker rm docsphere-minio' 删除容器
    echo.
) else (
    echo.
    echo ❌ MinIO 启动失败，请检查 Docker 是否正确配置
    echo.
)

pause
