$ErrorActionPreference = "Stop"

try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    
    # Recherche large (Logiciels, Pilotes, Optionnels) qui ne sont PAS installés
    $searchResult = $searcher.Search("IsInstalled=0 and IsHidden=0")
    
    $updates = @()

    foreach ($update in $searchResult.Updates) {
        $kbArticles = @()
        foreach ($kb in $update.KBArticleIDs) {
            $kbArticles += $kb
        }

        $obj = @{
            Title = $update.Title
            Description = $update.Description
            KB = $kbArticles -join ", "
            UpdateID = $update.Identity.UpdateID
            Severity = $update.MsrcSeverity
            IsDownloaded = $update.IsDownloaded
            IsInstalled = $false
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
    Write-Error "Stack Trace: $($_.ScriptStackTrace)"
    exit 1
}
