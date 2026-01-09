param (
    [string]$Action
)

$ErrorActionPreference = "Stop"

function Restart-WindowsUpdate {
    Write-Output "Restarting Windows Update Service..."
    Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
    Stop-Service -Name bits -Force -ErrorAction SilentlyContinue
    Stop-Service -Name cryptsvc -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    
    Start-Service -Name wuauserv
    Start-Service -Name bits
    Start-Service -Name cryptsvc
    return "Services Windows Update redémarrés avec succès."
}

function Clear-UpdateCache {
    Write-Output "Clearing Windows Update Cache (SoftwareDistribution)..."
    Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
    Stop-Service -Name bits -Force -ErrorAction SilentlyContinue
    
    $path = "$env:systemroot\SoftwareDistribution"
    if (Test-Path $path) {
        Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Start-Service -Name wuauserv
    Start-Service -Name bits
    return "Cache de mise à jour vidé."
}

function Reset-Network {
    Write-Output "Resetting Network Stack..."
    ipconfig /flushdns
    netsh winsock reset
    return "Pile réseau réinitialisée (DNS/Winsock)."
}

try {
    switch ($Action) {
        "restart_services" { $msg = Restart-WindowsUpdate }
        "clear_cache" { $msg = Clear-UpdateCache }
        "reset_network" { $msg = Reset-Network }
        default { throw "Action inconnue: $Action" }
    }
    
    Write-Output $msg
} catch {
    Write-Error "Erreur Auto-Heal: $($_.Exception.Message)"
    exit 1
}
