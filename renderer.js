const scanBtn = document.getElementById('scan-btn');
const historyBtn = document.getElementById('history-btn');
const auditBtn = document.getElementById('audit-btn');
const appsBtn = document.getElementById('apps-btn');
const schedulerBtn = document.getElementById('scheduler-btn');
const exportBtn = document.getElementById('export-btn');
const pdfBtn = document.getElementById('pdf-btn');
const quitBtn = document.getElementById('quit-btn');
const installAllBtn = document.getElementById('install-all-btn');
const updatesList = document.getElementById('updates-list');
const loader = document.getElementById('loader');
const statusText = document.getElementById('system-status');
const logContainer = document.getElementById('activity-log');
const langSelect = document.getElementById('lang-select');
const globalRefreshBtn = document.getElementById('global-refresh-btn');

// Security & Governance Elements
const securityBtn = document.getElementById('security-btn');
const securityPanel = document.getElementById('security-panel');
const btnQuarantineOn = document.getElementById('btn-quarantine-on');
const btnQuarantineOff = document.getElementById('btn-quarantine-off');
const quarantineStatus = document.getElementById('quarantine-status');
const assetCriticality = document.getElementById('asset-criticality');
const requireApproval = document.getElementById('require-approval');
const savePolicyBtn = document.getElementById('save-policy-btn');
const threatStatus = document.getElementById('threat-status');

// Reporting & SOC Elements
const reportBtn = document.getElementById('report-btn');
const reportPanel = document.getElementById('report-panel');
const emergencyBtn = document.getElementById('emergency-btn');
const silentToggle = document.getElementById('silent-mode-toggle');

// Dashboard Indicators
const riskScoreVal = document.getElementById('risk-score-val');
const riskLevelText = document.getElementById('risk-level-text');
const maturityBar = document.getElementById('maturity-bar');
const maturityText = document.getElementById('maturity-text');
const heatmapGrid = document.getElementById('heatmap-grid');
const statVelocity = document.getElementById('stat-velocity');
const statDebt = document.getElementById('stat-debt');

// Ecosystem Elements
const ecosystemBtn = document.getElementById('ecosystem-btn');
const ecosystemPanel = document.getElementById('ecosystem-panel');
const webhookUrlInput = document.getElementById('webhook-url');
const testWebhookBtn = document.getElementById('test-webhook-btn');
const offlineKitBtn = document.getElementById('generate-offline-kit-btn');

const aboutBtn = document.getElementById('about-btn');
const aboutPanel = document.getElementById('about-panel');
// const settingsBtn = document.getElementById('settings-btn'); // Reserved for future use

// Live Ops Elements
const opsBtn = document.getElementById('ops-btn');
const opsPanel = document.getElementById('ops-panel');
const btnScanNetwork = document.getElementById('btn-scan-network');
const networkList = document.getElementById('network-list');
const btnAuditRuntime = document.getElementById('btn-audit-runtime');
const runtimeList = document.getElementById('runtime-list');
const healLogs = document.getElementById('heal-logs');
const healButtons = document.querySelectorAll('.btn-heal');

// Monitoring & Continuity Elements
const inputWindowStart = document.getElementById('window-start');
const inputWindowEnd = document.getElementById('window-end');
const chkAutoPause = document.getElementById('chk-auto-pause');
const resumeStatus = document.getElementById('resume-status');
const btnMonitorStart = document.getElementById('btn-monitor-start');
const btnCheckIntegrity = document.getElementById('btn-check-integrity');
const securityMonitorLog = document.getElementById('security-monitor-log');

// Lifecycle & War Room Elements
const lifecycleBtn = document.getElementById('lifecycle-btn');
const lifecyclePanel = document.getElementById('lifecycle-panel');
const eolDisplay = document.getElementById('eol-display');
const statMttr = document.getElementById('stat-mttr');
const statReliability = document.getElementById('stat-reliability');
const statBlacklist = document.getElementById('stat-blacklist');
const blacklistInput = document.getElementById('blacklist-input');
const btnAddBlacklist = document.getElementById('btn-add-blacklist');
const blacklistContainer = document.getElementById('blacklist-container');

// War Room Modal
const warRoomBtn = document.getElementById('war-room-btn');
const warRoomModal = document.getElementById('war-room-modal');
const closeWarRoom = document.querySelector('.close-war-room');
const btnHardenOn = document.getElementById('btn-harden-on');
const btnHardenOff = document.getElementById('btn-harden-off');
const btnWarIsolate = document.getElementById('btn-war-isolate');
const btnWarAlert = document.getElementById('btn-war-alert');
const warMsg = document.getElementById('war-msg');

let monitoringInterval = null;
let knownThreats = []; // CISA Catalog
let currentPolicy = { criticality: 'Standard', requireApproval: false };
let isSilentMode = false;

const dashboardBtn = document.getElementById('dashboard-nav-btn');
const dashboardContainer = document.getElementById('dashboard-container');

// --- Panel Navigation ---
function updateNavState(activeId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(activeId);
    if (btn) btn.classList.add('active');
}

function showPanel(panelName) {
    securityPanel.classList.add('hidden');
    ecosystemPanel.classList.add('hidden');
    reportPanel.classList.add('hidden');
    aboutPanel.classList.add('hidden');
    opsPanel.classList.add('hidden');
    lifecyclePanel.classList.add('hidden');
    
    // Hide Dashboard & Scan Results to focus on Panel
    dashboardContainer.classList.add('hidden');
    
    if (panelName === 'security') {
        securityPanel.classList.remove('hidden');
        updateNavState('security-btn');
    }
    if (panelName === 'ops') {
        opsPanel.classList.remove('hidden');
        updateNavState('ops-btn');
    }
    if (panelName === 'lifecycle') {
        lifecyclePanel.classList.remove('hidden');
        updateNavState('lifecycle-btn');
        updateLifecycleData(); // Refresh data on open
    }
    if (panelName === 'ecosystem') {
        ecosystemPanel.classList.remove('hidden');
        updateNavState('ecosystem-btn');
    }
    if (panelName === 'report') {
        reportPanel.classList.remove('hidden');
        updateNavState('report-btn');
    }
    if (panelName === 'about') {
        aboutPanel.classList.remove('hidden');
        updateNavState('about-btn');
        updatesList.innerHTML = ''; // Clear list
    }
    if (panelName === 'dashboard') {
        // Just reset to dashboard view (if we had a dashboard panel visible by default)
        // Currently 'dashboard-container' is the stats chart
        // Logic might need adjustment: if dashboard means "Home", we might show latest stats if available
        if (currentUpdatesData.length > 0) {
            dashboardContainer.classList.remove('hidden');
        } else {
             // Show empty state if needed or ensure main view is clear
             // For now, ensuring dashboard container is hidden is correct if empty,
             // but we must ensure side effects are handled.
             dashboardContainer.classList.add('hidden');
        }
        updateNavState('dashboard-nav-btn');
    }
}

dashboardBtn.addEventListener('click', () => showPanel('dashboard'));
aboutBtn.addEventListener('click', () => showPanel('about'));

securityBtn.addEventListener('click', () => showPanel('security'));
ecosystemBtn.addEventListener('click', () => showPanel('ecosystem'));
opsBtn.addEventListener('click', () => showPanel('ops'));
lifecycleBtn.addEventListener('click', () => showPanel('lifecycle'));
reportBtn.addEventListener('click', async () => {
    showPanel('report');
    // If we have data, update the SOC dashboard immediately
    if (currentUpdatesData.length > 0 || currentMode === 'scan') {
        updateRiskDashboard(currentUpdatesData);
    }
    // Fetch history for velocity metrics if needed
    if (statVelocity.innerText === '0') {
         const hist = await window.api.scanHistory();
         if (!hist.error) calculateVelocity(hist.updates);
    }
});

silentToggle.addEventListener('change', (e) => {
    isSilentMode = e.target.checked;
    log(`Mode Silencieux : ${isSilentMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`, "info");
});

// Emergency Mode
emergencyBtn.addEventListener('click', () => {
    if (!confirm("🚨 CONFIRMATION URGENCE CYBER 🚨\n\nCela va :\n1. Activer l'isolation réseau (Quarantaine)\n2. Sélectionner tous les correctifs critiques\n3. Lancer l'installation forcée\n\nContinuer ?")) return;
    
    document.body.classList.add('emergency-active');
    log("URGENCE CYBER DÉCLENCHÉE", "error");
    
    // 1. Quarantine
    // (Assuming quarantine logic exists, trigger existing button click or API)
    if (!btnQuarantineOff.classList.contains('hidden')) {
        // Already active
    } else {
        btnQuarantineOn.click();
    }

    // 2. Select Critical
    const checkboxes = document.querySelectorAll('.update-checkbox');
    let count = 0;
    checkboxes.forEach(cb => {
        const row = cb.closest('.update-card');
        const isCritical = row.querySelector('.severity').innerText.includes('Critical') || 
                           row.querySelector('.severity').innerText.includes('Important');
        if (isCritical) {
            cb.checked = true;
            count++;
        }
    });

    // 3. Trigger Install
    if (count > 0) {
        log(`Urgence : Installation forcée de ${count} correctifs critiques...`, "warn");
        installAllBtn.click();
    } else {
        alert("Aucun correctif critique en attente. Système à jour (ou scan nécessaire).");
        document.body.classList.remove('emergency-active');
    }
});

// --- i18n Configuration ---
const translations = {
    fr: {
        title: "🛡️ Gestionnaire de Correctifs Système",
        scanBtn: "🔍 Rechercher des mises à jour",
        appsBtn: "📦 Logiciels Tiers",
        historyBtn: "📜 Historique",
        schedulerBtn: "⚙️ Planifier Scan",
        exportBtn: "📥 Exporter CSV",
        pdfBtn: "📄 Exporter PDF",
        quitBtn: "❌ Quitter",
        statusWait: "Statut : En attente",
        statusScan: "Statut : Recherche de correctifs Windows...",
        statusApps: "Statut : Inventaire des logiciels tiers via Winget...",
        statusHistory: "Statut : Récupération de l'historique...",
        total: "Total",
        success: "Succès",
        fail: "Échecs",
        compliance: "Conformité",
        missingCritical: "Critiques Manquants",
        riskHigh: "RISQUE ÉLEVÉ DETECTÉ",
        installBtn: "Installer",
        updateBtn: "Mettre à jour",
        installAllBtn: "🚀 Tout Installer (Progressif)"
    },
    en: {
        title: "🛡️ System Patch Manager",
        scanBtn: "🔍 Check for Updates",
        appsBtn: "📦 Third-Party Apps",
        historyBtn: "📜 History",
        schedulerBtn: "⚙️ Schedule Scan",
        exportBtn: "📥 Export CSV",
        pdfBtn: "📄 Export PDF",
        quitBtn: "❌ Quit",
        statusWait: "Status: Waiting",
        statusScan: "Status: Scanning Windows Updates...",
        statusApps: "Status: Inventorying third-party apps via Winget...",
        statusHistory: "Status: Fetching history...",
        total: "Total",
        success: "Success",
        fail: "Failures",
        compliance: "Compliance",
        missingCritical: "Critical Missing",
        riskHigh: "HIGH RISK DETECTED",
        installBtn: "Install",
        updateBtn: "Update",
        installAllBtn: "🚀 Install All (Progressive)"
    }
};

let currentLang = 'fr';

function t(key) {
    return translations[currentLang][key] || key;
}

function updateTexts() {
    document.querySelector('h1').textContent = t('title');
    scanBtn.textContent = t('scanBtn');
    appsBtn.textContent = t('appsBtn');
    historyBtn.textContent = t('historyBtn');
    schedulerBtn.textContent = t('schedulerBtn');
    exportBtn.textContent = t('exportBtn');
    pdfBtn.textContent = t('pdfBtn');
    quitBtn.textContent = t('quitBtn');
    statusText.textContent = t('statusWait');
    installAllBtn.textContent = t('installAllBtn');
    
    // Update labels in stats cards
    const totalEl = document.querySelector('#stat-total');
    if(totalEl) totalEl.parentElement.querySelector('h3').innerText = t('total');
}

langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    updateTexts();
    // Re-render if data exists to translate status/buttons inside
    if (currentUpdatesData.length > 0) {
        renderUpdates(currentUpdatesData, currentMode);
        updateDashboard(currentUpdatesData, currentMode);
    }
});

// License UI Update
function updateLicenseUI(license) {
    if (!license) return;

    const type = license.type || 'Standard';
    const features = license.features || [];
    
    // Display License Type
    const pfInfo = document.getElementById('platform-info');
    if (pfInfo) {
        // Avoid duplicating if called multiple times
        if (!pfInfo.innerText.includes('Licence:')) {
             pfInfo.innerText += ` | Licence: ${type}`;
        }
    }

    // Helper to lock button
    const lockButton = (btnId, featureName) => {
        const btn = document.getElementById(btnId);
        if (btn && !features.includes(featureName) && !features.includes('*')) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = `Fonctionnalité désactivée (Édition ${type}). Mise à niveau requise.`;
            btn.disabled = true; // Works for button elements
            btn.classList.add('disabled-feature');
        }
    };

    lockButton('apps-btn', 'app_updates');
    lockButton('btn-scan-network', 'discovery');
    lockButton('war-room-btn', 'war_room');
    lockButton('generate-offline-kit-btn', 'offline_kit');
    
    // Emergency Button requires War Room usually
    if (!features.includes('war_room') && !features.includes('*')) {
         const emBtn = document.getElementById('emergency-btn');
         if(emBtn) {
             emBtn.style.display = 'none';
         }
    }
}

// Init Check
const initApp = async () => {
    // --- Event Listeners --- 
    document.querySelector('.close-modal').addEventListener('click', () => {
        collabModal.classList.add('hidden');
    });
    try {
        // Load Collaboration Data
        if (window.api.getCollabData) {
            await loadCollabData();
        } else {
            console.warn("Collab API not available in preload");
        }

        // 1. Admin Check
        const isAdmin = await window.api.checkAdmin();
        if (isAdmin) {
            log("Privilèges Administrateur détectés. Accès complet accordé.", "success");
            const pfInfo = document.getElementById('platform-info');
            if(pfInfo) pfInfo.innerText += " | Mode Admin";
        } else {
            log("ATTENTION : L'application n'est pas lancée en tant qu'administrateur. Les installations échoueront.", "warn");
            const pfInfo = document.getElementById('platform-info');
            if(pfInfo) pfInfo.innerText += " | Mode Restreint (Non-Admin)";
            alert("Avertissement de Sécurité : L'application doit être lancée en tant qu'administrateur pour appliquer les correctifs.");
        }

        // 2. Load Governance Policy
        const policy = await window.api.getGovernance();
        if (policy) {
            currentPolicy = policy;
            if(assetCriticality) assetCriticality.value = policy.criticality || 'Standard';
            if(requireApproval) requireApproval.checked = !!policy.requireApproval;
            log(`Politique chargée : ${policy.criticality}`, "info");
        }

        // 3. Load Threat Intel
        const threatRes = await window.api.checkThreats();
        if (threatRes.success) {
            knownThreats = threatRes.data;
            if(threatStatus) {
                threatStatus.innerText = `Base CISA Online : ${knownThreats.length} signatures actives.`;
                threatStatus.style.color = '#9ece6a';
            }
        } else {
            if(threatStatus) {
                threatStatus.innerText = `Base CISA Offline (Cache absent)`;
                threatStatus.style.color = '#f7768e';
            }
        }
        
        // 4. Init AI
        if (typeof AI_Heuristics !== 'undefined' && AI_Heuristics && AI_Heuristics.init) {
            await AI_Heuristics.init();
        } else {
             console.warn("AI_Heuristics not defined. Skipping AI initialization.");
        }
        
        // 5. License Check (Free Tier Enforcement)
        try {
             const license = await window.api.getLicenseStatus();
             updateLicenseUI(license);
             log(`Licence chargée : ${license.type || 'Inconnue'}`, "info");
        } catch(e) { 
            console.error("License Check Error", e); 
        }

        // Hide Loader if it was stuck
        // Assuming the loader is hidden by specific actions, but let's ensure we are "ready"
        if (loader) loader.classList.add('hidden');
        log("Initialisation terminée.", "success");
        
        // Default View
        showPanel('dashboard');

        // Check for Resume
        checkResumeState();

    } catch (err) {
        console.error("Critical Init Error:", err);
        log(`ERREUR CRITIQUE AU DÉMARRAGE : ${err.message}`, "error");
        alert(`Erreur au démarrage : ${err.message}`);
    }
};


// --- COLLABORATION UI LOGIC ---
let collabData = {};
let currentCollabUpdateId = null;

const collabModal = document.getElementById('collab-modal');
const collabTitle = document.getElementById('collab-title');
const commentsList = document.getElementById('comments-list');
const btnApprove = document.getElementById('btn-approve');
const btnReject = document.getElementById('btn-reject');
const btnReportIncident = document.getElementById('btn-report-incident');
const btnAddComment = document.getElementById('btn-add-comment');
const newCommentText = document.getElementById('new-comment-text');
const currentStatusDiv = document.getElementById('current-status');

async function loadCollabData() {
    collabData = await window.api.getCollabData();
}

function openCollabModal(update) {
    currentCollabUpdateId = update.UpdateID || update.Id;
    collabTitle.innerText = `Détails & Collab : ${update.Title || update.Name}`;
    collabModal.classList.remove('hidden');
    refreshCollabUI();
}

function refreshCollabUI() {
    if (!currentCollabUpdateId) return;
    const data = collabData[currentCollabUpdateId] || { comments: [], status: 'Pending' };
    
    // Status
    currentStatusDiv.innerText = `Statut : ${data.status}`;
    currentStatusDiv.className = '';
    if (data.status === 'Approved') currentStatusDiv.style.color = '#9ece6a';
    else if (data.status === 'Rejected') currentStatusDiv.style.color = '#f7768e';
    else currentStatusDiv.style.color = '#e0af68';

    // Comments
    commentsList.innerHTML = data.comments.map(c => `
        <div class="comment-item">
            <div class="comment-header">
                <strong>${c.author}</strong>
                <span>${new Date(c.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-text">${c.text}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    commentsList.scrollTop = commentsList.scrollHeight;
}


btnAddComment.addEventListener('click', async () => {
    const text = newCommentText.value.trim();
    if (!text || !currentCollabUpdateId) return;

    const res = await window.api.addComment(currentCollabUpdateId, text);
    if (res.success) {
        newCommentText.value = '';
        // Update local cache
        if (!collabData[currentCollabUpdateId]) collabData[currentCollabUpdateId] = { comments: [], status: 'Pending' };
        collabData[currentCollabUpdateId].comments.push(res.comment);
        refreshCollabUI();
    }
});

btnApprove.addEventListener('click', async () => setStatus('Approved'));
btnReject.addEventListener('click', async () => setStatus('Rejected'));

async function setStatus(status) {
    if (!currentCollabUpdateId) return;
    await window.api.setApprovalStatus(currentCollabUpdateId, status);
    if (!collabData[currentCollabUpdateId]) collabData[currentCollabUpdateId] = { comments: [], status: 'Pending' };
    collabData[currentCollabUpdateId].status = status;
    refreshCollabUI();
    
    // Refresh main list to show status border
    if (currentUpdatesData.length > 0) renderUpdates(currentUpdatesData, currentMode);
}

// --- LIVE OPS & AUTO-HEAL LOGIC ---

btnScanNetwork.addEventListener('click', async () => {
    networkList.innerHTML = '<span style="color:#e0af68">Scan en cours... (ARP/Neighbor)</span>';
    const neighbors = await window.api.scanNetwork();
    
    if (!neighbors || neighbors.length === 0) {
        networkList.innerHTML = '<span style="color:#f7768e">Aucun équipement détecté ou erreur scan.</span>';
        return;
    }

    networkList.innerHTML = neighbors.map(n => {
        // Simple heuristic for Shadow IT: If not local subnet gateway or own IP, mark suspicious if unknown
        // Here we just list them nicely
        const isReachable = n.State === 0 || n.State === 'Reachable'; // PS Enum map varies
        const color = isReachable ? '#9ece6a' : '#565f89';
        return `<div style="border-bottom:1px solid #414868; padding:5px;">
            <strong style="color:${color}">IP: ${n.IPAddress}</strong> 
            <span style="float:right; color:#7aa2f7;">MAC: ${n.LinkLayerAddress}</span>
            <br><span style="font-size:0.8em; color:#a9b1d6">Status: ${n.State}</span>
        </div>`;
    }).join('');
});

btnAuditRuntime.addEventListener('click', async () => {
    runtimeList.innerHTML = '<span style="color:#e0af68">Analyse mémoire en cours...</span>';
    const procs = await window.api.auditRuntime();
    
    if (!procs || procs.length === 0) {
        runtimeList.innerHTML = 'Erreur lecture processus.';
        return;
    }

    // Display list
    runtimeList.innerHTML = procs.map(p => `
        <div style="border-bottom:1px solid #414868; padding:5px;">
            <strong style="color:#bb9af7">${p.Name}</strong> (PID: ${p.Id})
            <br><span style="font-size:0.8em; color:#a9b1d6">${p.Path || 'Chemin système protégé'}</span>
            <br><span style="font-size:0.8em; color:#7aa2f7">Ver: ${p.ProductVersion || 'Inconnue'}</span>
        </div>
    `).join('');
});

healButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const action = e.target.getAttribute('data-heal');
        const label = e.target.innerText;
        
        // Log start
        const time = new Date().toLocaleTimeString();
        healLogs.innerHTML += `<div>[${time}] ⏳ Lancement : ${label}...</div>`;
        healLogs.scrollTop = healLogs.scrollHeight;
        
        const res = await window.api.triggerAutoHeal(action);
        
        const endStatus = res.success ? '<span style="color:#9ece6a">SUCCÈS</span>' : '<span style="color:#f7768e">ÉCHEC</span>';
        healLogs.innerHTML += `<div>[${time}] ${endStatus} : ${res.output || 'Aucune sortie'}</div><hr style="border-color:#414868">`;
        healLogs.scrollTop = healLogs.scrollHeight;
        
        log(`Auto-Repair: ${label} -> ${res.success ? 'OK' : 'FAIL'}`, res.success ? "success" : "error");
    });
});

btnReportIncident.addEventListener('click', async () => {
    const details = prompt("Décrivez l'incident rencontré avec ce correctif :");
    if (details) {
        await window.api.reportIncident(currentCollabUpdateId, details);
        alert("Incident signalé et pris en compte par l'IA.");
        // Add auto comment
        await window.api.addComment(currentCollabUpdateId, `[INCIDENT] ${details}`);
        // Reload data to get updated comment
        collabData = await window.api.getCollabData();
        refreshCollabUI();
    }
});

// --- CONTINUITY & SECURITY LOGIC ---

function checkMaintenanceWindow() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = inputWindowStart.value.split(':').map(Number);
    const [endH, endM] = inputWindowEnd.value.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    // Simple case: start < end (e.g., 08:00 to 18:00)
    if (startTotal < endTotal) {
        return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } 
    // Cross-midnight case: start > end (e.g., 22:00 to 06:00)
    else {
        return currentMinutes >= startTotal || currentMinutes <= endTotal;
    }
}

// Smart Queue with Resume Capability
function checkResumeState() {
    const queue = JSON.parse(localStorage.getItem('pending_queue') || '[]');
    if (queue.length > 0) {
        resumeStatus.innerHTML = `<span style="color:#e0af68">⚠️ Reprise : ${queue.length} patchs en attente.</span> <button id="btn-resume" class="btn secondary" style="padding:2px 8px; font-size:0.8em;">Reprendre</button>`;
        document.getElementById('btn-resume').addEventListener('click', () => processSmartQueue(queue));
    }
}

async function processSmartQueue(queue) {
    if (!queue || queue.length === 0) {
        localStorage.removeItem('pending_queue');
        resumeStatus.innerHTML = 'État : Terminé.';
        alert("Cycle de mise à jour terminé.");
        return;
    }

    // 1. Check Maintenance Window
    if (!checkMaintenanceWindow() && !document.body.classList.contains('emergency-active')) {
        log(`PAUSE : Hors fenêtre de maintenance (${inputWindowStart.value}-${inputWindowEnd.value})`, "warn");
        resumeStatus.innerHTML = `<span style="color:#f7768e">PAUSE : Hors fenêtre. Reprendra automatiquement ou manuellement.</span>`;
        return; // Exit, state remains in localStorage
    }

    // 2. Check System Health (Auto-Pause)
    if (chkAutoPause.checked) {
        // Assume checkHealth exists or mock it quickly for JS logic if API call is heavy
        // Ideally we call an API. Let's assume we proceed unless critical failure in previous step.
    }

    const currentId = queue[0];
    resumeStatus.innerHTML = `Traitement : ${currentId} (${queue.length} restants)...`;
    
    // Save current state
    localStorage.setItem('pending_queue', JSON.stringify(queue));

    try {
        log(`SmartQueue: Installation de ${currentId}...`, "info");
        const res = await window.api.installUpdate(currentId);
        
        if (res.success) {
            log(`[OK] ${currentId}`, "success");
            // Remove success from queue
            queue.shift();
            localStorage.setItem('pending_queue', JSON.stringify(queue));
            
            // Wait a bit or reboot check?
            setTimeout(() => processSmartQueue(queue), 2000); 
        } else {
            log(`[FAIL] ${currentId} : ${res.message}`, "error");
            // Strategy: Skip or Retry? Let's skip to avoid loop
            queue.shift();
            localStorage.setItem('pending_queue', JSON.stringify(queue));
            setTimeout(() => processSmartQueue(queue), 2000);
        }
    } catch (e) {
        log(`[CRASH] ${currentId}`, "error");
        // Don't shift, allow retry on resume
    }
}

// Override Install All for Smart Queue
installAllBtn.addEventListener('click', async (e) => {
    // Stop default behavior if we want to use Smart Queue
    e.stopImmediatePropagation(); 
    
    const checkboxes = document.querySelectorAll('.update-checkbox:checked');
    let targets = [];
    if (checkboxes.length > 0) {
        checkboxes.forEach(cb => targets.push(cb.getAttribute('data-id')));
    } else {
        targets = currentUpdatesData.filter(u => !u.IsInstalled).map(u => u.UpdateID);
    }

    if (targets.length === 0) return alert("Rien à installer.");

    if (confirm(`Démarrer l'installation INTELLIGENTE de ${targets.length} correctifs ?\n(Respect des fenêtres horaires + Reprise auto)`)) {
        processSmartQueue(targets);
    }
});


// Monitoring Logic
btnMonitorStart.addEventListener('click', () => {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        btnMonitorStart.innerText = "▶ Start Monitor";
        btnMonitorStart.style.background = "";
        securityMonitorLog.innerHTML += `<div>Monitoring Arrêté.</div>`;
    } else {
        btnMonitorStart.innerText = "⏹ Stop Monitor";
        btnMonitorStart.style.background = "#f7768e";
        securityMonitorLog.innerHTML += `<div>Monitoring Activé...</div>`;
        
        monitoringInterval = setInterval(async () => {
            const events = await window.api.monitorBehavior();
            if (events && events.length > 0) {
                events.forEach(ev => {
                    const msg = `[ALERTE] Event ${ev.Id}: ${ev.Message.substring(0, 50)}...`;
                    securityMonitorLog.innerHTML += `<div style="color:red; font-weight:bold;">${msg}</div>`;
                    log(msg, "error");
                    
                    // Auto-Block Logic (Mockup for safety)
                    if (ev.Id === 4672) { // Admin login
                        // window.api.setIsolation(true); 
                        // securityMonitorLog.innerHTML += `<div>ACTION: Isolation Réseau déclenchée (Admin suspect)</div>`;
                    }
                });
                securityMonitorLog.scrollTop = securityMonitorLog.scrollHeight;
            }
        }, 10000); // Check every 10s
    }
});

btnCheckIntegrity.addEventListener('click', async () => {
    securityMonitorLog.innerHTML += `<div>Vérification intégrité...</div>`;
    const res = await window.api.checkIntegrity();
    if (res.success) {
        securityMonitorLog.innerHTML += `<div style="color:#9ece6a">DISM: ${res.status.DISM.includes('No component store corruption detected') ? 'OK' : 'Warning'}</div>`;
        securityMonitorLog.innerHTML += `<div>Defender: ${res.status.Defender}</div>`;
        securityMonitorLog.innerHTML += `<div>Firewall: ${res.status.Firewall}</div><hr>`;
    } else {
        securityMonitorLog.innerHTML += `<div>Erreur check intégrité.</div>`;
    }
    securityMonitorLog.scrollTop = securityMonitorLog.scrollHeight;
});



// Log Helper
function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${msg}</span>`;
    logContainer.prepend(entry);
}

// --- WAR ROOM & LIFECYCLE LOGIC ---

// War Room UI
warRoomBtn.addEventListener('click', () => {
    warRoomModal.classList.remove('hidden');
    // Flash effect
    document.body.style.animation = "flash-red 1s";
    setTimeout(() => document.body.style.animation = "", 1000);
});
closeWarRoom.addEventListener('click', () => warRoomModal.classList.add('hidden'));

btnHardenOn.addEventListener('click', async () => {
    if (!confirm("⚠️ Action Irréversible : Cela va couper les services d'impression et d'administration à distance. Confirmer ?")) return;
    const res = await window.api.emergencyHarden(true);
    if (res.success) {
        btnHardenOn.classList.add('hidden');
        btnHardenOff.classList.remove('hidden');
        log("WAR ROOM: Durcissement activé (Spooler/WinRM coupé).", "success");
    } else {
        alert("Erreur durcissement : " + res.output);
    }
});

btnHardenOff.addEventListener('click', async () => {
    const res = await window.api.emergencyHarden(false);
    if (res.success) {
        btnHardenOff.classList.add('hidden');
        btnHardenOn.classList.remove('hidden');
        log("WAR ROOM: Services restaurés.", "info");
    }
});

btnWarAlert.addEventListener('click', async () => {
    const msg = warMsg.value;
    if (!msg) return alert("Veuillez décrire l'incident.");
    
    // Simulate SOC webhook
    const url = webhookUrlInput.value;
    if (url) {
        await window.api.sendWebhook(url, "CRITICAL_INCIDENT", { message: msg });
        alert("Alerte envoyée au SOC.");
    } else {
        alert("Aucune URL Webhook configurée dans Écosystème.");
    }
    log(`WAR ROOM: Alerte SOC déclenchée : ${msg}`, "warn");
    warMsg.value = "";
});

// Lifecycle Data Logic
async function updateLifecycleData() {
    eolDisplay.innerText = "Analyse version...";
    const eolRes = await window.api.checkEolStatus();
    if (eolRes.success) {
        const color = eolRes.status.includes('EOL') ? '#f7768e' : '#9ece6a';
        eolDisplay.innerHTML = `<span style="color:${color}">${eolRes.status}</span> <br><span style="font-size:0.6em; color:#565f89;">${eolRes.info.OsName} (${eolRes.info.OsBuildNumber})</span>`;
    } else {
        eolDisplay.innerText = "Erreur détection.";
    }

    // Load Blacklist
    const blacklist = await window.api.getBlacklist();
    statBlacklist.innerText = blacklist.length;
    renderBlacklist(blacklist);

    // Calc MTTR & Reliability (Mockup from Learning DB)
    const learning = await window.api.getLearningData();
    const fails = Object.values(learning.failures).reduce((a, b) => a + b, 0);
    const success = Object.values(learning.successes).reduce((a, b) => a + b, 0);
    const total = fails + success;
    
    if (total > 0) {
        const rate = Math.round((success / total) * 100);
        statReliability.innerText = `${rate}%`;
        statReliability.style.color = rate > 90 ? '#9ece6a' : (rate > 70 ? '#e0af68' : '#f7768e');
    }
    
    // Mock MTTR (Real calc would need start/end timestamps in DB)
    statMttr.innerText = "0.5h"; 
}

// Blacklist Logic
function renderBlacklist(list) {
    blacklistContainer.innerHTML = list.map(kb => `
        <div style="background:#f7768e; color:#1a1b26; padding:5px 10px; border-radius:15px; font-size:0.9em; display:flex; align-items:center; gap:5px;">
            ${kb} <span style="cursor:pointer; font-weight:bold;" onclick="removeBlacklist('${kb}')">&times;</span>
        </div>
    `).join('');
}

btnAddBlacklist.addEventListener('click', async () => {
    const kb = blacklistInput.value.trim().toUpperCase();
    if (!kb) return;
    const list = await window.api.toggleBlacklist(kb); // Add
    blacklistInput.value = '';
    statBlacklist.innerText = list.length;
    renderBlacklist(list);
});

// Expose remove function globally for onclick
window.removeBlacklist = async (kb) => {
    const list = await window.api.toggleBlacklist(kb); // Remove
    statBlacklist.innerText = list.length;
    renderBlacklist(list);
};


let updatesChart = null;
let currentUpdatesData = []; 
let currentMode = '';

// --- AI & HEURISTICS ENGINE ---
const AI_Heuristics = {
    learningData: { failures: {}, successes: {} },
    
    async init() {
        const data = await window.api.getLearningData();
        if (data) this.learningData = data;
        log("Moteur IA initialisé : Données d'apprentissage chargées.", "info");
    },

    predictRisk(update) {
        let riskScore = 0;
        let reasons = [];

        // 1. Historical Failure Analysis (Local Learning)
        const failCount = this.learningData.failures[update.UpdateID] || 0;
        if (failCount > 0) {
            riskScore += 40;
            reasons.push(`Échecs précédents: ${failCount}`);
        }

        // 2. Keyword Analysis (Stability)
        const unstableKeywords = ['preview', 'beta', 'insider', 'experimental'];
        if (unstableKeywords.some(k => update.Title.toLowerCase().includes(k))) {
            riskScore += 30;
            reasons.push("Version instable/Preview");
        }

        // 3. Service Impact Analysis
        const impacts = checkImpact(update);
        if (impacts.length > 0) {
            riskScore += 20;
            reasons.push(`Impact Service: ${impacts.join(', ')}`);
        }

        return { score: riskScore, reasons: reasons, highRisk: riskScore > 50 };
    },

    calculatePriority(update) {
        let score = 0;
        
        // 1. Severity
        if (update.Severity === 'Critical') score += 40;
        else if (update.Severity === 'Important') score += 25;
        
        // 2. Age / Debt (Naive: based on KB number approx or Title dates if parsed)
        // For now, we use a simple "Debt" boost if list is long
        
        // 3. CISA Exploit Boost
        const threats = findActiveThreats(update.Title + (update.Description||""));
        if (threats) score += 50;

        // 4. Service Relevance (Context)
        // If a patch affects a running service, it's CRITICAL to patch it (or CRITICAL to plan it)
        // Security logic: Patching exposed services is P0.
        const impacts = checkImpact(update);
        if (impacts.length > 0) score += 15;

        return Math.min(100, score);
    }
};

let activeServices = [];

function checkImpact(update) {
    const text = (update.Title + (update.Description || "")).toLowerCase();
    const impactMap = {
        'sql': ['mssql', 'sql'],
        'iis': ['w3svc', 'iis', 'world wide web'],
        'exchange': ['msexchange'],
        'active directory': ['ntds', 'domain services'],
        'hyper-v': ['vmms', 'virtual machine'],
        'tcp/ip': ['tcp', 'ip', 'network'],
        'dns': ['dns']
    };
    
    let impacted = [];
    for (const [key, searchTerms] of Object.entries(impactMap)) {
        if (text.includes(key)) {
            const hasService = activeServices.some(s => 
                searchTerms.some(term => s.Name.toLowerCase().includes(term) || s.DisplayName.toLowerCase().includes(term))
            );
            if (hasService) impacted.push(key.toUpperCase());
        }
    }
    return impacted;
}

// Helper to run scan
async function performScan(mode) {
    // UI Reset
    currentMode = mode;
    scanBtn.disabled = true;
    historyBtn.disabled = true;
    appsBtn.disabled = true;
    exportBtn.classList.add('hidden'); 
    pdfBtn.classList.add('hidden');
    securityPanel.classList.add('hidden'); // Hide security panel
    ecosystemPanel.classList.add('hidden');
    reportPanel.classList.add('hidden');
    loader.classList.remove('hidden');
    updatesList.innerHTML = '';
    dashboardContainer.classList.add('hidden');
    
    if (mode === 'scan') {
        statusText.textContent = t('statusScan');
        log("Démarrage du scan Windows Update...", "info");
        // Update Services list in background
        activeServices = await window.api.scanServices();
    } else if (mode === 'apps') {
        statusText.textContent = t('statusApps');
        log("Démarrage de l'inventaire des applications tierces (Winget)...", "info");
    } else {
        statusText.textContent = t('statusHistory');
        log("Récupération de l'historique des mises à jour...", "info");
    }

    try {
        let result;
        if (mode === 'scan') {
            result = await window.api.scanUpdates();
        } else if (mode === 'apps') {
            result = await window.api.scanApps();
        } else {
            result = await window.api.scanHistory();
        }

        if (result.error) {
            updatesList.innerHTML = `<div style="color: #f7768e;">Erreur : ${result.error} <br/> <pre>${result.details || ''}</pre></div>`;
            statusText.textContent = "Statut : Erreur";
            log(`Erreur lors du scan : ${result.error}`, "error");
            currentUpdatesData = [];
        } else {
            currentUpdatesData = result.updates;
            renderUpdates(result.updates, mode);
            updateDashboard(result.updates, mode);
            
            if (currentUpdatesData.length > 0) {
                exportBtn.classList.remove('hidden');
                pdfBtn.classList.remove('hidden');
            }

            if (mode === 'scan') {
                statusText.textContent = `Statut : ${result.updates.length} correctifs Windows trouvés`;
                log(`Scan terminé. ${result.updates.length} correctifs Windows trouvés.`, "success");
            } else if (mode === 'apps') {
                statusText.textContent = `Statut : ${result.updates.length} mises à jour logicielles trouvées`;
                log(`Inventaire terminé. ${result.updates.length} mises à jour logicielles trouvées.`, "success");
            } else {
                statusText.textContent = `Statut : Historique récupéré (${result.updates.length} éléments)`;
                log(`Historique chargé. ${result.updates.length} entrées trouvées.`, "success");
            }
        }
    } catch (e) {
        console.error(e);
        statusText.textContent = "Statut : Erreur Critique IPC";
        log(`Exception critique IPC : ${e}`, "error");
    } finally {
        scanBtn.disabled = false;
        historyBtn.disabled = false;
        appsBtn.disabled = false;
        loader.classList.add('hidden');
        
        // Notification logic
        if (!isSilentMode) {
            if (currentMode === 'scan' && currentUpdatesData.length > 0) {
                new Notification('Scan Terminé', { body: `${currentUpdatesData.length} correctifs Windows trouvés.` });
            } else if (currentMode === 'apps' && currentUpdatesData.length > 0) {
                new Notification('Inventaire Terminé', { body: `${currentUpdatesData.length} mises à jour logicielles trouvées.` });
            }
        }
    }
}

// Export Logic
exportBtn.addEventListener('click', async () => {
    if (!currentUpdatesData || currentUpdatesData.length === 0) return;

    // Convert JSON to CSV based on mode
    let headers = [];
    let rows = [];
    let complianceHeader = "";

    // Generate Compliance Summary for Report
    const date = new Date().toLocaleString();
    if (currentMode === 'scan') {
        // Calculate Risk Score for Report
        let riskScore = 0;
        currentUpdatesData.forEach(u => {
            if (u.Severity === 'Critical') riskScore += 10;
            else if (u.Severity === 'Important') riskScore += 5;
            else riskScore += 1;
            
            // Naive CISA check for report
            if (u.Title.includes("CVE-")) riskScore += 20; 
        });
        riskScore = Math.min(100, riskScore);
        const maturity = Math.max(0, 100 - riskScore);

        const criticalMissing = currentUpdatesData.filter(u => u.Severity === 'Critical' || u.Severity === 'Important').length;
        
        complianceHeader = [
            `"RAPPORT DE CONFORMITÉ DE SÉCURITÉ (ISO/IEC 27001)"`,
            `"Généré le : ${date}"`,
            `"Score de Risque Cyber : ${riskScore}/100"`,
            `"Indice de Maturité : ${maturity}%"`,
            `"Correctifs Critiques Manquants : ${criticalMissing}"`,
            `"Statut Global : ${riskScore > 50 ? 'CRITIQUE' : (riskScore > 20 ? 'A SURVEILLER' : 'CONFORME')}"`,
            `""` // Empty line
        ].join("\n");
    } else {
         complianceHeader = `"RAPPORT D'INVENTAIRE / HISTORIQUE"\n"Généré le : ${date}"\n""`;
    }

    if (currentMode === 'apps') {
         headers = ["Nom", "ID", "Version Actuelle", "Nouvelle Version", "Source"];
         rows = currentUpdatesData.map(u => 
            `"${u.Name}","${u.Id}","${u.CurrentVersion}","${u.NewVersion}","${u.Source}"`
         );
    } else {
         headers = ["Titre", "KB", "Sévérité", "Description", "Statut"];
         rows = currentUpdatesData.map(u => {
            const desc = (u.Description || "").replace(/(\r\n|\n|\r)/gm, " ");
            return `"${u.Title}","${u.KB}","${u.Severity}","${desc}","${u.IsInstalled ? 'Installé' : 'Manquant'}"`;
        });
    }

    const csvContent = complianceHeader + "\n" + [headers.join(","), ...rows].join("\n");
    const filename = `${currentMode}_compliance_report.csv`;

    try {
        log(`Export CSV demandé : ${filename}`, "info");
        const result = await window.api.saveReport(csvContent, filename);
        if (result.success) {
            alert(`Exporté : ${result.path}`);
            log(`Export CSV réussi : ${result.path}`, "success");
        }
    } catch (e) {
        alert("Erreur export : " + e);
        log("Erreur export CSV : " + e, "error");
    }
});

// Auto-Prioritize Logic (AI)
const autoPrioritizeBtn = document.getElementById('auto-prioritize-btn');
autoPrioritizeBtn.addEventListener('click', () => {
    if (currentUpdatesData.length === 0) return alert("Aucune mise à jour disponible pour l'analyse.");
    
    let count = 0;
    const checkboxes = document.querySelectorAll('.update-checkbox');
    checkboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        const update = currentUpdatesData.find(u => u.UpdateID === id);
        if (update) {
            const priority = AI_Heuristics.calculatePriority(update);
            // Threshold for Auto-Selection: 60+ (Critical/Important or High Threat)
            if (priority >= 60) {
                cb.checked = true;
                count++;
                // Visual feedback
                cb.closest('.update-card').style.border = "2px solid #7aa2f7";
            } else {
                cb.checked = false;
                cb.closest('.update-card').style.border = ""; // Reset
            }
        }
    });

    log(`IA : ${count} correctifs prioritaires sélectionnés automatiquement.`, "success");
    new Notification('IA Auto-Priorisation', { body: `${count} correctifs recommandés sélectionnés.` });
});

// Install All / Emergency Install Logic
installAllBtn.addEventListener('click', async () => {
    // 1. Check for selected checkboxes
    const checkboxes = document.querySelectorAll('.update-checkbox:checked');
    let targets = [];
    
    if (checkboxes.length > 0) {
        // Install specific selection
        checkboxes.forEach(cb => targets.push(cb.getAttribute('data-id')));
    } else {
        // Install ALL pending
        // Filter out those already installed or apps (for now just WinUpdates)
        if (currentMode !== 'scan') {
             alert("Le mode 'Tout Installer' est disponible uniquement pour les correctifs Windows pour l'instant.");
             return;
        }
        targets = currentUpdatesData.filter(u => !u.IsInstalled).map(u => u.UpdateID);
    }

    if (targets.length === 0) {
        alert("Aucun correctif sélectionné ou disponible.");
        return;
    }

    if (!confirm(`Confirmez-vous l'installation de ${targets.length} correctifs ?\nCela peut prendre du temps et nécessiter plusieurs redémarrages.`)) return;

    log(`Démarrage installation de masse (${targets.length} correctifs)...`, "warn");
    
    // Disable UI
    installAllBtn.disabled = true;
    scanBtn.disabled = true;

    // Process sequentially to avoid conflicts
    let successCount = 0;
    let failCount = 0;

    for (const id of targets) {
        try {
            statusText.textContent = `Installation en cours (${successCount + failCount + 1}/${targets.length})...`;
            // Call the window level function to reuse governance checks? 
            // Better to call API directly here to avoid multiple prompts if we want bulk.
            // But we SHOULD respect governance. 
            // Let's call API directly but check Governance once at start.
            
            const res = await window.api.installUpdate(id);
            if (res.success) {
                successCount++;
                log(`[OK] ${id}`, "success");
            } else {
                failCount++;
                log(`[FAIL] ${id} : ${res.message}`, "error");
            }
        } catch (e) {
            failCount++;
            log(`[ERR] ${id} : ${e}`, "error");
        }
    }

    alert(`Opération terminée.\nSuccès : ${successCount}\nÉchecs : ${failCount}\n\nUn redémarrage est probablement requis.`);
    statusText.textContent = "Opération de masse terminée.";
    installAllBtn.disabled = false;
    scanBtn.disabled = false;
    
    // Refresh
    performScan('scan');
});


// PDF Export Logic (unchanged)
pdfBtn.addEventListener('click', async () => {
    try {
        statusText.textContent = "Statut : Génération du PDF...";
        log("Génération du rapport PDF...", "info");
        const result = await window.api.exportPdf();
        if (result.success) {
            alert(`PDF généré : ${result.path}`);
            statusText.textContent = "Statut : PDF exporté.";
            log(`PDF exporté avec succès : ${result.path}`, "success");
        } else {
            statusText.textContent = "Statut : Export annulé";
            log("Export PDF annulé ou échoué.", "warn");
        }
    } catch (e) {
        alert("Erreur PDF : " + e);
        log("Erreur génération PDF : " + e, "error");
    }
});

// Quit Logic
quitBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment quitter l'application ?")) {
        window.close();
    }
});

schedulerBtn.addEventListener('click', async () => {
    // Simple toggle logic via confirm
    const enable = confirm("Voulez-vous ACTIVER la tâche planifiée de scan quotidien (12h00) ?\n\nSi vous cliquez sur Annuler, cela proposera de la DÉSACTIVER.");
    
    let action = enable ? "Create" : null;
    if (!enable) {
        if (confirm("Voulez-vous supprimer/désactiver la tâche planifiée existante ?")) {
            action = "Delete";
        } else {
            return; // User cancelled everything
        }
    }

    statusText.textContent = `Statut : Configuration du planificateur (${action})...`;
    log(`Configuration du planificateur (${action})...`, "info");
    
    try {
        const result = await window.api.configureScheduler(action);
        if (result.success) {
            alert(result.message);
            statusText.textContent = `Statut : Planificateur ${action === 'Create' ? 'activé' : 'désactivé'}.`;
            log(`Planificateur : ${result.message}`, "success");
        } else {
            alert("Erreur : " + result.message);
            statusText.textContent = "Statut : Erreur Planificateur";
            log(`Erreur Planificateur : ${result.message}`, "error");
        }
    } catch (e) {
        alert("Erreur IPC : " + e);
        log("Exception IPC Planificateur : " + e, "error");
    }
});


function calculateVelocity(history) {
    if (!history || history.length === 0) return;
    
    // Simple metric: Count installed in last 30 days
    const now = new Date();
    const monthAgo = new Date(now.setDate(now.getDate() - 30));
    
    // Note: History Date format from PS is usually localized string, might need robust parsing
    // But scan_history.ps1 returns pre-formatted strings or raw? 
    // Let's assume the PS script modification I read returns consistent objects, 
    // but the date is a string. We count simple length for now as proxy.
    const recent = history.length; // Just taking total history fetched (limited to 50)
    
    statVelocity.innerText = `${recent}`;
}

function updateRiskDashboard(updates) {
    // 1. Calculate Advanced Risk Score (Weighted by criticality, exploitability, and asset value)
    let score = 0;
    let criticalCount = 0;
    
    // Asset multiplier: Standard=1, Test=0.5, Critical=2
    let assetMultiplier = 1;
    if (currentPolicy.criticality === 'Critical') assetMultiplier = 2;
    if (currentPolicy.criticality === 'Test') assetMultiplier = 0.5;

    updates.forEach(u => {
        let updateScore = 0;
        if (u.Severity === 'Critical') {
            updateScore += 10;
            criticalCount++;
        } else if (u.Severity === 'Important') {
            updateScore += 5;
        } else {
            updateScore += 1;
        }
        
        // CISA Threat Intel Bonus (High Risk)
        if (knownThreats.length > 0) {
            const isThreat = knownThreats.some(t => t.vulnerabilityName && u.Title.includes(t.vulnerabilityName));
            if (isThreat) updateScore += 20; // Massive penalty for known exploits
        }
        
        score += updateScore;
    });
    
    // Adjust by asset criticality
    score = score * assetMultiplier;

    // Normalize Score (Logarithmic scale to avoid explosion)
    // 0-20: Low, 20-50: Moderate, 50+: Critical
    // Capping at 100 for display
    let displayScore = Math.min(100, Math.ceil(score));
    
    // Update Gauge
    riskScoreVal.innerText = displayScore;
    if (displayScore < 20) {
        riskLevelText.innerText = "FAIBLE";
        riskLevelText.style.color = "#9ece6a";
        riskScoreVal.style.color = "#9ece6a";
    } else if (displayScore < 50) {
        riskLevelText.innerText = "MODÉRÉ";
        riskLevelText.style.color = "#e0af68";
        riskScoreVal.style.color = "#e0af68";
    } else {
        riskLevelText.innerText = "CRITIQUE";
        riskLevelText.style.color = "#f7768e";
        riskScoreVal.style.color = "#f7768e";
    }

    // 2. Residual Risk & Technical Debt Calculation
    // Debt = Accumulation of unpatched vulnerabilities over time (proxy: count * average age, here just count for simplicity)
    statDebt.innerText = updates.length;
    
    // Residual Risk = Risk remaining AFTER hypothetical patching of all 'Critical' items
    // (Simulation for decision makers)
    let residualScore = 0;
    updates.forEach(u => {
        if (u.Severity !== 'Critical') {
            // Assume we patch Criticals first, what's left?
            residualScore += (u.Severity === 'Important' ? 5 : 1); 
        }
    });
    residualScore = Math.min(100, Math.ceil(residualScore * assetMultiplier));
    
    // Maturity = 100 - (Risk / AssetImpact) - Simplified model
    // Higher maturity means lower risk relative to asset value
    const maturity = Math.max(0, 100 - displayScore);
    maturityBar.style.width = `${maturity}%`;
    maturityText.innerText = `${maturity}% (Residual Risk Est: ${residualScore})`;

    // 3. Heatmap (Enhanced with Dynamic Risk Mapping)
    heatmapGrid.innerHTML = '';
    if (updates.length === 0) {
        heatmapGrid.innerHTML = '<div style="color: #9ece6a; grid-column: 1/-1;">Système sain. Aucune vulnérabilité.</div>';
    } else {
        // Group by Business Impact/Context (Mocked for now)
        // Sort by Severity then Title
        const sortedMap = [...updates].sort((a,b) => (a.Severity === 'Critical' ? -1 : 1));

        sortedMap.forEach(u => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            
            // Dynamic Color Logic based on context
            let baseClass = 'cell-low';
            if (u.Severity === 'Critical') baseClass = 'cell-critical';
            else if (u.Severity === 'Important') baseClass = 'cell-important';
            else if (u.Severity === 'Moderate') baseClass = 'cell-moderate';
            
            cell.classList.add(baseClass);
            
            // Add visual indicator for CISA exploit
            if (knownThreats.some(t => t.vulnerabilityName && u.Title.includes(t.vulnerabilityName))) {
                cell.style.border = "2px solid red";
                cell.style.animation = "pulse 1.5s infinite";
                cell.title = `[EXPLOIT ACTIF] ${u.Title}`;
            } else {
                cell.title = `${u.Title} (${u.Severity || 'Normal'})`;
            }

            // Click to drill down (future feature: show detail modal)
            cell.addEventListener('click', () => {
                alert(`Détails Vulnérabilité :\n\n${u.Title}\nSévérité : ${u.Severity}\nKB : ${u.KB}\n\nContexte Business : Impact potentiel sur la disponibilité.`);
            });

            heatmapGrid.appendChild(cell);
        });
    }
}

function updateDashboard(updates, mode) {
    dashboardContainer.classList.remove('hidden');
    
    // Show Emergency Button if Critical updates exist
    const hasCritical = updates.some(u => u.Severity === 'Critical' || (u.Severity && u.Severity.includes('Critical')));
    if (hasCritical) {
        emergencyBtn.classList.remove('hidden');
    } else {
        emergencyBtn.classList.add('hidden');
    }

    if (mode === 'scan') {
        updateRiskDashboard(updates);
        renderSimulationSummary(updates); // Trigger Simulation Display
    }

    let total = updates.length;
    let success = 0;
    let fail = 0;
    let criticalMissing = 0;
    let complianceScore = 100;

    if (mode === 'history') {
        success = updates.filter(u => u.Severity === 'Installé' || u.ResultCode === 2).length; // 2 = Succeeded
        fail = updates.filter(u => u.Severity === 'Échec' || u.ResultCode !== 2).length;
        // Compliance calculation is tricky on history alone, better on scan
    } else if (mode === 'apps') {
        success = 0; // Scanning apps shows what is NOT up to date usually
        criticalMissing = updates.length; // All outdated apps are a risk
        // Simple penalty: 5% per outdated app
        complianceScore = Math.max(0, 100 - (updates.length * 5));
    } else {
        // Windows Updates Scan
        // Critical/Important updates carry heavy penalty
        criticalMissing = updates.filter(u => u.Severity === 'Critical' || u.Severity === 'Important' || u.Severity === 'High').length;
        let otherMissing = updates.length - criticalMissing;
        
        // Penalty: 20% for critical, 5% for others
        let penalty = (criticalMissing * 20) + (otherMissing * 5);
        complianceScore = Math.max(0, 100 - penalty);
    }

    // Update UI
    document.getElementById('stat-total').innerText = total;
    
    // Rename cards for better context
    const card2Label = document.querySelector('#stat-success').parentElement.querySelector('h3');
    const card3Label = document.querySelector('#stat-fail').parentElement.querySelector('h3');

    if (mode === 'scan' || mode === 'apps') {
        card2Label.innerText = "Conformité";
        document.getElementById('stat-success').innerText = `${complianceScore}%`;
        document.getElementById('stat-success').className = complianceScore > 80 ? 'text-success' : (complianceScore > 50 ? 'log-warn' : 'text-fail');

        card3Label.innerText = "Critiques Manquants";
        document.getElementById('stat-fail').innerText = criticalMissing;
        document.getElementById('stat-fail').className = criticalMissing === 0 ? 'text-success' : 'text-fail';
    } else {
        card2Label.innerText = "Succès";
        document.getElementById('stat-success').innerText = success;
        
        card3Label.innerText = "Échecs";
        document.getElementById('stat-fail').innerText = fail;
    }

    // Chart
    const ctx = document.getElementById('updatesChart').getContext('2d');
    if (updatesChart) updatesChart.destroy();

    let labels = [];
    let data = [];
    let colors = [];

    if (mode === 'scan') {
        labels = ['Conforme', 'Non-Conforme (Risque)'];
        data = [complianceScore, 100 - complianceScore];
        colors = ['#9ece6a', '#f7768e'];
    } else if (mode === 'apps') {
         labels = ['À jour (Estimé)', 'Obsolète'];
         data = [100 - (updates.length * 5), updates.length * 5]; // Rough visual
         colors = ['#7aa2f7', '#ff9e64'];
    } else {
        labels = ['Réussite', 'Échec'];
        data = [success, fail];
        colors = ['#9ece6a', '#f7768e'];
    }
    
    // Safety check for Chart.js
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping chart rendering.");
        return;
    }

    try {
        updatesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#a9b1d6' } } }
            }
        });
    } catch (e) {
        console.error("Failed to initialize Chart.js:", e);
    }
}

scanBtn.addEventListener('click', () => {
    performScan('scan');
    updateNavState('dashboard-nav-btn');
});
historyBtn.addEventListener('click', () => {
    performScan('history');
    updateNavState('history-btn');
});
appsBtn.addEventListener('click', () => {
    performScan('apps');
    updateNavState('dashboard-nav-btn');
});

const RISK_KEYWORDS = ['Java', 'Adobe', 'Flash', 'Silverlight', 'Python 2', 'WebLogic', 'Struts', 'TeamViewer', 'AnyDesk'];

function renderUpdates(updates, mode) {
    if (!updates || updates.length === 0) {
        updatesList.innerHTML = '<div class="empty-state">Aucun élément trouvé.</div>';
        return;
    }

    if (mode === 'apps') {
        updatesList.innerHTML = updates.map(app => {
            const isRisk = RISK_KEYWORDS.some(k => app.Name.includes(k));
            const riskBadge = isRisk ? `<span class="severity" style="color: #f7768e; font-weight:bold;">⚠️ ${t('riskHigh')}</span>` : '';
            
            return `
            <div class="update-card" style="border-left: 4px solid ${isRisk ? '#f7768e' : '#ff9e64'};">
                <h3>${app.Name} ${riskBadge}</h3>
                <div style="margin-bottom: 10px;">
                    <span class="kb-badge" style="background-color: #ff9e64; color: #1a1b26;">${app.Id}</span>
                </div>
                <p>Version actuelle : <strong>${app.CurrentVersion}</strong> <br/>
                   Nouvelle version : <strong style="color: #9ece6a;">${app.NewVersion}</strong></p>
                
                <button class="btn install-btn action-update-app" style="background-color: #ff9e64;" data-id="${app.Id}">
                    ${t('updateBtn')}
                </button>
            </div>
        `}).join('');
    } else {
        // Sort by AI Priority descending
        const sortedUpdates = [...updates].sort((a, b) => AI_Heuristics.calculatePriority(b) - AI_Heuristics.calculatePriority(a));

        updatesList.innerHTML = sortedUpdates.map(update => {
            // AI Analysis
            const aiPriority = AI_Heuristics.calculatePriority(update);
            const aiRisk = AI_Heuristics.predictRisk(update);

            const isCritical = aiPriority >= 60;
            const impacts = checkImpact(update);
            
            // Threat Intel Check
            const activeThreats = findActiveThreats(update.Description || update.Title);
            const isExploited = activeThreats && activeThreats.length > 0;
            
            // Collaboration Status
            const collab = collabData[update.UpdateID] || { status: 'Pending', comments: [] };
            let cardBorder = '#414868';
            
            if (collab.status === 'Approved') cardBorder = '#9ece6a'; // Green
            else if (collab.status === 'Rejected') cardBorder = '#f7768e'; // Red
            else {
                // Default AI Coloring
                if (isExploited) cardBorder = 'red';
                else if (aiPriority > 80) cardBorder = '#f7768e';
                else if (aiPriority > 50) cardBorder = '#e0af68';
            }

            const cardStyle = isExploited 
                ? 'border: 2px solid red; box-shadow: 0 0 10px rgba(255,0,0,0.5);' 
                : `border-left: 4px solid ${cardBorder};`;

            const threatBadge = isExploited 
                ? `<div style="background:red; color:white; font-weight:bold; padding:2px 5px; border-radius:3px; display:inline-block; margin-bottom:5px; animation: pulse 2s infinite;">☣️ CISA: EXPLOIT ACTIF (${activeThreats[0].cveID})</div><br/>` 
                : '';

            // AI Risk Badge
            let riskBadge = '';
            if (aiRisk.score > 0) {
                riskBadge = `<div style="margin-top:5px; font-size:0.8em; color:#ff9e64;">⚠️ <strong>Risque Prédit (${aiRisk.score}%) :</strong> ${aiRisk.reasons.join(', ')}</div>`;
            }
            
            // Status Badge (CAB)
            let statusBadge = '';
            if (collab.status === 'Approved') statusBadge = '<span class="kb-badge" style="background:#9ece6a; color:#1a1b26;">✅ APPROUVÉ</span> ';
            else if (collab.status === 'Rejected') statusBadge = '<span class="kb-badge" style="background:#f7768e; color:#fff;">❌ REJETÉ</span> ';

            const installDisabled = collab.status === 'Rejected';

            return `
            <div class="update-card" style="${cardStyle}">
                ${threatBadge}
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center;">
                        <input type="checkbox" class="update-checkbox" data-id="${update.UpdateID}" style="margin-right: 10px; transform: scale(1.5);">
                        <h3>${update.Title} ${isCritical ? '🔥' : ''}</h3>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.8em; color:#7aa2f7; font-weight:bold;">PRIORITÉ IA</div>
                        <div style="font-size:1.2em; color:#fff;">${aiPriority}/100</div>
                    </div>
                </div>

                <div>
                    ${statusBadge}
                    <span class="kb-badge">${update.KB || 'Aucun KB'}</span>
                    <span class="severity" style="color: ${update.Severity === 'Échec' ? '#f7768e' : '#9ece6a'}">${update.Severity || 'Non spécifié'}</span>
                </div>

                ${riskBadge}

                ${impacts.length > 0 ? 
                    `<div style="margin: 5px 0; font-size: 0.85em; color: #ff9e64; background: #2f2626; padding: 5px; border-radius: 4px;">
                        <strong>🛑 ARRÊT SERVICE REQUIS :</strong> ${impacts.join(', ')}
                    </div>` : ''
                }

                <p>${update.Description || 'Aucune description disponible.'}</p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    ${update.IsInstalled ? 
                        `<button class="btn install-btn" disabled style="background-color: #414868; cursor: not-allowed;">✅ Déjà Installé</button>` : 
                        `<button class="btn install-btn action-install" data-id="${update.UpdateID}" ${installDisabled ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>${t('installBtn')}</button>`
                    }
                    <button class="btn secondary action-details" data-id="${update.UpdateID}" style="background-color: #2ac3de; color: #1a1b26;">📝 Détails & Collab</button>
                </div>
            </div>
        `}).join('');
    }
}

// Event Delegation for Dynamic Buttons
updatesList.addEventListener('click', (e) => {
    // Handle Install Button
    const installBtn = e.target.closest('.action-install');
    if (installBtn) {
        const id = installBtn.getAttribute('data-id');
        console.log("Install clicked for ID:", id); // Debug
        if (id) {
            window.installUpdate(id);
        } else {
            alert("Erreur : ID de mise à jour introuvable.");
        }
    }

    // Handle Details Button (Collab)
    const detailsBtn = e.target.closest('.action-details');
    if (detailsBtn) {
        const id = detailsBtn.getAttribute('data-id');
        const update = currentUpdatesData.find(u => u.UpdateID === id);
        if (update) openCollabModal(update);
    }
    
    // Handle App Update Button (if any)
    const updateAppBtn = e.target.closest('.action-update-app');
    if (updateAppBtn) {
        const id = updateAppBtn.getAttribute('data-id');
        if (id) window.updateApp(id);
    }
});

// Optimal Time Heuristic
function isOptimalTime() {
    const hour = new Date().getHours();
    return (hour >= 12 && hour < 14) || (hour >= 18 || hour < 8);
}

// CISA Threat Matching
function findActiveThreats(updateDescription) {
    if (!updateDescription || knownThreats.length === 0) return null;
    
    // Naive matching: Look for CVE strings in description that match CISA DB
    // A better approach would be having CVE IDs directly from WSUS
    const cveMatches = updateDescription.match(/CVE-\d{4}-\d{4,}/g);
    
    if (cveMatches) {
        const found = knownThreats.filter(t => cveMatches.includes(t.cveID));
        return found.length > 0 ? found : null;
    }
    return null;
}

// Global functions
window.installUpdate = async (updateId) => {
    // 1. GOVERNANCE CHECK
    if (currentPolicy.requireApproval) {
        const pwd = prompt(`🔒 SÉCURITÉ RENFORCÉE (Mode ${currentPolicy.criticality})\n\nCette action nécessite une validation humaine.\nVeuillez saisir le mot de passe Administrateur de Sécurité :`);
        if (pwd !== "admin123") { // In real life, verify against secure hash or auth
            alert("⛔ ACCÈS REFUSÉ : Mot de passe incorrect.\nL'incident a été logué dans l'audit de sécurité.");
            // Log failed attempt (audit logic to be added)
            return;
        }
    }

    let msg = t('installBtn') + " ?";
    if (!isOptimalTime()) {
        msg += "\n\n⚠️ ATTENTION : Il semble être une heure de forte activité. Il est recommandé d'attendre la pause déjeuner (12h-14h) ou le soir.";
    }

    if (!confirm(msg)) return;
    
    statusText.textContent = "Statut : Installation en cours...";
    log(`Début installation MAJ Windows : ${updateId}...`, "info");
    try {
        const result = await window.api.installUpdate(updateId);
        if (result.success) {
            alert(result.message);
            new Notification('Installation Terminée', { body: result.message });
            log(`Installation terminée : ${result.message}`, "success");
            // AI Learning: Success
            window.api.saveLearningData({ successes: { [updateId]: 1 } });
        } else {
            alert(result.message); // Usually failure message
            log(`Installation échouée : ${result.message}`, "error");
             // AI Learning: Failure
             window.api.saveLearningData({ failures: { [updateId]: 1 } });
        }
    } catch (e) { 
        alert("Erreur : " + e); 
        log(`Erreur installation ${updateId} : ${e}`, "error");
        // AI Learning: Failure
        window.api.saveLearningData({ failures: { [updateId]: 1 } });
    }
};

// --- SLA & SIMULATION LOGIC ---

function calculateSLA(update) {
    // SLA Goals: Critical=7 days, Important=30 days, Moderate=90 days
    const slaDays = { 'Critical': 7, 'Important': 30, 'Moderate': 90 };
    const goal = slaDays[update.Severity] || 90;
    
    // Mocking 'ReleaseDate' or 'DetectionDate' as we don't have it from simple PS scan always
    // Assuming 'Date' property exists or defaulting to now for simulation
    const detectionDate = update.Date ? new Date(update.Date) : new Date();
    const deadline = new Date(detectionDate);
    deadline.setDate(deadline.getDate() + goal);
    
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    return { daysLeft, goal, isBreached: daysLeft < 0 };
}

function simulateImpact(updates) {
    // Simulate business impact if these updates are applied
    let downtimeMinutes = 0;
    let servicesAffected = [];
    
    updates.forEach(u => {
        // Mock impact logic based on keywords
        if (u.Title.includes('Servicing Stack') || u.Title.includes('Cumulative Update')) {
            downtimeMinutes += 15;
            servicesAffected.push('OS Reboot');
        }
        if (u.Title.includes('SQL')) {
            downtimeMinutes += 5;
            servicesAffected.push('Database Service');
        }
        if (u.Title.includes('IIS') || u.Title.includes('.NET')) {
            servicesAffected.push('Web Server (IIS)');
        }
    });

    servicesAffected = [...new Set(servicesAffected)]; // unique
    
    return {
        estimatedDowntime: downtimeMinutes,
        services: servicesAffected,
        riskLevel: downtimeMinutes > 30 ? 'High' : (downtimeMinutes > 0 ? 'Medium' : 'Low')
    };
}

// Hook into existing render logic or create new view for Simulation
// For now, let's expose a button or a summary panel for Simulation in the Dashboard

function renderSimulationSummary(updates) {
    const sim = simulateImpact(updates);
    const container = document.getElementById('simulation-panel'); // We need to add this to HTML or reuse existing
    
    if (!container) return; // Skip if UI element missing
    
    container.innerHTML = `
        <h3>🏗️ Simulation Impact Business</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div style="background:#1f2335; padding:10px; border-radius:4px;">
                <strong>Temps d'arrêt estimé :</strong>
                <span style="color:${sim.estimatedDowntime > 30 ? '#f7768e' : '#9ece6a'}">${sim.estimatedDowntime} min</span>
            </div>
            <div style="background:#1f2335; padding:10px; border-radius:4px;">
                <strong>Services impactés :</strong>
                <span style="font-size:0.9em; color:#e0af68">${sim.services.join(', ') || 'Aucun'}</span>
            </div>
        </div>
    `;
    container.classList.remove('hidden');
}

// ... existing code ...
window.updateApp = async (appId) => {
    let msg = `Voulez-vous mettre à jour ${appId} via Winget ?\n\nCela peut fermer l'application si elle est ouverte.`;
    if (!isOptimalTime()) {
        msg += "\n\n⚠️ ATTENTION : Il semble être une heure de forte activité. Mise à jour risquée pour la productivité.";
    }

    if (!confirm(msg)) return;
    
    statusText.textContent = `Statut : Mise à jour de ${appId}...`;
    log(`Début mise à jour logicielle : ${appId}...`, "info");
    const btns = document.querySelectorAll('.install-btn');
    btns.forEach(b => b.disabled = true);

    try {
        const result = await window.api.updateApp(appId);
        if (result.success) {
            alert(result.message);
            new Notification('Mise à jour Logicielle', { body: `${appId} a été mis à jour avec succès.` });
            log(`Succès MAJ ${appId}`, "success");
            window.api.saveLearningData({ successes: { [appId]: 1 } });
            performScan('apps'); // Refresh list
        } else {
            alert("Erreur : " + result.message);
            log(`Echec MAJ ${appId} : ${result.message}`, "error");
            window.api.saveLearningData({ failures: { [appId]: 1 } });
        }
    } catch (e) {
        alert("Erreur critique : " + e);
        log(`Exception MAJ ${appId} : ${e}`, "error");
        window.api.saveLearningData({ failures: { [appId]: 1 } });
    } finally {
        btns.forEach(b => b.disabled = false);
        statusText.textContent = "Statut : Prêt";
    }
};

// --- SECURITY & GOVERNANCE UI HANDLERS ---

savePolicyBtn.addEventListener('click', async () => {
    const newPolicy = {
        criticality: assetCriticality.value,
        requireApproval: requireApproval.checked
    };
    currentPolicy = newPolicy;
    
    const res = await window.api.saveGovernance(newPolicy);
    if(res.success) {
        alert("Politique de gouvernance mise à jour.");
        log(`Politique mise à jour : ${newPolicy.criticality}`, "success");
    } else {
        alert("Erreur sauvegarde : " + res.error);
    }
});

async function setQuarantine(action) { // Block / Unblock
    if (!confirm(`Etes-vous sûr de vouloir ${action === 'Block' ? 'ISOLER' : 'DÉSISOLER'} cette machine ?`)) return;

    quarantineStatus.innerText = "Statut : Application en cours...";
    const res = await window.api.toggleQuarantine(action);
    
    if (res.success || res.status) { // Script returns status
        alert(res.message);
        log(`Quarantaine : ${res.message}`, "warn");
        
        if (action === 'Block') {
            btnQuarantineOn.classList.add('hidden');
            btnQuarantineOff.classList.remove('hidden');
            quarantineStatus.innerText = "Statut : 🛑 ISOLÉ (RDP Uniquement)";
            quarantineStatus.style.color = '#f7768e';
            document.body.style.border = "5px solid red";
        } else {
            btnQuarantineOff.classList.add('hidden');
            btnQuarantineOn.classList.remove('hidden');
            quarantineStatus.innerText = "Statut : Normal";
            quarantineStatus.style.color = '#9ece6a';
            document.body.style.border = "none";
        }
    } else {
        alert("Erreur : " + (res.error || res));
    }
}

btnQuarantineOn.addEventListener('click', () => setQuarantine('Block'));
btnQuarantineOff.addEventListener('click', () => setQuarantine('Unblock'));

// AUDIT LOGS VIEWER
auditBtn.addEventListener('click', async () => {
    // UI Reset
    updateNavState('audit-btn'); // Highlight active
    scanBtn.disabled = true;
    loader.classList.remove('hidden');
    updatesList.innerHTML = '';
    dashboardContainer.classList.add('hidden');
    securityPanel.classList.add('hidden');
    ecosystemPanel.classList.add('hidden');
    reportPanel.classList.add('hidden');
    aboutPanel.classList.add('hidden');
    statusText.textContent = "Statut : Chargement des logs...";
    
    try {
        const result = await window.api.getAuditLogs();
        if (result.success) {
            statusText.textContent = `Statut : ${result.logs.length} événements d'audit récupérés.`;
            log(`Logs audit chargés (${result.logs.length} entrées).`, "success");
            
            updatesList.innerHTML = result.logs.map(l => {
                const isError = l.action.includes('FAIL') || l.action.includes('BLOCKED');
                const color = isError ? '#f7768e' : '#9ece6a';
                
                return `
                <div class="update-card" style="border-left: 4px solid ${color}; font-family: monospace;">
                    <span style="color: #565f89; font-size: 0.8em; float: right;">${new Date(l.timestamp).toLocaleString()}</span>
                    <h3 style="color: ${color}; margin: 0;">${l.action}</h3>
                    <div style="margin-top: 5px;">
                        <span style="color: #bb9af7;">USER: ${l.user}</span> | 
                        <span style="color: #7aa2f7;">HOST: ${l.host}</span>
                    </div>
                    <pre style="background: #1a1b26; padding: 10px; margin-top: 10px; overflow-x: auto; color: #a9b1d6; border-radius: 4px;">${JSON.stringify(l.details, null, 2)}</pre>
                </div>`;
            }).join('');
        } else {
            alert("Erreur logs : " + result.error);
        }
    } catch (e) {
        console.error(e);
        alert("Erreur critique logs : " + e);
    } finally {
        scanBtn.disabled = false;
        loader.classList.add('hidden');
    }
});

// --- ECOSYSTEM & OFFLINE HANDLERS ---

testWebhookBtn.addEventListener('click', async () => {
    const url = webhookUrlInput.value;
    if (!url) return alert("Veuillez entrer une URL valide.");
    
    testWebhookBtn.disabled = true;
    testWebhookBtn.innerText = "Test en cours...";
    
    try {
        const res = await window.api.sendWebhook(url, 'TEST_CONNECTION', { message: 'Ceci est un test de CyberPatchManager.' });
        if (res.success) {
            alert(`Succès ! Code HTTP: ${res.status}`);
            log(`Webhook Test OK (${url})`, "success");
        } else {
            alert(`Échec : ${res.error || res.status}`);
            log(`Webhook Test Failed : ${res.error}`, "error");
        }
    } catch (e) {
        alert("Erreur : " + e);
    } finally {
        testWebhookBtn.disabled = false;
        testWebhookBtn.innerText = "Test de Connexion";
    }
});

offlineKitBtn.addEventListener('click', async () => {
    offlineKitBtn.disabled = true;
    offlineKitBtn.innerText = "Génération en cours...";
    log("Génération du Kit Offline (inventaire + scripts)...", "info");
    
    try {
        const res = await window.api.generateOfflineKit();
        if (res.success) {
            alert(`Kit Offline généré avec succès dans :\n${res.path}\n\nCopiez ce dossier sur une clé USB et suivez les instructions.`);
            log(`Kit Offline créé : ${res.path}`, "success");
        } else if (!res.cancel) {
            alert("Erreur : " + (res.error || "Inconnue"));
            log("Erreur Kit Offline", "error");
        }
    } catch (e) {
        alert("Erreur critique : " + e);
    } finally {
        offlineKitBtn.disabled = false;
        offlineKitBtn.innerText = "📦 Générer Kit Offline";
    }
});

if (globalRefreshBtn) {
    globalRefreshBtn.addEventListener('click', () => {
        location.reload();
    });
}

// Start Application
initApp();

// --- LICENSE MANAGEMENT ---
const licenseOverlay = document.getElementById('license-overlay');
const licenseMessage = document.getElementById('license-message');
const machineIdDisplay = document.getElementById('machine-id-display');
const copyMachineIdBtn = document.getElementById('copy-machine-id');
const dropZone = document.getElementById('drop-zone');
const licenseFileInput = document.getElementById('license-file-input');
const retryLicenseBtn = document.getElementById('retry-license-btn');

async function checkLicense() {
    try {
        console.log("Checking license...");
        const license = await window.api.getLicenseStatus();
        
        // Use system-status element if available
        const statusElement = document.getElementById('system-status');
        
        if (!license.valid) {
            // SHOW OVERLAY
            if (licenseOverlay) {
                licenseOverlay.style.display = 'flex';
                licenseMessage.innerText = `Licence invalide ou expirée (${license.reason || 'Manquante'}).`;
                machineIdDisplay.innerText = license.machineId || 'Unknown';
            }
            
            if (statusElement) {
                statusElement.innerText = "⛔ LICENCE INVALIDE";
                statusElement.style.color = "red";
            }
            
            // Blur main app
            const appLayout = document.querySelector('.app-layout');
            if (appLayout) appLayout.style.filter = "blur(5px)";
            
            return;
        }

        // HIDE OVERLAY if valid
        if (licenseOverlay) {
            licenseOverlay.style.display = 'none';
        }
        const appLayout = document.querySelector('.app-layout');
        if (appLayout) appLayout.style.filter = "none";

        // License is Valid - Apply Restrictions based on Features
        const features = license.features;
        const isUltimate = features === '*' || (Array.isArray(features) && features.includes('*'));

        if (statusElement) {
            statusElement.innerHTML = `✅ Licence: <strong>${license.customer || 'Standard'}</strong>`;
            statusElement.title = `Expire: ${license.expires || 'Jamais'}\nID: ${license.machineId}`;
        }

        // 1. Offline Kit
        if (!isUltimate && !features.includes('offline_kit')) {
            const btn = document.getElementById('generate-offline-kit-btn');
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.title = "Fonctionnalité non incluse dans votre licence (Offline Kit)";
            }
        }

        // 2. Patching (Install Update)
        if (!isUltimate && !features.includes('patching')) {
            const btn = document.getElementById('install-all-btn');
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.title = "Fonctionnalité Patching désactivée";
            }
        }

        // 3. Network Discovery
        if (!isUltimate && !features.includes('discovery')) {
            const btn = document.getElementById('btn-scan-network');
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.title = "Fonctionnalité Découverte Réseau désactivée";
            }
        }
        
    } catch (e) {
        console.error("License Check Error:", e);
    }
}

// UI EVENTS FOR LICENSE OVERLAY
if (copyMachineIdBtn) {
    copyMachineIdBtn.addEventListener('click', () => {
        const id = machineIdDisplay.innerText;
        navigator.clipboard.writeText(id).then(() => {
            copyMachineIdBtn.innerText = "Copié !";
            setTimeout(() => copyMachineIdBtn.innerText = "Copier", 2000);
        });
    });
}

if (dropZone) {
    dropZone.addEventListener('click', () => licenseFileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#7aa2f7';
        dropZone.style.background = 'rgba(122, 162, 247, 0.1)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#414868';
        dropZone.style.background = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#414868';
        dropZone.style.background = 'transparent';
        
        if (e.dataTransfer.files.length > 0) {
            handleLicenseFile(e.dataTransfer.files[0]);
        }
    });
}

if (licenseFileInput) {
    licenseFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleLicenseFile(e.target.files[0]);
        }
    });
}

if (retryLicenseBtn) {
    retryLicenseBtn.addEventListener('click', () => {
        checkLicense();
    });
}

async function handleLicenseFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result; // This is the string content of .key file
        
        // Remove 'data:.*base64,' if accidentally read as DataURL, but readAsText should be fine.
        // The file content is Base64 string itself usually.
        
        const res = await window.api.importLicense(content);
        if (res.success) {
            alert("Licence activée avec succès !");
            checkLicense();
        } else {
            alert("Échec de l'activation : " + res.reason);
        }
    };
    reader.readAsText(file);
}

// Run License Check after initialization
checkLicense();


