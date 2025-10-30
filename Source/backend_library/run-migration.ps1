# Script: Chạy migration database
# Đọc password từ .env hoặc nhập thủ công

param(
    [string]$DBUser = "postgres",
    [string]$DBName = "librarydb",
    [string]$DBPassword = ""
)

Write-Host "=== Database Migration Script ===" -ForegroundColor Green
Write-Host ""

# Đọc password từ .env nếu có
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Đọc thông tin từ .env..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^DB_PASSWORD=(.+)$') {
            $DBPassword = $matches[1].Trim('"').Trim("'")
        }
        if ($_ -match '^DB_USER=(.+)$') {
            $DBUser = $matches[1].Trim('"').Trim("'")
        }
        if ($_ -match '^DB_NAME=(.+)$') {
            $DBName = $matches[1].Trim('"').Trim("'")
        }
    }
}

# Nếu vẫn chưa có password, hỏi user
if ([string]::IsNullOrEmpty($DBPassword)) {
    $DBPassword = Read-Host "Nhập PostgreSQL password cho user '$DBUser'" -AsSecureString
    $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DBPassword))
}

Write-Host "User: $DBUser" -ForegroundColor Cyan
Write-Host "Database: $DBName" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra psql có sẵn không
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ Không tìm thấy psql. Vui lòng cài PostgreSQL hoặc thêm vào PATH." -ForegroundColor Red
    Write-Host "   Tải tại: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Chạy migration
$migrationFile = Join-Path $PSScriptRoot "..\..\migrations\add_booktype_favorites.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Không tìm thấy file migration: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Đang chạy migration..." -ForegroundColor Yellow
$env:PGPASSWORD = $DBPassword

try {
    psql -U $DBUser -d $DBName -f $migrationFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration hoàn tất!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Các thay đổi:" -ForegroundColor Cyan
        Write-Host "  - Thêm role 'vip' vào Users" -ForegroundColor White
        Write-Host "  - Thêm cột 'bookType' (physical/online) vào Books" -ForegroundColor White
        Write-Host "  - Thêm cột 'contentFile' vào Books" -ForegroundColor White
        Write-Host "  - Tạo bảng 'Favorites'" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Migration thất bại. Kiểm tra lỗi ở trên." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
