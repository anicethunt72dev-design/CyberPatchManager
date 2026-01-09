param (
    [string]$Action = "Create", # Create or Delete
    [string]$TaskName = "CyberPatchManager_AutoScan"
)

$ErrorActionPreference = "Stop"

try {
    if ($Action -eq "Delete") {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Output "Tâche planifiée supprimée avec succès."
    }
    else {
        # Check if exists
        $exists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($exists) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        }

        # Define Action: Run our scan script silently
        # We'll point to a new 'silent_scan.ps1' wrapper that logs to a file
        $scriptPath = Join-Path $PSScriptRoot "silent_scan.ps1"
        $TaskAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""

        # Define Trigger: Daily at 12:00 PM
        $trigger = New-ScheduledTaskTrigger -Daily -At 12:00pm

        # Register
        Register-ScheduledTask -Action $TaskAction -Trigger $trigger -TaskName $TaskName -Description "Scan automatique quotidien des vulnérabilités CyberPatchManager" -User "System" -RunLevel Highest

        Write-Output "Tâche planifiée créée avec succès (Scan quotidien à 12h00)."
    }
} catch {
    Write-Output "Erreur: $($_.Exception.Message)"
    exit 1
}
