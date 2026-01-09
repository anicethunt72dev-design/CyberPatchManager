param (
    [string]$UpdateID
)

$ErrorActionPreference = "Stop"
$LogFile = "c:\Users\GHOSTHUNT\Documents\Serveur de gestion des correctifs\install_debug.log"
Start-Transcript -Path $LogFile -Append

Write-Output "Starting installation for UpdateID: $UpdateID"

if (-not $UpdateID) {
    Write-Output "Error: No UpdateID provided."
    Stop-Transcript
    exit 1
}

try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    
    # Find the specific update
    $searchResult = $searcher.Search("UpdateID='$UpdateID'")

    if ($searchResult.Updates.Count -eq 0) {
        Write-Output "Update not found."
        exit 1
    }

    $updateToInstall = $searchResult.Updates[0]

    # EULA Check
    if (-not $updateToInstall.EulaAccepted) {
        Write-Output "Accepting EULA..."
        $updateToInstall.AcceptEula()
    }

    $updatesToInstall = New-Object -ComObject Microsoft.Update.UpdateColl
    $updatesToInstall.Add($updateToInstall) | Out-Null

    # Download
    if (-not $updateToInstall.IsDownloaded) {
        Write-Output "Downloading..."
        $downloader = $session.CreateUpdateDownloader()
        $downloader.Updates = $updatesToInstall
        $downloadResult = $downloader.Download()
        
        if ($downloadResult.ResultCode -ne 2) { # 2 = Succeeded
            Write-Output "Download failed with ResultCode: $($downloadResult.ResultCode)"
            exit 1
        }
    }

    # Install
    Write-Output "Installing..."
    $installer = $session.CreateUpdateInstaller()
    $installer.Updates = $updatesToInstall
    
    # Initiating installation
    $installationResult = $installer.Install()

    if ($installationResult.ResultCode -eq 2) {
        Write-Output "Installation Successful!"
        if ($installationResult.RebootRequired) {
            Write-Output "REBOOT REQUIRED"
        }
    } else {
        Write-Output "Installation Failed. Result Code: $($installationResult.ResultCode)"
        exit 1
    }

} catch {
    Write-Output "Error: $($_.Exception.Message)"
    Stop-Transcript
    exit 1
}
Stop-Transcript
