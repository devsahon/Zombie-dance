import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/logger';

const router = express.Router();
const logger = new Logger();
const execAsync = promisify(exec);

// Execute command
router.post('/execute', async (req, res) => {
    try {
        const { cmd } = req.body;

        if (!cmd || typeof cmd !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Command is required and must be a string'
            });
        }

        // Security check - only allow safe commands
        const allowedCommands = [
            'ls', 'dir', 'pwd', 'cd', 'mkdir', 'rmdir', 'touch', 'echo',
            'cat', 'type', 'head', 'tail', 'grep', 'find', 'which',
            'ps', 'top', 'df', 'du', 'free', 'uname', 'whoami',
            'git', 'npm', 'node', 'python', 'pip'
        ];

        const commandParts = cmd.trim().split(' ');
        const baseCommand = commandParts[0].toLowerCase();

        if (!allowedCommands.includes(baseCommand)) {
            return res.status(403).json({
                success: false,
                error: 'Command not allowed for security reasons',
                allowedCommands: allowedCommands.slice(0, 10) // Show first 10 for reference
            });
        }

        logger.info('Executing CLI command:', { command: cmd });

        const startTime = Date.now();

        try {
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: 30000, // 30 seconds timeout
                cwd: process.cwd(),
                encoding: 'utf8'
            });

            const executionTime = Date.now() - startTime;

            res.json({
                success: true,
                command: cmd,
                output: stdout,
                error: stderr || null,
                executionTime,
                timestamp: new Date().toISOString()
            });

            logger.info('CLI command executed successfully', {
                command: cmd,
                executionTime: `${executionTime}ms`
            });
            return;
        } catch (execError: any) {
            const executionTime = Date.now() - startTime;

            res.json({
                success: false,
                command: cmd,
                output: execError.stdout || '',
                error: execError.stderr || execError.message,
                executionTime,
                timestamp: new Date().toISOString()
            });

            logger.warn('CLI command execution failed', {
                command: cmd,
                error: execError.message,
                executionTime: `${executionTime}ms`
            });
            return;
        }
    } catch (error) {
        logger.error('CLI execution error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to execute command',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
        return;
    }
});

// Get system information
router.get('/system-info', async (req, res) => {
    try {
        const systemInfo = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            cpu: process.cpuUsage(),
            workingDirectory: process.cwd(),
            environment: process.env.NODE_ENV || 'development'
        };

        res.json({
            success: true,
            systemInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to get system info:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get system information',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Get allowed commands
router.get('/allowed-commands', async (req, res) => {
    try {
        const allowedCommands = [
            { name: 'ls', description: 'List directory contents', platform: 'unix' },
            { name: 'dir', description: 'List directory contents', platform: 'windows' },
            { name: 'pwd', description: 'Print working directory', platform: 'unix' },
            { name: 'cd', description: 'Change directory', platform: 'both' },
            { name: 'mkdir', description: 'Create directory', platform: 'both' },
            { name: 'touch', description: 'Create empty file', platform: 'unix' },
            { name: 'echo', description: 'Print text', platform: 'both' },
            { name: 'cat', description: 'Display file contents', platform: 'unix' },
            { name: 'type', description: 'Display file contents', platform: 'windows' },
            { name: 'grep', description: 'Search text in files', platform: 'unix' },
            { name: 'find', description: 'Search for files', platform: 'unix' },
            { name: 'ps', description: 'List running processes', platform: 'unix' },
            { name: 'top', description: 'Display running processes', platform: 'unix' },
            { name: 'git', description: 'Git version control', platform: 'both' },
            { name: 'npm', description: 'Node package manager', platform: 'both' },
            { name: 'node', description: 'Node.js runtime', platform: 'both' }
        ];

        res.json({
            success: true,
            allowedCommands,
            total: allowedCommands.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to get allowed commands:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get allowed commands',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Test command execution
router.post('/test', async (req, res) => {
    try {
        const testCommand = process.platform === 'win32' ? 'echo Hello from CLI Agent' : 'echo "Hello from CLI Agent"';

        const startTime = Date.now();
        const { stdout, stderr } = await execAsync(testCommand);
        const executionTime = Date.now() - startTime;

        res.json({
            success: true,
            message: 'CLI Agent is working correctly',
            testCommand,
            output: stdout.trim(),
            error: stderr || null,
            executionTime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('CLI test failed:', error);

        res.status(500).json({
            success: false,
            error: 'CLI test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
