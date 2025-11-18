@echo off
echo Starting DocSphere MinIO Service...
echo.

set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin123

echo MinIO API: http://localhost:9000
echo MinIO Console: http://localhost:9001
echo Root User: minioadmin
echo Root Password: minioadmin123
echo.
echo Press Ctrl+C to stop the service
echo.

cd /d "%~dp0"
.\minio.exe server .\data --config-dir .\config --address :9000 --console-address :9001
