const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ObservabilityManager {
    constructor() {
        // We use the existing audit ledger path
        this.logPath = path.join(app.getPath('userData'), 'secure_audit_ledger.json');
    }

    getChain() {
        try {
            if (!fs.existsSync(this.logPath)) return [];
            return JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
        } catch (e) {
            console.error("Obs: Failed to read ledger", e);
            return [];
        }
    }

    getTimeline(limit = 50) {
        const chain = this.getChain();
        // Sort descending by date
        return chain.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
    }

    calculateStabilityScore() {
        const chain = this.getChain();
        if (chain.length === 0) return 100;

        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

        // Filter last 24h
        const recent = chain.filter(entry => new Date(entry.timestamp) > oneDayAgo);
        
        if (recent.length === 0) return 100;

        let errorCount = 0;
        let weightedActions = 0;

        recent.forEach(entry => {
            weightedActions++;
            // Simple heuristic for errors based on action names or details
            if (entry.action.includes('FAIL') || 
                entry.action.includes('ERROR') || 
                entry.action.includes('DENIED') ||
                entry.action.includes('BLOCKED')) {
                errorCount++;
            }
        });

        if (weightedActions === 0) return 100;

        const failureRate = errorCount / weightedActions;
        const score = Math.max(0, 100 - (failureRate * 100)); // Simple linear penalty

        return Math.round(score);
    }

    getIncidentReplay(incidentId) {
        // Find the incident
        const chain = this.getChain();
        const index = chain.findIndex(e => e.hash === incidentId || e.action === incidentId);
        
        if (index === -1) return [];

        // Return context: 5 events before and 5 after
        const start = Math.max(0, index - 5);
        const end = Math.min(chain.length, index + 6);
        
        return chain.slice(start, end);
    }

    generateHeatmapData() {
        const chain = this.getChain();
        const heatmap = {}; // { hour: count }

        chain.forEach(entry => {
            const date = new Date(entry.timestamp);
            const key = `${date.getHours()}:00`;
            heatmap[key] = (heatmap[key] || 0) + 1;
        });

        return heatmap;
    }
}

module.exports = ObservabilityManager;
