const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const dns = require('dns');
const os = require('os');
const EventEmitter = require('events');

class NetworkManager extends EventEmitter {
    constructor() {
        super();
        this.queuePath = path.join(app.getPath('userData'), 'offline_queue.json');
        this.isOnline = true;
        this.networkType = 'UNKNOWN'; // LAN, WAN
        this.proxyConfig = null;

        // Start monitoring
        this.checkConnectivity();
        setInterval(() => this.checkConnectivity(), 30000); // Check every 30s
        
        // Initial detection
        this.detectNetworkType();
        this.detectProxy();
    }

    checkConnectivity() {
        dns.lookup('google.com', (err) => {
            const wasOnline = this.isOnline;
            this.isOnline = !err;
            
            if (this.isOnline && !wasOnline) {
                console.log('Network: Connection Restored');
                this.processQueue();
                this.emit('status-change', true);
            } else if (!this.isOnline && wasOnline) {
                console.log('Network: Connection Lost');
                this.emit('status-change', false);
            }
        });
    }

    detectNetworkType() {
        const interfaces = os.networkInterfaces();
        let type = 'WAN'; 
        
        // Simple heuristic: check for private IP ranges
        Object.keys(interfaces).forEach((ifaceName) => {
            interfaces[ifaceName].forEach((iface) => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    const ip = iface.address;
                    if (
                        ip.startsWith('10.') || 
                        ip.startsWith('192.168.') || 
                        (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)
                    ) {
                        type = 'LAN';
                    }
                }
            });
        });
        this.networkType = type;
        console.log(`Network Type Detected: ${type}`);
        return type;
    }

    async detectProxy() {
        if (process.platform === 'win32') {
            const command = 'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer';
            const ps = spawn('cmd.exe', ['/c', command]);
            
            let output = '';
            ps.stdout.on('data', (d) => output += d.toString());
            
            ps.on('close', (code) => {
                if (code === 0 && output.includes('ProxyServer')) {
                    const match = output.match(/ProxyServer\s+REG_SZ\s+(.+)/);
                    if (match && match[1]) {
                        this.proxyConfig = match[1].trim();
                        console.log(`Proxy Detected: ${this.proxyConfig}`);
                    }
                } else {
                    this.proxyConfig = null;
                }
            });
        }
    }

    // --- Offline Queue Management ---

    queueAction(action, data) {
        let queue = [];
        try {
            if (fs.existsSync(this.queuePath)) {
                queue = JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
            }
        } catch (e) {
            queue = [];
        }

        queue.push({
            timestamp: new Date().toISOString(),
            action,
            data
        });

        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        console.log(`Network: Action queued (${action})`);
    }

    async processQueue() {
        if (!fs.existsSync(this.queuePath)) return;

        let queue = [];
        try {
            queue = JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
        } catch (e) {
            return;
        }

        if (queue.length === 0) return;

        console.log(`Network: Processing ${queue.length} queued actions...`);
        
        const remaining = [];
        for (const item of queue) {
            try {
                console.log(`Network: Replaying ${item.action}`);
                this.emit('replay-action', item.action, item.data);
            } catch (e) {
                console.error(`Failed to replay ${item.action}`, e);
                remaining.push(item);
            }
        }

        if (remaining.length > 0) {
            fs.writeFileSync(this.queuePath, JSON.stringify(remaining, null, 2));
        } else {
            try { fs.unlinkSync(this.queuePath); } catch(e) {}
        }
    }

    getStatus() {
        return {
            online: this.isOnline,
            type: this.networkType,
            proxy: this.proxyConfig
        };
    }

    getRequestConfig() {
        // Dynamic Adaptation Logic
        if (this.networkType === 'LAN') {
            return {
                timeout: 5000,
                retries: 2,
                concurrency: 5,
                mode: 'fast'
            };
        } else {
            // WAN or Unknown - assume slower/less reliable
            return {
                timeout: 15000,
                retries: 5,
                concurrency: 2,
                mode: 'resilient'
            };
        }
    }
}

module.exports = NetworkManager;
