const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class AiAdvisor {
    constructor() {
        this.memoryPath = path.join(app.getPath('userData'), 'ai_memory.json');
        this.memory = this.loadMemory();
    }

    loadMemory() {
        try {
            if (fs.existsSync(this.memoryPath)) {
                return JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
            }
        } catch (e) {
            console.error("AI: Memory load failed", e);
        }
        return { 
            decisions: [], 
            stats: { failures: {}, successes: {} },
            confidenceScore: 1.0 
        };
    }

    saveMemory() {
        fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2));
    }

    // --- Core AI Logic ---

    analyzeUpdate(update, systemHealth, stabilityScore = 100) {
        const result = {
            action: 'WAIT',
            confidence: 0.5,
            reasoning: []
        };

        // 1. Analyze Severity
        if (update.Severity === 'Critical' || update.Severity === 'Important') {
            result.reasoning.push("Severity is Critical/Important.");
            result.confidence += 0.3;
        }

        // 2. Analyze System Health
        if (systemHealth) {
            if (systemHealth.CPU < 50 && systemHealth.FreeMemMB > 1000) {
                result.reasoning.push("System resources are ample.");
                result.confidence += 0.1;
                result.action = 'INSTALL';
            } else {
                result.reasoning.push("System load is high.");
                result.confidence -= 0.2;
                result.action = 'DEFER';
            }
        }

        // 3. Stability Score Integration
        if (stabilityScore < 70) {
            result.reasoning.push(`System stability score is low (${stabilityScore}%).`);
            result.confidence -= 0.3;
            if (result.action === 'INSTALL') result.action = 'DEFER';
        }

        // 4. Historical Context (Memory)
        const failCount = this.memory.stats.failures[update.UpdateID || update.Title] || 0;

        if (failCount > 0) {
            result.reasoning.push(`This update or title failed ${failCount} times in the past.`);
            result.confidence -= 0.4;
            result.action = 'MANUAL_REVIEW';
        }

        // 5. Time Context
        const day = new Date().getDay();
        if (day === 5 && update.Severity !== 'Critical') { // Friday
             result.reasoning.push("It is Friday (Read-only Friday principle).");
             result.action = 'DEFER';
        }

        return result;
    }

    validateHumanAction(action, context) {
        // Human Inconsistency Detection
        const analysis = { valid: true, warnings: [] };

        // Example: Installing beta software on Production
        if (context.environment === 'PRODUCTION' && context.updateType === 'BETA') {
            analysis.valid = false;
            analysis.warnings.push("Detected attempt to install BETA software on PRODUCTION environment.");
        }

        // Example: Rebooting during business hours
        const hour = new Date().getHours();
        if (action === 'REBOOT' && (hour >= 9 && hour <= 17)) {
            analysis.warnings.push("Reboot requested during business hours (9-17h).");
        }

        return analysis;
    }

    suggestPolicyAdjustments(securityLogs) {
        // Analyze logs to suggest policy changes
        const suggestions = [];
        
        if (!securityLogs || !Array.isArray(securityLogs)) return suggestions;

        const recentAttacks = securityLogs.filter(l => l.action === 'THREAT_DETECTED' || l.action === 'SECURITY_ALERT').length;
        
        if (recentAttacks > 5) {
            suggestions.push({
                type: 'TIGHTEN_SECURITY',
                reason: `High threat activity detected (${recentAttacks} events). Recommend enabling 'Strict Mode'.`
            });
        }

        const recentFailures = this.memory.decisions.filter(d => 
            d.outcome === 'FAILURE' && 
            (new Date() - new Date(d.timestamp)) < 7 * 24 * 60 * 60 * 1000
        ).length;

        if (recentFailures > 3) {
            suggestions.push({
                type: 'DELAY_PATCHING',
                reason: `Detected ${recentFailures} failures this week. Recommend increasing 'Staging Period' for updates.`
            });
        }

        return suggestions;
    }

    recordOutcome(decisionId, outcome, title = null) {
        // Update decision history to improve future recommendations
        this.memory.decisions.push({
            id: decisionId,
            title: title,
            timestamp: new Date().toISOString(),
            outcome
        });
        
        // Update stats summary
        const key = decisionId || title;
        if (outcome === 'SUCCESS') {
            this.memory.stats.successes[key] = (this.memory.stats.successes[key] || 0) + 1;
        } else {
            this.memory.stats.failures[key] = (this.memory.stats.failures[key] || 0) + 1;
        }

        // Trim memory
        if (this.memory.decisions.length > 1000) {
            this.memory.decisions.shift();
        }

        this.saveMemory();
    }
}

module.exports = AiAdvisor;
