import * as vscode from 'vscode';
import WebSocket = require('ws');
import * as http from 'http';

export class ZombieDanceManager {
    private ws: WebSocket | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private outputChannel: vscode.OutputChannel;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;

    constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'zombie-dance.connectServer';
        this.outputChannel = vscode.window.createOutputChannel('Zombie Dance AI');
        
        this.updateStatus('Disconnected', '$(debug-disconnect)');
        this.statusBarItem.show();
    }

    async connect(): Promise<void> {
        const config = vscode.workspace.getConfiguration('zombie-dance');
        const serverUrl = config.get<string>('serverUrl') || 'http://localhost:8000';
        
        try {
            // Test HTTP connection first
            await this.testHttpConnection(serverUrl);
            
            // Connect WebSocket
            const wsUrl = serverUrl.replace('http', 'ws') + '/ws';
            this.ws = new WebSocket(wsUrl);
            
            if (this.ws) {
                this.ws.on('open', () => {
                    this.outputChannel.appendLine('✅ Connected to Zombie Dance server');
                    this.updateStatus('Connected', '$(plug)');
                    vscode.commands.executeCommand('setContext', 'zombie-dance.connected', true);
                    this.reconnectAttempts = 0;
                    
                    vscode.window.showInformationMessage('Zombie Dance AI connected successfully!');
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(message);
                    } catch (error) {
                        this.outputChannel.appendLine(`❌ Failed to parse message: ${error}`);
                    }
                });

                this.ws.on('close', () => {
                    this.outputChannel.appendLine('🔌 Disconnected from server');
                    this.updateStatus('Disconnected', '$(debug-disconnect)');
                    vscode.commands.executeCommand('setContext', 'zombie-dance.connected', false);
                    
                    // Auto-reconnect
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        setTimeout(() => {
                            this.outputChannel.appendLine(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                            this.connect();
                        }, this.reconnectDelay * this.reconnectAttempts);
                    }
                });

                this.ws.on('error', (error: Error) => {
                    this.outputChannel.appendLine(`❌ WebSocket error: ${error.message}`);
                    vscode.window.showErrorMessage(`Zombie Dance connection failed: ${error.message}`);
                });
            }

        } catch (error) {
            this.outputChannel.appendLine(`❌ Connection failed: ${error}`);
            vscode.window.showErrorMessage(`Failed to connect to Zombie Dance server: ${error}`);
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.updateStatus('Disconnected', '$(debug-disconnect)');
        vscode.commands.executeCommand('setContext', 'zombie-dance.connected', false);
        vscode.window.showInformationMessage('Zombie Dance AI disconnected');
    }

    private async testHttpConnection(serverUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = new URL(serverUrl + '/health');
            const req = http.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'GET',
                timeout: 5000
            }, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Server returned status ${res.statusCode}`));
                }
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Connection timeout'));
            });

            req.end();
        });
    }

    private handleMessage(message: any): void {
        switch (message.type) {
            case 'agent_response':
                this.outputChannel.appendLine(`🤖 Agent: ${message.data.response}`);
                break;
            case 'server_status':
                this.outputChannel.appendLine(`📊 Server: ${message.data.status}`);
                break;
            default:
                this.outputChannel.appendLine(`📨 Unknown message type: ${message.type}`);
        }
    }

    private updateStatus(text: string, icon: string): void {
        this.statusBarItem.text = `${icon} Zombie Dance: ${text}`;
        this.statusBarItem.tooltip = `Zombie Dance AI - ${text}`;
        this.statusBarItem.command = this.ws ? 'zombie-dance.disconnectServer' : 'zombie-dance.connectServer';
    }

    dispose(): void {
        this.disconnect();
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
    }
}
