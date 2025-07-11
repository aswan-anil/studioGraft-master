'use server';

const MOONRAKER_URL = process.env.MOONRAKER_URL || 'http://192.168.0.139';

// This function sends a command to run the grafting python script.
// It uses Moonraker's G-code script endpoint to run a shell command.
import { spawn } from 'child_process';
import path from 'path';

import fs from 'fs/promises';
import { logServiceEvent } from '@/lib/service-logger';
import WebSocket from 'ws'; // If you see a types error, run: npm install ws @types/ws

export async function startGrafting(): Promise<{ success: boolean; message: string }> {
  const MOONRAKER_HOST = process.env.MOONRAKER_HOST || 'localhost';
  const MOONRAKER_PORT = process.env.MOONRAKER_PORT || '7125';
  const VIRTUAL_SD_PATH = process.env.MOONRAKER_VIRTUAL_SD_PATH || '/home/grafito/printer_data/gcodes';
  const baseDir = process.cwd();
  const gcodeFiles = [
    '01_homing_and_binding.gcode',
    '02_initial_positioning.gcode',
    '03_motor_movements.gcode',
    '04_final_motions.gcode',
    '05_unbind_and_rehome.gcode',
  ];
  try {
    for (const file of gcodeFiles) {
      const src = path.join(baseDir, 'Graft', file);
      const dest = path.join(VIRTUAL_SD_PATH, file);
      try {
        await fs.copyFile(src, dest);
        await logServiceEvent(`GRAFTING COPIED ${file} to virtual SD`);
      } catch (err) {
        await logServiceEvent(`GRAFTING FAIL copy ${file}`, 'ERROR', { error: String(err) });
        return { success: false, message: `Failed to copy ${file} to virtual SD` };
      }
      // WebSocket print start and wait
      const wsUrl = `ws://${MOONRAKER_HOST}:${MOONRAKER_PORT}/websocket`;
      try {
        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(wsUrl);
          ws.on('open', () => {
            // Subscribe to print_stats
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              method: 'printer.objects.subscribe',
              params: { objects: { print_stats: ["state", "filename", "progress", "print_duration", "total_duration"] } },
              id: 1,
            }));
            // Start print
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              method: 'printer.print.start',
              params: { filename: file },
              id: 41,
            }));
            logServiceEvent(`GRAFTING PRINT STARTED ${file}`);
          });
          let printDone = false;
          ws.on('message', (data: WebSocket.RawData) => {
            try {
              const msg = JSON.parse(data.toString());
              if (msg?.result || msg?.method === 'notify_printer_state_changed') {
                const stats = msg?.params?.objects?.print_stats || msg?.result?.status?.print_stats;
                if (stats) {
                  if (stats.state && stats.state !== 'printing' && !printDone) {
                    printDone = true;
                    ws.close();
                    logServiceEvent(`GRAFTING PRINT FINISHED ${file}`);
                    resolve();
                  }
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          });
          ws.on('error', (err: Error) => {
            logServiceEvent(`GRAFTING WS ERROR ${file}`, 'ERROR', { error: String(err) });
            reject(new Error(`WebSocket error: ${err}`));
          });
          ws.on('close', () => {
            if (!printDone) {
              reject(new Error('WebSocket closed before print finished'));
            }
          });
        });
      } catch (err) {
        await logServiceEvent(`GRAFTING FAIL print ${file}`, 'ERROR', { error: String(err) });
        return { success: false, message: `Failed to print ${file}` };
      }
    }
    return { success: true, message: 'All grafting G-code files printed successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    await logServiceEvent('GRAFTING ERROR', 'ERROR', { error: errorMessage });
    return { success: false, message: errorMessage };
  }
}




// This function sends the G28 (home all axes) command to Klipper via Moonraker.
export async function homePrinter(): Promise<{ success: boolean; message: string }> {
  console.log('Sending homing (G28) command...');
  try {
    const response = await fetch(`${MOONRAKER_URL}/printer/gcode/script?script=G28`, {
      method: 'POST',
    });
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = {};
      }
      throw new Error(errorData?.error?.message || 'Failed to home printer');
    }
    const data = await response.json();
    console.log('Homing command sent successfully:', data);
    return { success: true, message: 'Homing command sent.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error sending homing command:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

// This function sends a shutdown command to the Raspberry Pi via Moonraker.
import { exec } from 'child_process';

export async function powerOff(): Promise<{ success: boolean; message: string }> {
  try {
    // Step 1: Wait 3s for UI overlay
    setTimeout(async () => {
      let moonrakerSuccess = false;
      try {
        // Step 2: Try Moonraker shutdown
        const res = await fetch(`${MOONRAKER_URL}/machine/shutdown`, { method: 'POST' });
        if (res.ok) {
          moonrakerSuccess = true;
          console.log('Moonraker shutdown command sent successfully.');
        } else {
          console.error('Moonraker shutdown failed, status:', res.status);
        }
      } catch (err) {
        console.error('Moonraker shutdown fetch failed:', err);
      }
      // Step 3: If Moonraker failed, fallback after 2s
      if (!moonrakerSuccess) {
        setTimeout(() => {
          try {
            console.log('Attempting local shutdown fallback...');
            exec('sudo shutdown now');
          } catch (localErr) {
            console.error('Local shutdown fallback failed:', localErr);
          }
        }, 2000); // 2s after Moonraker attempt
      }
    }, 3000); // 3s for UI overlay
    return { success: true, message: 'Shutdown sequence started. The device will power off shortly.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: errorMessage };
  }
}

// This function sends the FIRMWARE_RESTART command to Klipper via Moonraker.
export async function emergencyStop(): Promise<{ success: boolean; message: string }> {
  console.log('Activating emergency stop...');
  try {
    const response = await fetch(`${MOONRAKER_URL}/printer/emergency_stop`, {
      method: 'POST',
    });
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = {};
      }
      throw new Error(errorData?.error?.message || 'Failed to trigger emergency stop');
    }
    const data = await response.json();
    console.log('Emergency stop successful:', data);
    return { success: true, message: 'Emergency stop activated.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error during emergency stop:', errorMessage);
    return { success: false, message: errorMessage };
  }
}
