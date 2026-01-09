# Force UTF-8 encoding for output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
    # Check if winget is installed
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Error "Winget n'est pas installé ou détecté dans le PATH."
        exit 1
    }

    # Run winget upgrade to list available updates
    # We include unknown versions to be safe
    $output = winget upgrade --include-unknown | Out-String

    # Parse the text output (Winget outputs a table)
    # Typical format: Name, Id, Version, Available, Source
    
    $lines = $output -split "`r`n"
    $apps = @()
    $startParsing = $false

    foreach ($line in $lines) {
        if ($line -match "^Name\s+Id\s+Version") {
            $startParsing = $true
            continue
        }
        if (-not $startParsing -or [string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -match "^-+") { continue } # Skip separator line

        # Split by multiple spaces
        # Note: This is a basic parser. Winget output can be tricky.
        # We assume the last column is Source, 2nd last is Available, 3rd last is Version
        
        # Regex to capture the columns broadly
        if ($line -match "^(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+)") {
            $matches.Remove(0) # Remove full match
            
            $obj = @{
                Name = $matches[1].Trim()
                Id = $matches[2].Trim()
                CurrentVersion = $matches[3].Trim()
                NewVersion = $matches[4].Trim()
                Source = $matches[5].Trim()
                IsSelected = $true 
            }
            $apps += $obj
        }
    }

    if ($apps.Count -eq 0) {
        # Check if output says "No installed package found matching input criteria"
        if ($output -match "No installed package found") {
            Write-Output "[]"
        } else {
            # Maybe parsing failed or really no updates
             Write-Output "[]"
        }
    } else {
        Write-Output ($apps | ConvertTo-Json -Depth 5)
    }

} catch {
    Write-Error "Error: $($_.Exception.Message)"
    exit 1
}
