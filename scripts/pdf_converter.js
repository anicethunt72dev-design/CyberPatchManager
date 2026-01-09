const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const files = [
    'README.md',
    'LICENSE',
    'CERTIFICAT_AUTHENTICITE.txt'
];

app.on('ready', async () => {
    console.log("Starting PDF conversion...");
    
    for (const fileName of files) {
        const inputPath = path.join(rootDir, fileName);
        const outputPath = path.join(rootDir, path.basename(fileName, path.extname(fileName)) + '.pdf');

        if (!fs.existsSync(inputPath)) {
            console.log(`Skipping ${fileName}: File not found.`);
            continue;
        }

        console.log(`Processing ${fileName}...`);
        
        try {
            const rawContent = fs.readFileSync(inputPath, 'utf8');
            let htmlContent = '';

            // Basic formatting
            if (fileName.endsWith('.md')) {
                 htmlContent = `
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                            h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                            h2 { color: #34495e; margin-top: 20px; border-bottom: 1px solid #eee; }
                            h3 { color: #34495e; margin-top: 15px; }
                            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: Consolas, monospace; font-size: 0.9em; }
                            pre { background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: Consolas, monospace; }
                            ul { margin-bottom: 15px; }
                            li { margin-bottom: 5px; }
                            strong { font-weight: bold; color: #000; }
                        </style>
                    </head>
                    <body>
                        ${rawContent
                            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/`([^`]+)`/g, '<code>$1</code>')
                            .replace(/```bash([\s\S]*?)```/g, '<pre>$1</pre>')
                            .replace(/^- (.*$)/gm, '<li>$1</li>')
                            .replace(/\n/g, '<br>')
                        }
                    </body>
                    </html>`;
            } else {
                // Plain text for License and Cert
                htmlContent = `
                    <html>
                    <head><meta charset="UTF-8"></head>
                    <body style="font-family: 'Consolas', 'Courier New', monospace; padding: 40px; white-space: pre-wrap; font-size: 12px; line-height: 1.4;">
                        ${rawContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </body>
                    </html>
                `;
            }

            const win = new BrowserWindow({ 
                show: false,
                width: 1024, 
                height: 768,
                webPreferences: { offscreen: true }
            });

            await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
            
            // Wait a bit for render
            await new Promise(r => setTimeout(r, 500));

            const pdfData = await win.webContents.printToPDF({
                printBackground: true,
                pageSize: 'A4',
                margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } 
            });

            fs.writeFileSync(outputPath, pdfData);
            console.log(`Success: Generated ${path.basename(outputPath)}`);
            
            win.close();

        } catch (err) {
            console.error(`Error converting ${fileName}:`, err);
        }
    }

    console.log("All conversions finished.");
    app.quit();
});
