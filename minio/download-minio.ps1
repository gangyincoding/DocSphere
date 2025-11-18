# MinIO 下载脚本

$minioUrl = "https://dl.min.io/server/minio/release/windows-amd64/minio.exe"
$outputPath = ".\minio.exe"
$retryCount = 3

Write-Host "正在下载 MinIO..." -ForegroundColor Green
Write-Host "URL: $minioUrl"
Write-Host "目标路径: $outputPath" -ForegroundColor Yellow

for ($i = 1; $i -le $retryCount; $i++) {
    try {
        Write-Host "`n尝试 $i/$retryCount..." -ForegroundColor Yellow

        # 使用WebClient下载
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($minioUrl, $outputPath)

        # 验证文件
        if (Test-Path $outputPath) {
            $fileSize = (Get-Item $outputPath).Length
            Write-Host "✅ 下载成功！文件大小: $([math]::Round($fileSize / 1MB, 2)) MB" -ForegroundColor Green
            Write-Host "📁 文件位置: $(Resolve-Path $outputPath).Path"
            exit 0
        }
    }
    catch {
        Write-Host "❌ 下载失败: $($_.Exception.Message)" -ForegroundColor Red
        if ($i -lt $retryCount) {
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host "`n❌ 下载失败，请手动下载 MinIO:" -ForegroundColor Red
Write-Host "1. 访问: https://min.io/download" -ForegroundColor Yellow
Write-Host "2. 下载 Windows amd64 版本" -ForegroundColor Yellow
Write-Host "3. 将 minio.exe 放到当前目录: $(Get-Location)\" -ForegroundColor Yellow
exit 1
