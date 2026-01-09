$ErrorActionPreference = "Stop"

try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    
    # Récupérer l'historique (Augmenté à 50 pour voir plus loin que Defender)
    $count = $searcher.GetTotalHistoryCount()
    if ($count -gt 50) { $count = 50 }
    
    $history = $searcher.QueryHistory(0, $count)
    
    $updates = @()

    foreach ($item in $history) {
        $status = "Installé"
        if ($item.ResultCode -ne 2) { $status = "Échec" }

        # Conversion explicite de la date pour éviter les confusions de fuseau horaire
        $dateStr = $item.Date.ToString("dd/MM/yyyy HH:mm:ss")

        $obj = @{
            Title = $item.Title
            Description = $item.Description
            KB = "Le " + $dateStr
            UpdateID = $item.UpdateIdentity.UpdateID
            Severity = $status
            IsInstalled = $true
        }
        $updates += $obj
    }

    if ($updates.Count -eq 0) {
        Write-Output "[]"
    } else {
        $json = $updates | ConvertTo-Json -Depth 5
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        Write-Output $json
    }
} catch {
    Write-Error "CRITICAL ERROR: $($_.Exception.Message)"
    exit 1
}
