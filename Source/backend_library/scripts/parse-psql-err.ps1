param(
  [string]$LogFile = "psql_err.log"
)

if (-not (Test-Path $LogFile)) {
  Write-Host "Không tìm thấy file: $LogFile" -ForegroundColor Red
  exit 1
}

$content = Get-Content $LogFile -Raw
Write-Host "--- Tóm tắt lỗi psql (đầu 2000 ký tự) ---" -ForegroundColor Yellow
Write-Host $content.Substring(0, [Math]::Min(2000, $content.Length))
Write-Host "\n--- Toàn bộ log ---" -ForegroundColor Yellow
Write-Host $content

Write-Host "\nGợi ý debug:" -ForegroundColor Cyan
Write-Host " - Kiểm tra encoding của file SQL (nên dùng UTF-8)" -ForegroundColor Cyan
Write-Host " - Thử chạy lệnh psql với --set=ON_ERROR_STOP để thấy lỗi dừng sớm" -ForegroundColor Cyan
Write-Host " - Nếu lỗi liên quan tới ENUM, kiểm tra SQL migration để đảm bảo ALTER TYPE xử lý đúng." -ForegroundColor Cyan

exit 0
