# Integration test: register a new user and verify users.json is updated
param(
    [string]$ApiUrl = "http://localhost:8000/api/users/register",
    [string]$UsersFile = "./data/users.json"
)

# Generate unique username/email
$rand = Get-Random -Minimum 10000 -Maximum 99999
$username = "testuser$rand"
$email = "testuser$rand@example.com"
$password = "P@ssw0rd$rand"

Write-Host "Registering user: $username / $email against $ApiUrl"

try {
    $body = @{ username = $username; email = $email; password = $password } | ConvertTo-Json
    $resp = Invoke-RestMethod -Method Post -Uri $ApiUrl -Body $body -ContentType 'application/json'
    Write-Host "Register response:`n" ($resp | ConvertTo-Json -Depth 5)
} catch {
    Write-Error "Register request failed: $_"
    exit 2
}

# Give backend a moment to persist
Start-Sleep -Milliseconds 300

# Read users file
$usersPath = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) -ChildPath "..\data\users.json"
$usersPath = (Resolve-Path $usersPath).ProviderPath

if (-Not (Test-Path $usersPath)) {
    Write-Error "Users file not found at $usersPath"
    exit 3
}

$content = Get-Content $usersPath -Raw | ConvertFrom-Json
$found = $content | Where-Object { $_.username -eq $username -or $_.email -eq $email }
if ($found) {
    Write-Host "SUCCESS: User persisted in users.json"
    exit 0
} else {
    Write-Error "FAIL: User not found in users.json"
    exit 4
}
