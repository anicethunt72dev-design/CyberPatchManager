const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    scanUpdates: () => ipcRenderer.invoke('scan-updates'),
    scanHistory: () => ipcRenderer.invoke('scan-history'),
    scanApps: () => ipcRenderer.invoke('scan-apps'),
    installUpdate: (updateId) => ipcRenderer.invoke('install-update', updateId),
    updateApp: (appId) => ipcRenderer.invoke('update-app', appId),
    configureScheduler: (action) => ipcRenderer.invoke('configure-scheduler', action),
    saveReport: (data, filename) => ipcRenderer.invoke('save-report', { data, filename }),
    exportPdf: () => ipcRenderer.invoke('export-pdf'),
    checkAdmin: () => ipcRenderer.invoke('check-admin'),
    scanServices: () => ipcRenderer.invoke('scan-services'),
    // Governance & Security
    getGovernance: () => ipcRenderer.invoke('get-governance'),
    saveGovernance: (policy) => ipcRenderer.invoke('save-governance', policy),
    toggleQuarantine: (action) => ipcRenderer.invoke('toggle-quarantine', action),
    checkThreats: () => ipcRenderer.invoke('check-threats'),
    getAuditLogs: () => ipcRenderer.invoke('get-audit-logs'),
    // Ecosystem & Offline
    sendWebhook: (url, eventType, data) => ipcRenderer.invoke('send-webhook', { url, eventType, data }),
    generateOfflineKit: () => ipcRenderer.invoke('generate-offline-kit'),
    // Collaboration
    getCollabData: () => ipcRenderer.invoke('get-collab-data'),
    addComment: (updateId, text) => ipcRenderer.invoke('add-comment', { updateId, text }),
    setApprovalStatus: (updateId, status) => ipcRenderer.invoke('set-approval-status', { updateId, status }),
    reportIncident: (updateId, details) => ipcRenderer.invoke('report-incident', { updateId, details }),
    // AI Learning
    getLearningData: () => ipcRenderer.invoke('get-learning-data'),
    saveLearningData: (data) => ipcRenderer.invoke('save-learning-data', data),
    // Live Ops & Discovery
    scanNetwork: () => ipcRenderer.invoke('scan-network'),
    auditRuntime: () => ipcRenderer.invoke('audit-runtime'),
    triggerAutoHeal: (issueType) => ipcRenderer.invoke('trigger-auto-heal', issueType),
    // Advanced Security & Continuity
    monitorBehavior: () => ipcRenderer.invoke('monitor-behavior'),
    checkIntegrity: () => ipcRenderer.invoke('check-integrity'),
    setIsolation: (enable) => ipcRenderer.invoke('set-isolation', enable),
    // Lifecycle & Crisis
    checkEolStatus: () => ipcRenderer.invoke('check-eol-status'),
    emergencyHarden: (enable) => ipcRenderer.invoke('emergency-harden', enable),
    getBlacklist: () => ipcRenderer.invoke('get-blacklist'),
    toggleBlacklist: (kbId) => ipcRenderer.invoke('toggle-blacklist', kbId),
    // License
    getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
    importLicense: (content) => ipcRenderer.invoke('import-license', content)
});
