import { IPC_CHANNELS } from '@shared/types';
import { BrowserWindow, ipcMain } from 'electron';
import { type HapiConfig, hapiServerManager } from '../services/hapi/HapiServerManager';

export function registerHapiHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.HAPI_START, async (_, config: HapiConfig) => {
    return await hapiServerManager.start(config);
  });

  ipcMain.handle(IPC_CHANNELS.HAPI_STOP, async () => {
    return await hapiServerManager.stop();
  });

  ipcMain.handle(IPC_CHANNELS.HAPI_RESTART, async (_, config: HapiConfig) => {
    return await hapiServerManager.restart(config);
  });

  ipcMain.handle(IPC_CHANNELS.HAPI_GET_STATUS, async () => {
    return hapiServerManager.getStatus();
  });

  // Broadcast status changes to all windows
  hapiServerManager.on('statusChanged', (status) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.HAPI_STATUS_CHANGED, status);
      }
    }
  });
}

export function cleanupHapi(): void {
  hapiServerManager.cleanup();
}
