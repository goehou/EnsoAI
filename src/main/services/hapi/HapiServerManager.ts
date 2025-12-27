import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';

export interface HapiConfig {
  webappPort: number;
  cliApiToken: string;
  telegramBotToken: string;
  webappUrl: string;
  allowedChatIds: string;
}

export interface HapiStatus {
  running: boolean;
  pid?: number;
  port?: number;
  error?: string;
}

class HapiServerManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: HapiConfig | null = null;
  private status: HapiStatus = { running: false };

  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async start(config: HapiConfig): Promise<HapiStatus> {
    if (this.process) {
      return this.status;
    }

    this.config = config;

    const env: Record<string, string> = {
      ...process.env,
      WEBAPP_PORT: String(config.webappPort),
    } as Record<string, string>;

    if (config.cliApiToken) {
      env.CLI_API_TOKEN = config.cliApiToken;
    }
    if (config.telegramBotToken) {
      env.TELEGRAM_BOT_TOKEN = config.telegramBotToken;
    }
    if (config.webappUrl) {
      env.WEBAPP_URL = config.webappUrl;
    }
    if (config.allowedChatIds) {
      env.ALLOWED_CHAT_IDS = config.allowedChatIds;
    }

    try {
      this.process = spawn('npx', ['-y', '@twsxtd/hapi', 'server'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      this.status = {
        running: true,
        pid: this.process.pid,
        port: config.webappPort,
      };

      this.process.stdout?.on('data', (data: Buffer) => {
        console.log('[hapi]', data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('[hapi]', data.toString());
      });

      this.process.on('error', (error) => {
        console.error('[hapi] Process error:', error);
        this.status = { running: false, error: error.message };
        this.process = null;
        this.emit('statusChanged', this.status);
      });

      this.process.on('exit', (code, signal) => {
        console.log(`[hapi] Process exited with code ${code}, signal ${signal}`);
        this.status = { running: false };
        this.process = null;
        this.emit('statusChanged', this.status);
      });

      this.emit('statusChanged', this.status);
      return this.status;
    } catch (error) {
      this.status = {
        running: false,
        error: error instanceof Error ? error.message : String(error),
      };
      this.emit('statusChanged', this.status);
      return this.status;
    }
  }

  async stop(): Promise<HapiStatus> {
    if (!this.process) {
      return this.status;
    }

    return new Promise((resolve) => {
      const proc = this.process!;

      const timeout = setTimeout(() => {
        proc.kill('SIGKILL');
      }, 5000);

      proc.once('exit', () => {
        clearTimeout(timeout);
        this.process = null;
        this.status = { running: false };
        this.emit('statusChanged', this.status);
        resolve(this.status);
      });

      proc.kill('SIGTERM');
    });
  }

  async restart(config: HapiConfig): Promise<HapiStatus> {
    await this.stop();
    return this.start(config);
  }

  getStatus(): HapiStatus {
    return this.status;
  }

  cleanup(): void {
    if (this.process) {
      this.process.kill('SIGKILL');
      this.process = null;
    }
  }
}

export const hapiServerManager = new HapiServerManager();
