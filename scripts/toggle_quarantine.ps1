param (
    [string]$Action = "Block" # "Block" ou "Unblock"
)

# Vérification Admin
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Output '{"error": "Admin rights required"}'
    exit
}

try {
    if ($Action -eq "Block") {
        # 1. Créer une règle de blocage TOUT TRAFIC ENTRANT
        New-NetFirewallRule -DisplayName "CYBERPATCH_ISOLATION_IN" -Direction Inbound -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
        
        # 2. Créer une règle de blocage TOUT TRAFIC SORTANT
        New-NetFirewallRule -DisplayName "CYBERPATCH_ISOLATION_OUT" -Direction Outbound -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null

        # 3. Exceptions CRITIQUES (Autoriser RDP et WinRM pour ne pas perdre la main)
        # RDP (3389)
        New-NetFirewallRule -DisplayName "CYBERPATCH_ALLOW_RDP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3389 -Profile Any | Out-Null
        # WinRM (5985/5986)
        New-NetFirewallRule -DisplayName "CYBERPATCH_ALLOW_WINRM" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5985,5986 -Profile Any | Out-Null
        
        # DNS (Pour permettre la résolution minimale)
        New-NetFirewallRule -DisplayName "CYBERPATCH_ALLOW_DNS" -Direction Outbound -Action Allow -Protocol UDP -RemotePort 53 -Profile Any | Out-Null

        Write-Output '{"success": true, "status": "quarantined", "message": "Machine isolée du réseau. Seuls RDP et WinRM sont autorisés."}'
    }
    elseif ($Action -eq "Unblock") {
        # Supprimer les règles créées
        Remove-NetFirewallRule -DisplayName "CYBERPATCH_ISOLATION_IN" -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName "CYBERPATCH_ISOLATION_OUT" -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName "CYBERPATCH_ALLOW_RDP" -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName "CYBERPATCH_ALLOW_WINRM" -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName "CYBERPATCH_ALLOW_DNS" -ErrorAction SilentlyContinue

        Write-Output '{"success": true, "status": "active", "message": "Isolement levé. Trafic réseau rétabli."}'
    }
}
catch {
    Write-Output "{`"error`": `"$($_.Exception.Message)`"}"
}
