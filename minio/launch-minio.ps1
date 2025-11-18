# MinIO 服务启动脚本（后台运行）

# 配置参数
$MINIO_ROOT_USER = "minioadmin"
$MINIO_ROOT_PASSWORD = "minioadmin123"
$MINIO_DATA_DIR = ".\minio\data"
$MINIO_CONFIG_DIR = ".\minio\config"
$MINIO_PORT = "9000"
$MINIO_CONSOLE_PORT = "9001"

# 创建目录
New-Item -ItemType Directory -Path $MINIO_DATA_DIR -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Path $MINIO_CONFIG_DIR -Force -ErrorAction SilentlyContinue | Out-Null

# 设置环境变量
$env:MINIO_ROOT_USER = $MINIO_ROOT_USER
$env:MINIO_ROOT_PASSWORD = $MINIO_ROOT_PASSWORD

# 检查 MinIO 可执行文件
if (!(Test-Path ".\minio\minio.exe")) {
    Write-Host "❌ 未找到 minio.exe 文件" -ForegroundColor Red
    exit 1
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  启动 DocSphere MinIO 服务" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "API: http://localhost:$MINIO_PORT" -ForegroundColor Yellow
Write-Host "控制台: http://localhost:$MINIO_CONSOLE_PORT" -ForegroundColor Yellow
Write-Host "Root User: $MINIO_ROOT_USER" -ForegroundColor Yellow
Write-Host "====================================`n" -ForegroundColor Cyan

# 启动 MinIO（在当前进程）
cd .\minio
Start-Process -FilePath ".\minio.exe" -ArgumentList "server", ".\data", "--config-dir", ".\config", "--address", ":$MINIO_PORT", "--console-address", ":$MINIO_CONSOLE_PORT" -PassThru

Write-Host "`n✅ MinIO 服务已在后台启动" -ForegroundColor Green
Write-Host "💡 如需停止服务，请在任务管理器中结束 minio.exe 进程" -ForegroundColor Yellow
