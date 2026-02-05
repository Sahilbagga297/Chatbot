$payload = @{
    agent_type = "honeypot"
    messages = @(
        @{
            role = "user"
            content = "I will transfer to SBI Bank. Account number is 112233445566. IFSC code is SBIN0004567. you can call me on 9876543210 for confirmation."
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method Post -Body $payload -ContentType "application/json" -ErrorAction Stop
    $intel = $response.extracted_intelligence
    
    Write-Output "Extracted Intelligence:"
    Write-Output $intel

    $passed = $true
    if ($intel.bank_names -notcontains "SBI Bank" -and $intel.bank_names -notcontains "SBI") { Write-Output "FAILED: Bank Name"; $passed = $false }
    if ($intel.bank_accounts -notcontains "112233445566") { Write-Output "FAILED: Account"; $passed = $false }
    if ($intel.ifsc_codes -notcontains "SBIN0004567") { Write-Output "FAILED: IFSC"; $passed = $false }
    if ($intel.phone_numbers -notcontains "9876543210") { Write-Output "FAILED: Phone"; $passed = $false }

    if ($passed) {
        Write-Output "SUCCESS: All fields extracted."
    }
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
