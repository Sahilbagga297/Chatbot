
Write-Host "--- Test 1: Valid Request ---"
$payload = @{
    agent_type = "honeypot"
    messages   = @(
        @{ role = "user"; content = "hello" }
    )
} | ConvertTo-Json -Depth 5
try {
    $r1 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method Post -Body $payload -ContentType "application/json" -ErrorAction Stop
    Write-Host "Result: Success"
}
catch {
    Write-Host "Result: Failed $($_.Exception.Message)"
    $_.Exception.Response.StatusCode
}

Write-Host "`n--- Test 2: Missing Messages ---"
$badPayload = @{
    agent_type = "honeypot"
    # No messages
} | ConvertTo-Json
try {
    $r2 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method Post -Body $badPayload -ContentType "application/json" -ErrorAction Stop
    Write-Host "Result: Success (Unexpected)"
}
catch {
    Write-Host "Result: Failed (Expected 400?)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}

Write-Host "`n--- Test 3: Invalid JSON (Manual Curl Simulation) ---"
# PowerShell is hard to send invalid JSON with Invoke-RestMethod easily without parsing errors locally, skipping complex invalid JSON test.
# But we can test empty body with Content-Type json
try {
    $r3 = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method Post -Body "" -ContentType "application/json" -ErrorAction Stop
    Write-Host "Result: Success (Unexpected)"
}
catch {
    Write-Host "Result: Failed (Expected 400)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
