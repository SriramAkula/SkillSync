$base = "C:\Users\srira\Desktop\grafana + all"
$token = "sqa_1edaaa4805d6b2f3447a0845bdb55fd59306398a"
$services = @("auth-service","session-service","skill-service","user-service","mentor-service","group-service","notification-service","review-service")

foreach ($svc in $services) {
    Write-Host "`n========== $svc ==========" -ForegroundColor Cyan
    Set-Location "$base\$svc"
    mvn verify
    mvn sonar:sonar `-Dsonar.token=$token `-Dsonar.host.url=http://localhost:9000
}

Write-Host "`nAll services scanned. Check http://localhost:9000" -ForegroundColor Green
