# Ce script est exécuté par le Task Scheduler en arrière-plan (SYSTEM)
$logPath = Join-Path $PSScriptRoot "..\scan_history.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    # 1. Scan Windows Updates
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    $searchResult = $searcher.Search("IsInstalled=0 and IsHidden=0")
    $winCount = $searchResult.Updates.Count

    # 2. Log result
    $msg = "[$timestamp] AUTO-SCAN: $winCount mises à jour Windows manquantes détectées."
    Add-Content -Path $logPath -Value $msg

    # Ici, on pourrait ajouter l'envoi d'un email d'alerte ou une notification système
    
} catch {
    $err = "[$timestamp] ERROR: $($_.Exception.Message)"
    Add-Content -Path $logPath -Value $err
}
