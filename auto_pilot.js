const { ipcMain } = require('electron');

class AutoPilot {
    constructor(aiAdvisor, networkManager, eventBus) {
        this.aiAdvisor = aiAdvisor;
        this.networkManager = networkManager;
        this.eventBus = eventBus; // To trigger scans/installs via main.js logic
        this.isRunning = false;
        this.config = {
            checkInterval: 4 * 60 * 60 * 1000, // 4 Hours
            confidenceThreshold: 0.85,
            autoMode: false
        };
        
        this.timer = null;
    }

    start() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.runCycle(), this.config.checkInterval);
        console.log("AutoPilot: Engine Started");
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        console.log("AutoPilot: Engine Stopped");
    }

    toggleAutoMode(enabled) {
        this.config.autoMode = enabled;
        console.log(`AutoPilot: Autonomous Mode set to ${enabled}`);
    }

    async runCycle() {
        if (!this.config.autoMode) return;
        if (this.isRunning) return;
        
        console.log("AutoPilot: Starting Autonomous Cycle...");
        this.isRunning = true;

        try {
            // 1. Network Check
            if (!this.networkManager.isOnline) {
                console.log("AutoPilot: Offline. Skipping cycle.");
                return;
            }

            // 2. Scan (Trigger via EventBus/Callback provided by main)
            const updates = await this.eventBus.scanUpdates();
            if (!updates || updates.length === 0) {
                console.log("AutoPilot: No updates found.");
                return;
            }

            console.log(`AutoPilot: Found ${updates.length} candidates.`);

            // 3. Evaluate Each
            for (const update of updates) {
                const systemHealth = await this.eventBus.checkHealth();
                const stability = await this.eventBus.getStability();
                const analysis = this.aiAdvisor.analyzeUpdate(update, systemHealth, stability);

                console.log(`AutoPilot: Analyzing [${update.Title}] -> ${analysis.action} (${analysis.confidence})`);

                if (analysis.action === 'INSTALL' && analysis.confidence >= this.config.confidenceThreshold) {
                    console.log(`AutoPilot: 🚀 EXECUTING AUTONOMOUS PATCH for ${update.Title}`);
                    
                    // 4. Execute
                    const result = await this.eventBus.installUpdate(update.UpdateID, update.Title);
                    
                    // 5. Learn (The installUpdateCore already calls recordOutcome, but we do it here too if needed? No, let's avoid double counting)
                    // Actually, eventBus.installUpdate calls installUpdateCore which already calls recordOutcome.
                    // So we can remove it from here to avoid duplication.
                    
                    console.log(`AutoPilot: Outcome recorded via install core`);
                } else {
                    console.log(`AutoPilot: Deferring ${update.Title} (Confidence too low or Action != INSTALL)`);
                }
            }

        } catch (e) {
            console.error("AutoPilot Cycle Error:", e);
        } finally {
            this.isRunning = false;
        }
    }
}

module.exports = AutoPilot;
