# Backend SonarQube Scan Script
# Run this script after starting the docker-compose.sonarqube.yml
# Make sure to update the $token with strings generated from the SonarQube UI once it's up.

$base = "C:\Users\srira\Desktop\SkillSync-Project\backend"
$token = $env:SONAR_TOKEN
$services = @("auth-service","session-service","skill-service","user-service","mentor-service","group-service","notification-service","review-service","messaging-service")

foreach ($svc in $services) {
    Write-Host "`n========== Scanning $svc ==========" -ForegroundColor Cyan
    $fullPath = Join-Path -Path $base -ChildPath $svc
    if (Test-Path $fullPath) {
        Set-Location $fullPath
        try {
            mvn clean verify sonar:sonar "-Dsonar.token=$token" "-Dsonar.host.url=http://localhost:9000" "-Dmaven.test.failure.ignore=true"
        } catch {
            Write-Host "Failed to scan $svc" -ForegroundColor Red
        }
    } else {
        Write-Host "Directory $fullPath does not exist. Skipping." -ForegroundColor Yellow
    }
}

Set-Location $base
Write-Host "`nAll services scanned. Check http://localhost:9000" -ForegroundColor Green

