$cpu = (Get-WmiObject Win32_Processor).LoadPercentage
$mem = (Get-WmiObject Win32_OperatingSystem)
$freeMemMB = ($mem.FreePhysicalMemory / 1024)
$battery = Get-WmiObject Win32_Battery
$batPercent = if ($battery) { $battery.EstimatedChargeRemaining } else { 100 }

@{
    CPU = $cpu
    FreeMemMB = [math]::Round($freeMemMB)
    Battery = $batPercent
} | ConvertTo-Json
