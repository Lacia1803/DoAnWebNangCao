<#
Script: run-migration-and-seed.ps1
Mục đích: Chạy migration và seed cho project trên Windows PowerShell, đảm bảo encoding UTF-8

Sử dụng:
  - Mở PowerShell với quyền phù hợp
  - cd vào thư mục Source/backend_library
  - .\run-migration-and-seed.ps1

Tùy chọn:
  -Bạn có thể truyền tham số: -DBUser, -DBName, -DBPassword
#>

param(
    [string]$DBUser = "postgres",
    [string]$DBName = "librarydb",
    [string]$DBPassword = ""
)

Write-Host "=== Chạy Migration và Seed (UTF-8 safe) ===" -ForegroundColor Green

# Đọc .env nếu tồn tại
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Đọc thông tin DB từ .env..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^DB_USER=(.+)$') { $DBUser = $matches[1].Trim('"').Trim("'") }
        if ($_ -match '^DB_NAME=(.+)$') { $DBName = $matches[1].Trim('"').Trim("'") }
        if ($_ -match '^DB_PASSWORD=(.+)$') { $DBPassword = $matches[1].Trim('"').Trim("'") }
    }
}

# Nếu chưa có password, hỏi user (an toàn)
if ([string]::IsNullOrEmpty($DBPassword)) {
    $secure = Read-Host "Nhập PostgreSQL password cho user '$DBUser' (nhập rỗng để bỏ qua)" -AsSecureString
    $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

Write-Host "User: $DBUser" -ForegroundColor Cyan
Write-Host "Database: $DBName" -ForegroundColor Cyan

# Kiểm tra psql
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ Không tìm thấy psql. Vui lòng cài PostgreSQL hoặc thêm psql vào PATH." -ForegroundColor Red
    Write-Host "   https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Chuyển mã trang console sang UTF-8 để tránh lỗi khi hiển thị và nhập liệu
Write-Host "Chuyển mã trang console sang UTF-8 (chcp 65001)" -ForegroundColor Yellow
chcp 65001 | Out-Null

# Thiết lập biến môi trường cho psql
if (-not [string]::IsNullOrEmpty($DBPassword)) { $env:PGPASSWORD = $DBPassword }

# Helper: chạy 1 file SQL với --set=ON_ERROR_STOP để dừng khi có lỗi
function Run-SqlFile([string]$filePath) {
    if (-not (Test-Path $filePath)) {
        Write-Host "❌ Không tìm thấy file SQL: $filePath" -ForegroundColor Red
        return $false
    }

    Write-Host "Đang chạy: $filePath" -ForegroundColor White
    $psqlArgs = @(
        "--set=ON_ERROR_STOP=on",
        "-U", $DBUser,
        "-d", $DBName,
        "-f", $filePath
    )

    $proc = Start-Process -FilePath psql -ArgumentList $psqlArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput "psql_out.log" -RedirectStandardError "psql_err.log"
    if ($proc.ExitCode -ne 0) {
        Write-Host "❌ psql trả về mã lỗi: $($proc.ExitCode)" -ForegroundColor Red
        Write-Host "Xem nội dung psql_err.log để biết chi tiết." -ForegroundColor Yellow
        Get-Content "psql_err.log" -Raw | Write-Host
        return $false
    }

    Write-Host "✅ Hoàn thành: $filePath" -ForegroundColor Green
    return $true
}

# Danh sách file cần chạy
$base = $PSScriptRoot
$migration = Join-Path $base "..\..\migrations\add_booktype_favorites.sql"
$seed1 = Join-Path $base "seeds\sample-books-online.sql"
$seed2 = Join-Path $base "seeds\update-book-content.sql"

# Thực thi migration
if (-not (Run-SqlFile $migration)) {
    Write-Host "Migration thất bại. Dừng script." -ForegroundColor Red
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Thực thi seed (không bắt buộc nếu bạn muốn seed thủ công)
if (-not (Run-SqlFile $seed1)) {
    Write-Host "Seed sample-books-online thất bại. Dừng script." -ForegroundColor Red
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

if (-not (Run-SqlFile $seed2)) {
    Write-Host "Seed update-book-content thất bại. Dừng script." -ForegroundColor Red
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Write-Host "\n🎉 Migration và seed hoàn tất thành công!" -ForegroundColor Green
Write-Host "Kiểm tra bảng Books, Users, Favorites và file content đã được gán." -ForegroundColor Cyan
Write-Host "Bạn có thể mở pgAdmin hoặc chạy truy vấn kiểm tra." -ForegroundColor Cyan

# Thực thi sync models (tạo bảng Setting và các thay đổi model nếu có)
try {
    Write-Host "\nĐang chạy node sync.js để đồng bộ models (tạo bảng Setting)..." -ForegroundColor Yellow
    node sync.js
    Write-Host "Đã chạy sync.js" -ForegroundColor Green
} catch {
    Write-Host "Không thể chạy sync.js tự động. Bạn có thể chạy: node sync.js" -ForegroundColor Yellow
}

exit 0
