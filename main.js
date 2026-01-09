const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const AuditLedger = require('./audit_ledger');
const LicenseManager = require('./license_manager');

const auditLedger = new AuditLedger();
const licenseManager = new LicenseManager();

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Handlers for Real System Actions ---

// License Check
ipcMain.handle('get-license-status', async () => {
    const result = licenseManager.loadLicense();
    result.machineId = await licenseManager.getMachineId(); // Send ID so user can copy it for admin
    return result;
});

// License Import
ipcMain.handle('import-license', async (event, content) => {
    try {
        const licensePath = path.join(app.getPath('userData'), 'license.key');
        fs.writeFileSync(licensePath, content); // Save file
        
        // Reload to check if valid
        const result = licenseManager.loadLicense();
        
        if (result.valid) {
            logAudit('LICENSE_IMPORTED', { valid: true });
            return { success: true };
        } else {
            logAudit('LICENSE_IMPORT_FAIL', { reason: result.reason });
            return { success: false, reason: result.reason };
        }
    } catch (e) {
        console.error("License Import Error:", e);
        return { success: false, reason: "Write error: " + e.message };
    }
});

// 6. Offline / Air-Gap Kit Generator
ipcMain.handle('generate-offline-kit', async () => {
    if (!licenseManager.hasFeature('offline_kit')) {
        return { success: false, message: "License Restricted: Feature 'offline_kit' not enabled." };
    }

    const { filePaths } = await dialog.showOpenDialog({
        title: 'Sélectionner le dossier de destination pour le Kit Offline',
        properties: ['openDirectory']
    });

    if (filePaths && filePaths.length > 0) {
        logAudit('OFFLINE_KIT_GEN_INIT', { path: filePaths[0] });
        return new Promise((resolve) => {
             const scriptPath = resolveScriptPath('export_offline_kit.ps1');
             const command = `& "${scriptPath}" -Path "${filePaths[0]}"`;
             const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', command]);
             
             let output = '';
             ps.stdout.on('data', (d) => output += d.toString());
             
             ps.on('close', () => {
                 try {
                     const res = JSON.parse(output);
                     resolve(res);
                 } catch (e) {
                     resolve({ success: false, error: "Parse error", raw: output });
                 }
             });
        });
    }
    return { success: false, cancel: true };
});

// Helper to resolve script path in both Dev and Production (Unpacked) modes

function resolveScriptPath(scriptName) {
    let scriptDir = path.join(__dirname, 'scripts');
    if (app.isPackaged) {
        scriptDir = scriptDir.replace('app.asar', 'app.asar.unpacked');
    }
    return path.join(scriptDir, scriptName);
}

// Helper function to run PS scripts safely
function runPowerShell(scriptName, res) {
    const scriptPath = resolveScriptPath(scriptName);
    const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', `& "${scriptPath}"`]);

    let output = '';
    let errorOutput = '';

    ps.stdout.on('data', (data) => { output += data.toString(); });
    ps.stderr.on('data', (data) => { errorOutput += data.toString(); });

    ps.on('close', (code) => {
        if (code !== 0 || errorOutput.trim().length > 0) {
            console.error(`PS Error (${scriptName}): ${errorOutput}`);
            if (!output.trim()) {
                res({ error: `Failed with code ${code}`, details: errorOutput });
                return;
            }
        }
        try {
            let results = JSON.parse(output);
            // Ensure array
            if (!Array.isArray(results)) {
                results = [results];
            }
            // Filter out null/empty if any
            results = results.filter(r => r);
            
            res({ success: true, updates: results });
        } catch (e) {
            console.error("JSON Error:", e, output);
            res({ error: "Failed to parse results", raw: output, details: errorOutput || e.message });
        }
    });
}

// --- Audit & Logging System ---
function logAudit(action, details) {
    try {
        // CHANGED: Log to project directory for debugging access
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        
        // 1. Standard Log (Legacy)
        const entry = {
            timestamp: new Date().toISOString(),
            user: process.env.USERNAME || 'SYSTEM',
            action: action,
            details: details,
            host: require('os').hostname()
        };
        fs.appendFileSync(path.join(logDir, 'audit_security.log'), JSON.stringify(entry) + '\n');

        // 2. Secure Ledger (Blockchain-lite)
        auditLedger.log(action, process.env.USERNAME || 'SYSTEM', details);

    } catch (e) {
        console.error("Audit Log Failure:", e);
    }
}

// Check Admin Privileges
ipcMain.handle('check-admin', async () => {
    return new Promise(resolve => {
        if (process.platform !== 'win32') return resolve(true); // Dev/Mac
        const { exec } = require('child_process');
        exec('net session', (err) => {
            resolve(!err);
        });
    });
});

// Helper for Service Scan
ipcMain.handle('scan-services', async () => {
    return new Promise((resolve) => {
        const scriptPath = resolveScriptPath('scan_services.ps1');
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', `& "${scriptPath}"`]);
        
        let output = '';
        ps.stdout.on('data', (data) => { output += data.toString(); });
        
        ps.on('close', () => {
            try {
                let services = JSON.parse(output);
                if (!Array.isArray(services)) services = [services];
                
                // Simplify to just a list of names/display names string for easier matching
                resolve(services);
            } catch (e) {
                console.error("Service Scan Error", e);
                resolve([]);
            }
        });
    });
});

ipcMain.handle('scan-updates', async () => {
    logAudit('SCAN_START', { type: 'WindowsUpdate' });
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve({ error: "Windows only." });
        runPowerShell('scan_updates.ps1', (res) => {
            logAudit('SCAN_COMPLETE', { success: !res.error, count: res.updates ? res.updates.length : 0 });
            resolve(res);
        });
    });
});

ipcMain.handle('scan-history', async () => {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve({ error: "Windows only." });
        runPowerShell('get_history.ps1', resolve);
    });
});

ipcMain.handle('scan-apps', async () => {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve({ error: "Windows only." });
        runPowerShell('scan_apps.ps1', resolve);
    });
});

ipcMain.handle('update-app', async (event, appId) => {
    if (!licenseManager.hasFeature('app_updates')) {
         logAudit('LICENSE_DENIED', { feature: 'app_updates' });
         return { success: false, message: "Feature Restricted: Requires Pro or Ultimate Edition." };
    }
    logAudit('APP_UPDATE_INIT', { appId: appId });

    // 1. Conditional Patching Check
    const health = await checkSystemHealth();
    if (health) {
        if (health.CPU > 90 || health.FreeMemMB < 500 || health.Battery < 20) {
            const reason = `CPU: ${health.CPU}%, RAM: ${health.FreeMemMB}MB, Bat: ${health.Battery}%`;
            logAudit('APP_UPDATE_BLOCKED_RESOURCE', { appId, reason });
            return { success: false, message: `Mise à jour reportée : Ressources insuffisantes (${reason})` };
        }
    }

    // Automatic Safety Net for Apps too
    // DISABLED: Potential cause of BSOD on some systems
    // await createRestorePoint(); 

     return new Promise((resolve, reject) => {
        if (process.platform !== 'win32') {
            resolve({ error: "Platform not supported yet." });
            return;
        }

        const scriptPath = resolveScriptPath('update_apps.ps1');
        const command = `& "${scriptPath}" -AppId "${appId}"`;
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', command]);

        let output = '';
        
        ps.stdout.on('data', (data) => { output += data.toString(); });
        ps.stderr.on('data', (data) => { console.error(`App Update Error: ${data}`); });

        ps.on('close', (code) => {
            if (code === 0) {
                logAudit('APP_UPDATE_SUCCESS', { appId: appId });
                resolve({ success: true, message: "Application updated successfully." });
            } else {
                logAudit('APP_UPDATE_FAIL', { appId: appId, code: code, output: output });
                resolve({ success: false, message: `Update failed. Raw output: ${output}` });
            }
        });
    });
});

ipcMain.handle('configure-scheduler', async (event, action) => {
    logAudit('SCHEDULER_CONFIG', { action: action });
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve({ error: "Windows only." });
        
        const scriptPath = resolveScriptPath('setup_scheduler.ps1');
        const command = `& "${scriptPath}" -Action "${action}"`;
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', command]);
        
        let output = '';
        ps.stdout.on('data', (data) => { output += data.toString(); });
        
        ps.on('close', (code) => {
             // setup_scheduler.ps1 prints the result message directly
            logAudit('SCHEDULER_RESULT', { success: code === 0, output: output.trim() });
            resolve({ success: code === 0, message: output || "Operation completed." });
        });
    });
});

// Helper for System Restore Point
function createRestorePoint() {
    return new Promise((resolve) => {
        const scriptPath = resolveScriptPath('create_restore_point.ps1');
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', `& "${scriptPath}"`]);
        
        ps.on('close', (code) => {
            resolve(code === 0);
        });
    });
}

// Helper for System Health Check
function checkSystemHealth() {
    return new Promise((resolve) => {
        const scriptPath = resolveScriptPath('check_health.ps1');
        // We use exec here for a quick check, spawn is overkill but safer
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', `& "${scriptPath}"`]);
        
        let output = '';
        ps.stdout.on('data', (data) => { output += data.toString(); });
        
        ps.on('close', (code) => {
            try {
                const health = JSON.parse(output);
                resolve(health);
            } catch (e) {
                console.error("Health Check Parse Error", e, output);
                resolve(null); // Fail safe
            }
        });
    });
}

ipcMain.handle('install-update', async (event, updateId) => {
     if (!licenseManager.hasFeature('patching')) {
         logAudit('LICENSE_DENIED', { feature: 'patching' });
         return { success: false, message: "License Restricted: Feature 'patching' not enabled." };
     }

     logAudit('WIN_UPDATE_INIT', { updateId: updateId });
     
     // 1. Conditional Patching Check
     const health = await checkSystemHealth();
     if (health) {
         if (health.CPU > 90 || health.FreeMemMB < 500 || health.Battery < 20) {
             const reason = `CPU: ${health.CPU}%, RAM: ${health.FreeMemMB}MB, Bat: ${health.Battery}%`;
             logAudit('UPDATE_BLOCKED_RESOURCE', { updateId, reason });
             return { success: false, message: `Installation reportée : Ressources insuffisantes (${reason})` };
         }
     }

     // 2. Automatic Safety Net
     logAudit('RESTORE_POINT_INIT', { trigger: updateId });
     // DISABLED: Potential cause of BSOD
     /*
     const rpSuccess = await createRestorePoint();
     if (!rpSuccess) {
         logAudit('RESTORE_POINT_FAIL', { trigger: updateId });
         // Proceed anyway? Or Block? For High Security, we warn but proceed or fail.
         // Let's proceed but log it clearly.
     } else {
         logAudit('RESTORE_POINT_SUCCESS', { trigger: updateId });
     }
     */
     logAudit('RESTORE_POINT_SKIPPED', { reason: "BSOD Prevention" });

     return new Promise((resolve, reject) => {
        if (process.platform !== 'win32') {
            resolve({ error: "Platform not supported yet." });
            return;
        }

        const scriptPath = resolveScriptPath('install_update.ps1');
        // Use -Command here as well
        const command = `& "${scriptPath}" -UpdateID "${updateId}"`;
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', command]);

        let output = '';
        
        ps.stdout.on('data', (data) => {
             // Stream progress back if possible, for now just collect
             console.log(`Install output: ${data}`);
             output += data.toString();
        });

        ps.stderr.on('data', (data) => {
            console.error(`Install error: ${data}`);
        });

        ps.on('close', (code) => {
            if (code === 0) {
                logAudit('WIN_UPDATE_SUCCESS', { updateId: updateId });
                resolve({ success: true, message: "Installation initiated/completed." });
            } else {
                logAudit('WIN_UPDATE_FAIL', { updateId: updateId, code: code, details: output });
                resolve({ success: false, message: `Installation failed. Details: ${output || 'Code ' + code}` });
            }
        });
    });
});

ipcMain.handle('save-report', async (event, { data, filename }) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Enregistrer le rapport',
        defaultPath: filename || 'rapport-correctifs.csv',
        filters: [{ name: 'Fichiers CSV', extensions: ['csv'] }]
    });

    if (filePath) {
        fs.writeFileSync(filePath, data, 'utf-8');
        return { success: true, path: filePath };
    }
    return { success: false };
});

// --- LIVE OPS & DISCOVERY (SHADOW IT & AUTO-HEAL) ---

// 1. Shadow IT Scanner (Network Discovery)
ipcMain.handle('scan-network', async () => {
    if (!licenseManager.hasFeature('discovery')) {
        return [];
    }
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve([]);
        
        // Use Get-NetNeighbor for better structured data than arp -a
        const cmd = `Get-NetNeighbor -AddressFamily IPv4 | Where-Object { $_.State -eq 'Reachable' -or $_.State -eq 'Stale' } | Select-Object IPAddress, LinkLayerAddress, State | ConvertTo-Json`;
        
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        let output = '';
        
        ps.stdout.on('data', d => output += d);
        ps.on('close', () => {
            try {
                let neighbors = JSON.parse(output || '[]');
                if (!Array.isArray(neighbors)) neighbors = [neighbors];
                resolve(neighbors);
            } catch (e) {
                console.error("Network Scan Parse Error", e);
                resolve([]);
            }
        });
    });
});

// 2. Runtime Audit (Memory vs Disk)
ipcMain.handle('audit-runtime', async () => {
    return new Promise((resolve) => {
        // Get running processes with their file paths and versions
        // We limit to processes with paths and exclude system idle
        const cmd = `Get-Process | Where-Object { $_.Path -and $_.Id -ne 0 } | Select-Object Name, Id, Path, ProductVersion | Sort-Object Name -Unique | ConvertTo-Json -Depth 1`;
        
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        let output = '';
        
        // Increase buffer/limit might be needed, but stream collection handles it usually
        ps.stdout.on('data', d => output += d);
        ps.on('close', () => {
            try {
                let procs = JSON.parse(output || '[]');
                if (!Array.isArray(procs)) procs = [procs];
                resolve(procs);
            } catch (e) {
                resolve([]);
            }
        });
    });
});

// 3. Auto-Healer (Repair Logic)
ipcMain.handle('trigger-auto-heal', async (event, issueType) => {
    logAudit('AUTO_HEAL_INIT', { type: issueType });
    
    let scriptCmd = '';
    
    switch(issueType) {
        case 'service_wuauserv':
            scriptCmd = 'Restart-Service wuauserv -Force; Get-Service wuauserv | Select-Object Status | ConvertTo-Json';
            break;
        case 'clear_cache':
            scriptCmd = 'Stop-Service wuauserv; Remove-Item -Path "C:\\Windows\\SoftwareDistribution\\*" -Recurse -Force; Start-Service wuauserv; "Cache Cleared"';
            break;
        case 'disk_cleanup':
            // Simple temp cleanup
            scriptCmd = 'Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue; "Temp Cleared"';
            break;
        case 'reset_network':
            scriptCmd = 'ipconfig /flushdns; "DNS Flushed"';
            break;
        default:
            return { success: false, message: "Unknown heal type" };
    }

    return new Promise((resolve) => {
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', scriptCmd]);
        let output = '';
        ps.stdout.on('data', d => output += d);
        ps.on('close', (code) => {
            logAudit('AUTO_HEAL_COMPLETE', { type: issueType, code, output: output.trim() });
            resolve({ success: code === 0, output: output.trim() });
        });
    });
});

ipcMain.handle('export-pdf', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    
    const { filePath } = await dialog.showSaveDialog({
        title: 'Enregistrer le PDF',
        defaultPath: 'rapport-securite.pdf',
        filters: [{ name: 'Fichiers PDF', extensions: ['pdf'] }]
    });

    if (filePath) {
        try {
            const data = await win.webContents.printToPDF({
                printBackground: true,
                landscape: false,
                pageSize: 'A4'
            });
            fs.writeFileSync(filePath, data);
            return { success: true, path: filePath };
        } catch (error) {
            console.error('PDF Export Error:', error);
            return { error: error.message };
        }
    }
    return { success: false };
});

// --- ADVANCED SECURITY & CONTINUITY ---

// 1. Behavioral Monitoring (Post-Patch Surveillance)
ipcMain.handle('monitor-behavior', async () => {
    return new Promise((resolve) => {
        // Look for Security Events 4688 (Process Creation) & 4672 (Privilege Escalation) in last 1 minute
        // Filter for potential suspicious activities (e.g., cmd/powershell launched by non-admin or system)
        const cmd = `Get-WinEvent -LogName Security -MaxEvents 50 -ErrorAction SilentlyContinue | Where-Object { ($_.Id -eq 4688 -or $_.Id -eq 4672) -and $_.TimeCreated -gt (Get-Date).AddMinutes(-1) } | Select-Object TimeCreated, Id, Message | ConvertTo-Json`;
        
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        let output = '';
        
        ps.stdout.on('data', d => output += d);
        ps.on('close', () => {
            try {
                let events = JSON.parse(output || '[]');
                if (!Array.isArray(events)) events = [events];
                resolve(events);
            } catch (e) {
                // Empty or parse error is fine, means no events
                resolve([]);
            }
        });
    });
});

// 2. Integrity Check (Post-Deployment)
ipcMain.handle('check-integrity', async () => {
    return new Promise((resolve) => {
        // Light integrity check: DISM Health + Security Services Status
        const cmd = `
            $dism = DISM /Online /Cleanup-Image /CheckHealth | Out-String;
            $defender = Get-Service WinDefend -ErrorAction SilentlyContinue | Select-Object Status;
            $firewall = Get-Service MpsSvc -ErrorAction SilentlyContinue | Select-Object Status;
            @{ DISM=$dism; Defender=$defender.Status; Firewall=$firewall.Status } | ConvertTo-Json
        `;
        
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        let output = '';
        
        ps.stdout.on('data', d => output += d);
        ps.on('close', () => {
            try {
                const status = JSON.parse(output);
                resolve({ success: true, status });
            } catch (e) {
                resolve({ success: false, error: "Integrity check failed" });
            }
        });
    });
});

// --- LIFECYCLE & EMERGENCY MODULES ---

// 1. EOL/EOS Scanner (Obsolescence)
ipcMain.handle('check-eol-status', async () => {
    return new Promise((resolve) => {
        // Get OS Version Info
        const cmd = `Get-ComputerInfo | Select-Object OsName, OsVersion, OsBuildNumber, WindowsVersion | ConvertTo-Json`;
        
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        let output = '';
        
        ps.stdout.on('data', d => output += d);
        ps.on('close', () => {
            try {
                const info = JSON.parse(output);
                // Knowledge Base of EOL (Simplified for Demo - In prod, fetch from API)
                const eolDB = {
                    '10.0.10240': '2017-05-09', // 1507
                    '10.0.14393': '2018-04-10', // 1607
                    '10.0.17763': '2019-11-12', // 1809 (Home/Pro)
                    '10.0.18362': '2020-11-10', // 1903
                    '10.0.18363': '2021-05-11', // 1909
                    '10.0.19041': '2022-12-13', // 2004
                    '10.0.19042': '2022-10-18', // 20H2
                    '10.0.19043': '2022-12-13', // 21H1
                    // Windows 11
                    '10.0.22000': '2023-10-10'  // 21H2
                };
                
                const build = `10.0.${info.OsBuildNumber}`;
                const eolDate = eolDB[build];
                let status = "Supported";
                
                if (eolDate) {
                    const today = new Date();
                    const end = new Date(eolDate);
                    if (today > end) status = "EOL (End of Life)";
                    else status = `Supported until ${eolDate}`;
                }
                
                resolve({ success: true, info, status });
            } catch (e) {
                resolve({ success: false, error: "Failed to check OS info" });
            }
        });
    });
});

// 2. Emergency Hardening (War Room)
ipcMain.handle('emergency-harden', async (event, enable) => {
    if (!licenseManager.hasFeature('war_room')) {
         return { success: false, message: "Feature Restricted: Requires Ultimate Edition (War Room)." };
    }
    logAudit('EMERGENCY_HARDENING', { enabled: enable });
    
    // Stop Spooler (PrintNightmare), WinRM, SSDP (Discovery)
    const stopCmd = `
        Stop-Service Spooler -Force -ErrorAction SilentlyContinue; 
        Set-Service Spooler -StartupType Disabled;
        Stop-Service WinRM -Force -ErrorAction SilentlyContinue;
        Stop-Service SSDPSRV -Force -ErrorAction SilentlyContinue;
        "SECURED"
    `;
    
    const restoreCmd = `
        Set-Service Spooler -StartupType Automatic;
        Start-Service Spooler;
        Start-Service WinRM;
        Start-Service SSDPSRV;
        "RESTORED"
    `;
    
    const cmd = enable ? stopCmd : restoreCmd;

    return new Promise((resolve) => {
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        let output = '';
        ps.stdout.on('data', d => output += d);
        ps.on('close', (code) => resolve({ success: code === 0, output: output.trim() }));
    });
});

// 3. Blacklist Management (Recalled Patches)
const BLACKLIST_FILE = path.join(app.getPath('userData'), 'patch_blacklist.json');

ipcMain.handle('get-blacklist', async () => {
    if (fs.existsSync(BLACKLIST_FILE)) return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    return [];
});

ipcMain.handle('toggle-blacklist', async (event, kbId) => {
    let list = [];
    if (fs.existsSync(BLACKLIST_FILE)) list = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
    
    if (list.includes(kbId)) {
        list = list.filter(id => id !== kbId); // Remove
    } else {
        list.push(kbId); // Add
    }
    
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(list));
    logAudit('BLACKLIST_UPDATE', { list });
    return list;
});

// 3. Isolation Mode (Firewall)
ipcMain.handle('set-isolation', async (event, enable) => {
    if (!licenseManager.hasFeature('war_room')) {
         return false; // Silent fail or handle better
    }
    logAudit('ISOLATION_CHANGE', { enabled: enable });
    const cmd = enable 
        ? `New-NetFirewallRule -DisplayName "CyberPatch_Block_In" -Direction Inbound -Action Block -Profile Any; "ISOLATED"`
        : `Remove-NetFirewallRule -DisplayName "CyberPatch_Block_In" -ErrorAction SilentlyContinue; "RESTORED"`;
        
    return new Promise((resolve) => {
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', cmd]);
        ps.on('close', (code) => resolve(code === 0));
    });
});

// --- COLLABORATION & FEEDBACK MODULE ---
const COLLAB_FILE = path.join(app.getPath('userData'), 'collaboration_store.json');

function getCollabData() {
    try {
        if (!fs.existsSync(COLLAB_FILE)) return {};
        return JSON.parse(fs.readFileSync(COLLAB_FILE, 'utf8'));
    } catch (e) { return {}; }
}

function saveCollabData(data) {
    fs.writeFileSync(COLLAB_FILE, JSON.stringify(data, null, 2));
}

ipcMain.handle('get-collab-data', async () => {
    return getCollabData();
});

ipcMain.handle('add-comment', async (event, { updateId, text, author }) => {
    const data = getCollabData();
    if (!data[updateId]) data[updateId] = { comments: [], status: 'Pending', incidents: [] };
    
    const comment = {
        id: Date.now(),
        text,
        author: author || process.env.USERNAME,
        timestamp: new Date().toISOString()
    };
    
    data[updateId].comments.push(comment);
    saveCollabData(data);
    logAudit('COLLAB_COMMENT_ADDED', { updateId, author: comment.author });
    return { success: true, comment };
});

ipcMain.handle('set-approval-status', async (event, { updateId, status, author }) => {
    const data = getCollabData();
    if (!data[updateId]) data[updateId] = { comments: [], status: 'Pending', incidents: [] };
    
    data[updateId].status = status;
    saveCollabData(data);
    logAudit('COLLAB_STATUS_CHANGE', { updateId, status, author });
    return { success: true };
});

ipcMain.handle('report-incident', async (event, { updateId, details, author }) => {
    const data = getCollabData();
    if (!data[updateId]) data[updateId] = { comments: [], status: 'Pending', incidents: [] };
    
    const incident = {
        id: Date.now(),
        details,
        author: author || process.env.USERNAME,
        timestamp: new Date().toISOString()
    };
    
    data[updateId].incidents.push(incident);
    saveCollabData(data);
    
    // Feed AI Learning immediately
    // "Failures" in learning DB can be augmented with this manual incident report
    const learningPath = path.join(app.getPath('userData'), 'learning_db.json');
    let learningDB = { failures: {}, successes: {} };
    if (fs.existsSync(learningPath)) {
        try { learningDB = JSON.parse(fs.readFileSync(learningPath, 'utf8')); } catch(e){}
    }
    
    // Weight incident heavily (e.g. counts as 5 failures)
    const currentFailures = learningDB.failures[updateId] || 0;
    learningDB.failures[updateId] = currentFailures + 5;
    fs.writeFileSync(learningPath, JSON.stringify(learningDB, null, 2));

    logAudit('INCIDENT_REPORTED', { updateId, details, author });
    return { success: true };
});

// --- GOVERNANCE & SECURITY MODULES ---

// 1. Governance Policy Storage
const GOVERNANCE_FILE = path.join(app.getPath('userData'), 'governance_policy.json');
const LEARNING_DB_FILE = path.join(app.getPath('userData'), 'learning_db.json');

function loadGovernance() {
    try {
        if (fs.existsSync(GOVERNANCE_FILE)) {
            return JSON.parse(fs.readFileSync(GOVERNANCE_FILE, 'utf8'));
        }
    } catch (e) { console.error("Gov Load Error", e); }
    return { criticality: 'Standard', requireApproval: false };
}

ipcMain.handle('get-governance', async () => loadGovernance());

// AI Learning DB Handlers
ipcMain.handle('get-learning-data', async () => {
    try {
        if (fs.existsSync(LEARNING_DB_FILE)) {
            return JSON.parse(fs.readFileSync(LEARNING_DB_FILE, 'utf8'));
        }
    } catch (e) { console.error("Learning DB Load Error", e); }
    return { failures: {}, successes: {}, ignored: [] };
});

ipcMain.handle('save-learning-data', async (event, data) => {
    try {
        // Merge with existing to avoid overwriting race conditions (simple approach)
        let current = { failures: {}, successes: {}, ignored: [] };
        if (fs.existsSync(LEARNING_DB_FILE)) {
            current = JSON.parse(fs.readFileSync(LEARNING_DB_FILE, 'utf8'));
        }
        
        // Merge 'failures'
        if (data.failures) {
            for (const [key, val] of Object.entries(data.failures)) {
                current.failures[key] = (current.failures[key] || 0) + val;
            }
        }
        // Merge 'successes'
        if (data.successes) {
            for (const [key, val] of Object.entries(data.successes)) {
                current.successes[key] = (current.successes[key] || 0) + val;
            }
        }
        
        fs.writeFileSync(LEARNING_DB_FILE, JSON.stringify(current, null, 2));
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('save-governance', async (event, policy) => {
    try {
        fs.writeFileSync(GOVERNANCE_FILE, JSON.stringify(policy, null, 2));
        logAudit('POLICY_UPDATE', policy);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// 2. Defensive Security: Quarantine
ipcMain.handle('toggle-quarantine', async (event, action) => { // action = "Block" or "Unblock"
    logAudit('QUARANTINE_ACTION', { action });
    return new Promise((resolve) => {
        if (process.platform !== 'win32') return resolve({ error: "Windows only." });
        
        const scriptPath = resolveScriptPath('toggle_quarantine.ps1');
        const command = `& "${scriptPath}" -Action "${action}"`;
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', command]);
        
        let output = '';
        ps.stdout.on('data', (d) => output += d.toString());
        
        ps.on('close', () => {
            try {
                const res = JSON.parse(output);
                resolve(res);
            } catch (e) {
                resolve({ success: false, error: "Parse error", raw: output });
            }
        });
    });
});

// 3. Threat Intelligence (CISA KEV)
const { updateThreatData, CACHE_FILE } = require('./scripts/fetch_threats');

ipcMain.handle('check-threats', async () => {
    try {
        // Try to update, but fallback to cache if offline
        try {
            await updateThreatData();
        } catch (e) { console.log("Offline mode for threats"); }
        
        if (fs.existsSync(CACHE_FILE)) {
            const threats = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            return { success: true, data: threats };
        }
        return { success: false, error: "No threat data available" };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// 5. Ecosystem Integration (Webhook / SIEM)
const { net } = require('electron');

ipcMain.handle('send-webhook', async (event, { url, eventType, data }) => {
    logAudit('WEBHOOK_SEND_INIT', { url, eventType });
    
    return new Promise((resolve) => {
        if (!url || !url.startsWith('http')) {
            resolve({ success: false, error: "Invalid URL" });
            return;
        }

        const payload = JSON.stringify({
            timestamp: new Date().toISOString(),
            host: require('os').hostname(),
            type: eventType,
            severity: data.severity || 'INFO',
            data: data
        });

        const request = net.request({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        request.on('response', (response) => {
            logAudit('WEBHOOK_RESPONSE', { status: response.statusCode });
            if (response.statusCode >= 200 && response.statusCode < 300) {
                resolve({ success: true, status: response.statusCode });
            } else {
                resolve({ success: false, status: response.statusCode, error: "HTTP Error" });
            }
        });

        request.on('error', (error) => {
            logAudit('WEBHOOK_FAIL', { error: error.message });
            resolve({ success: false, error: error.message });
        });

        request.write(payload);
        request.end();
    });
});

// 4. Audit Log Viewer
ipcMain.handle('get-audit-logs', async () => {
    try {
        const logDir = path.join(__dirname, 'logs');
        const logPath = path.join(logDir, 'audit_security.log');
        
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            // Parse line by line to return array of objects
            const lines = content.trim().split('\n');
            const logs = lines.map(line => {
                try { return JSON.parse(line); } catch(e) { return null; }
            }).filter(l => l).reverse(); // Newest first
            return { success: true, logs: logs };
        }
        return { success: true, logs: [] };
    } catch (e) {
        return { success: false, error: e.message };
    }
});



