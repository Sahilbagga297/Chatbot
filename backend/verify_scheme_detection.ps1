$payload = @{
    messages = @(
        @{
            role = "user"
            content = "i have a scheme for you .. send me 10000 and i will give you 30000 in 10 days"
        }
    )
} | ConvertTo-Json -Depth 5

try {
    Write-Host "Sending request to http://localhost:5000/api/chat..."
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method Post -Body $payload -ContentType "application/json"
    Write-Output "--- Response ---"
    Write-Output ($response | ConvertTo-Json -Depth 10)
    
    if ($response.is_scam -eq $true -and $response.recommended_agent_mode -eq "honeypot") {
        Write-Host "`nSUCCESS: Scheme detected and honeypot mode recommended!" -ForegroundColor Green
    } else {
        Write-Host "`nFAILURE: Detection failed or honeypot mode not recommended." -ForegroundColor Red
    }
} catch {
    Write-Host "`nERROR: Request failed. $($_.Exception.Message)" -ForegroundColor Red
}
