
$payload = @{
    sessionId           = "6002bbc9-50e6-4f42-bfa9-0c86ab94e4f1"
    message             = @{
        sender    = "scammer"
        text      = "URGENT: Your SBI account has been compromised. Your account will be blocked in 2 hours. Share your account number and OTP immediately to verify your identity."
        timestamp = 1770663047110
    }
    conversationHistory = @()
    metadata            = @{
        channel  = "SMS"
        language = "English"
        locale   = "IN"
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/chat" -Method Post -Body $payload -ContentType "application/json" -ErrorAction Stop
    Write-Host "Success! Response:"
    Write-Host ($response | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "Failed!"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
