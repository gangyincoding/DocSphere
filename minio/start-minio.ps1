# MinIO 启动脚本

# 配置参数
$MINIO_ROOT_USER = "minioadmin"
$MINIO_ROOT_PASSWORD = "minioadmin123"
$MINIO_DATA_DIR = ".\data"
$MINIO_CONFIG_DIR = ".\config"
$MINIO_PORT = "9000"
$MINIO_CONSOLE_PORT = "9001"

# 创建目录
if (!(Test-Path $MINIO_DATA_DIR)) {
    New-Item -ItemType Directory -Path $MINIO_DATA_DIR -Force | Out-Null
    Write-Host "✅ 创建数据目录: $MINIO_DATA_DIR" -ForegroundColor Green
}

if (!(Test-Path $MINIO_CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $MINIO_CONFIG_DIR -Force | Out-Null
    Write-Host "✅ 创建配置目录: $MINIO_CONFIG_DIR" -ForegroundColor Green
}

# 设置环境变量
$env:MINIO_ROOT_USER = $MINIO_ROOT_USER
$env:MINIO_ROOT_PASSWORD = $MINIO_ROOT_PASSWORD
$env:MINIO_DATA_DIR = $MINIO_DATA_DIR
$env:MINIO_CONFIG_DIR = $MINIO_CONFIG_DIR

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "  DocSphere MinIO 启动配置" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "API端口: http://localhost:$MINIO_PORT" -ForegroundColor Yellow
Write-Host "控制台: http://localhost:$MINIO_CONSOLE_PORT" -ForegroundColor Yellow
Write-Host "Root User: $MINIO_ROOT_USER" -ForegroundColor Yellow
Write-Host "Root Password: $MINIO_ROOT_PASSWORD" -ForegroundColor Yellow
Write-Host "数据目录: $MINIO_DATA_DIR" -ForegroundColor Yellow
Write-Host "====================================`n" -ForegroundColor Cyan

# 启动 MinIO
Write-Host "正在启动 MinIO 服务..." -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务`n" -ForegroundColor Yellow

.\minio.exe server $MINIO_DATA_DIR `
    --config-dir $MINIO_CONFIG_DIR `
    --address :$MINIO_PORT `
    --console-address :$MINIO_CONSOLE_PORT

# 如果脚本执行到这里，说明MinIO已停止
Write-Host "`n⚠️  MinIO 服务已停止" -ForegroundColor Yellow
