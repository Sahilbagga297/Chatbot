$payload = @{
    agent_type = "honeypot"
    messages = @(
        @{
            role = "user"
            content = "Congratulations! You won a lottery of $10,000. Send $500 processing fee to claim it."
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method Post -Body $payload -ContentType "application/json" -ErrorAction Stop
    
    if ($response.engagement_metrics) {
        Write-Host "SUCCESS: engagement_metrics found!"
        Write-Host ($response.engagement_metrics | ConvertTo-Json)
        if ($response.engagement_metrics.turn_count -gt 0) {
            Write-Host "SUCCESS: turn_count is valid."
        } else {
            Write-Host "FAILURE: turn_count is invalid."
        }
    } else {
        Write-Host "FAILURE: engagement_metrics missing in response."
        Write-Host ($response | ConvertTo-Json -Depth 5)
    }
} catch {
    Write-Host "ERROR: Request failed. $($_.Exception.Message)"
}
