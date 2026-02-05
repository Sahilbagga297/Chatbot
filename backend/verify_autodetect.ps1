$payload = @{
    messages = @(
        @{
            role = "user"
            content = "Congratulations! You won a lottery of 5 crore. Claim now."
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method Post -Body $payload -ContentType "application/json"
    Write-Output $response
    
    # Check if the response structure matches honeypot (has agent_stage or extracted_intelligence)
    if ($response.agent_stage -or $response.is_scam) {
        Write-Output "SUCCESS: Auto-detection worked. Got Honeypot response."
    } else {
        Write-Output "FAILURE: Auto-detection failed. Got standard response."
    }
} catch {
    Write-Output "ERROR: Request failed. $($_.Exception.Message)"
}
