import { registerAgentHandlers } from './agent';
import { registerAppHandlers } from './app';
import { registerCliHandlers } from './cli';
import { registerDatabaseHandlers } from './database';
import { registerDialogHandlers } from './dialog';
import { registerFileHandlers } from './files';
import { registerGitHandlers } from './git';
import { registerTerminalHandlers } from './terminal';
import { registerWorktreeHandlers } from './worktree';

export function registerIpcHandlers(): void {
  registerGitHandlers();
  registerWorktreeHandlers();
  registerFileHandlers();
  registerTerminalHandlers();
  registerAgentHandlers();
  registerDatabaseHandlers();
  registerDialogHandlers();
  registerAppHandlers();
  registerCliHandlers();
}
