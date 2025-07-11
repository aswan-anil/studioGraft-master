import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { logServiceEvent } from '@/lib/service-logger';

// Adjust this to your Moonraker server address
const MOONRAKER_URL = process.env.MOONRAKER_URL || 'http://localhost:7125';

export async function POST(req: NextRequest) {
  try {
    // Absolute paths to G-code files
    const homingPath = path.resolve(process.cwd(), 'Graft/01_homing_and_binding.gcode');
    const positioningPath = path.resolve(process.cwd(), 'Graft/02_initial_positioning.gcode');

    // Read both files
    const [homing, positioning] = await Promise.all([
      fs.readFile(homingPath),
      fs.readFile(positioningPath),
    ]);

    // Combine them into a single file buffer
    const combinedBuffer = Buffer.concat([
      homing,
      Buffer.from('\n'),
      positioning,
    ]);

    // Prepare form data for upload
    const formData = new FormData();
    formData.append('file', new Blob([combinedBuffer]), 'troubleshoot_combined.gcode');

    // Upload to Moonraker
    const uploadRes = await fetch(`${MOONRAKER_URL}/server/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      await logServiceEvent(`FAIL upload troubleshoot_combined.gcode: ${errText}`);
      return NextResponse.json({ success: false, message: 'Upload failed', error: errText }, { status: 500 });
    }
    await logServiceEvent('SUCCESS upload troubleshoot_combined.gcode');
    // Start print after upload
    const printRes = await fetch(`${MOONRAKER_URL}/printer/print/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'troubleshoot_combined.gcode' }),
    });
    if (!printRes.ok) {
      const errText = await printRes.text();
      await logServiceEvent('FAIL start print troubleshoot_combined.gcode', 'ERROR', { error: errText });
      return NextResponse.json({ success: false, message: 'Print start failed', error: errText }, { status: 500 });
    }
    await logServiceEvent('SUCCESS start print troubleshoot_combined.gcode');
    return NextResponse.json({ success: true, message: 'G-code uploaded and print started successfully' });
  } catch (error: any) {
    await logServiceEvent(`ERROR troubleshoot upload: ${error.message}`);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

