$payload = @{
    agent_type = "honeypot"
    messages = @(
        @{
            role = "user"
            content = "Congratulations! You won a lottery of $10,000. Send $500 processing fee to claim it."
        }
    )
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method Post -Body $payload -ContentType "application/json"
Write-Output $response
if ($response.is_scam -eq $true) {
    Write-Output "SUCCESS: Scam detected."
} else {
    Write-Output "FAILURE: Scam NOT detected."
}
