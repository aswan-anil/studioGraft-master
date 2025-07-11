import fs from 'fs/promises';
import path from 'path';
import { statSync, renameSync, existsSync } from 'fs';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'service_troubleshoot.log');
const MAX_LOG_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_LOG_BACKUPS = 5;

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

async function rolloverLogs() {
  // Rotate logs: .4 -> .5, .3 -> .4, ..., .1 -> .2, main -> .1
  for (let i = MAX_LOG_BACKUPS - 1; i >= 0; i--) {
    const src = i === 0 ? LOG_FILE : `${LOG_FILE}.${i}`;
    const dest = `${LOG_FILE}.${i + 1}`;
    if (existsSync(src)) {
      // Remove the oldest backup if it exists
      if (i + 1 === MAX_LOG_BACKUPS && existsSync(dest)) {
        try { renameSync(dest, dest + '.bak'); } catch {}
        try { await fs.unlink(dest); } catch {}
      }
      try { renameSync(src, dest); } catch {}
    }
  }
}

export async function logServiceEvent(
  event: string,
  level: LogLevel = 'INFO',
  meta?: Record<string, any>
) {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    // Rollover if needed
    let size = 0;
    try { size = statSync(LOG_FILE).size; } catch {}
    if (size > MAX_LOG_SIZE) {
      await rolloverLogs();
    }
    const timestamp = new Date().toISOString();
    let line = `[${timestamp}] [${level}] ${event}`;
    if (meta) line += ' | ' + JSON.stringify(meta);
    line += '\n';
    await fs.appendFile(LOG_FILE, line, 'utf8');
  } catch (err) {
    // Silently ignore logging errors
  }
}
