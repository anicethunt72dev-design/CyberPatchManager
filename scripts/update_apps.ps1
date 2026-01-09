param (
    [string]$AppId
)

# Force UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $AppId) {
    Write-Output "Error: No AppId provided."
    exit 1
}

try {
    Write-Output "Starting upgrade for $AppId..."
    
    # Run winget install (upgrade)
    # --accept-source-agreements : auto accept source license
    # --accept-package-agreements : auto accept package license
    # --silent : try to be as quiet as possible (some apps still show UI)
    
    $proc = Start-Process winget -ArgumentList "upgrade", "--id", "$AppId", "--accept-source-agreements", "--accept-package-agreements", "--silent" -Wait -PassThru -NoNewWindow
    
    if ($proc.ExitCode -eq 0) {
        Write-Output "SUCCESS: Application updated successfully."
    } else {
        Write-Output "ERROR: Upgrade failed with exit code $($proc.ExitCode)."
        exit 1
    }

} catch {
    Write-Output "CRITICAL ERROR: $($_.Exception.Message)"
    exit 1
}
