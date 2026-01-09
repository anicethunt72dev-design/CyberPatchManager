Get-Service | Where-Object { $_.Status -eq 'Running' } | Select-Object -Property Name, DisplayName | ConvertTo-Json
