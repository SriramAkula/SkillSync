# Frontend SonarQube Scan Script
# Run this script after starting the docker-compose.sonarqube.yml
# Please make sure you have sonar-scanner installed globally `npm install -g sonar-scanner`
# Ensure you update the token!

$token = "sqa_f3f86ad9b85ace7ec46fbe8b8a5b390aecab07a3"
Write-Host "`n========== Scanning skillsync-frontend ==========" -ForegroundColor Cyan
sonar-scanner.cmd "-Dsonar.token=$token"

Write-Host "`nFrontend scan triggered. Check http://localhost:9000/dashboard?id=skillsync-frontend" -ForegroundColor Green
