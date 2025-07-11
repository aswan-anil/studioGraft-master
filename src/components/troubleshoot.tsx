'use client';
import React, { useState } from 'react';
import GrafitoLogo from './grafito-logo';
import { Button } from './ui/button';
import { useMoonrakerSocket } from '../hooks/use-moonraker-socket';

// List of available G-code files for troubleshooting
const GCODES = [
  '01_homing_and_binding.gcode',
  '02_initial_positioning.gcode',
  '03_motor_movements.gcode',
  '04_final_motions.gcode',
  '05_unbind_and_rehome.gcode',
];

export default function Troubleshoot() {
  const { isConnected, status } = useMoonrakerSocket();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  const handleRunGcode = async (file: string) => {
    setLoading((l) => ({ ...l, [file]: true }));
    setResult((r) => ({ ...r, [file]: null }));
    setError((e) => ({ ...e, [file]: null }));
    try {
      const res = await fetch('/api/troubleshoot-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file }),
      });
      const data = await res.json();
      if (data.success) {
        setResult((r) => ({ ...r, [file]: 'Success: ' + (data.message || 'File started.') }));
      } else {
        setError((e) => ({ ...e, [file]: data.message || 'Failed to run file.' }));
      }
    } catch (e: any) {
      setError((er) => ({ ...er, [file]: e?.message || 'Failed to run file.' }));
    } finally {
      setLoading((l) => ({ ...l, [file]: false }));
    }
  };

  const handleContact = () => {
    window.open('mailto:hello@grafito.in', '_blank');
  };

  const handleBack = () => {
  if (typeof window !== 'undefined') {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/'; // fallback to home if no history
    }
  }
};

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-background via-gray-900 to-background text-foreground p-4">
      <div className="w-full max-w-xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-3 text-orange-600 hover:text-orange-800 font-bold bg-transparent border-none cursor-pointer text-xl focus:outline-none active:bg-orange-100 rounded-lg px-4 py-3 select-none touch-manipulation min-h-[56px]"
          aria-label="Back to Dashboard"
          style={{ WebkitTapHighlightColor: "rgba(255, 153, 0, 0.2)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex flex-col items-center gap-6 bg-white/95 dark:bg-zinc-900/90 shadow-2xl rounded-2xl px-4 py-6 border border-muted select-none touch-manipulation">
          <GrafitoLogo className="h-20 w-20 mb-2" />
          <h2 className="text-4xl font-bold mb-2 text-center">Troubleshooting Panel</h2>
          <p className="text-lg text-muted-foreground text-center mb-6 max-w-lg">Select a troubleshooting script to run on your machine. Each script targets a specific part of the system for diagnosis or reset.</p>
          <div className="w-full">
            <h3 className="text-xl font-semibold mb-3 text-orange-700 flex items-center gap-3"><svg className="h-7 w-7 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.07 13.37A8 8 0 1112 4v4l3.29-3.3a1 1 0 011.42 1.42L13 9.41V4a8 8 0 013.07 9.37z" /></svg>Available Troubleshooting Scripts</h3>
            <div className="flex flex-col gap-5 bg-muted/40 rounded-xl p-4 border border-muted">
              {GCODES.map((file) => (
                <div key={file} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full py-3 px-2 bg-white/90 dark:bg-zinc-900/70 rounded-xl shadow-md border border-muted min-h-[64px] select-none touch-manipulation">
                  <span className="flex items-center gap-3 text-xl font-mono break-all"><svg className="h-7 w-7 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 2v4M16 2v4"/></svg>{file}</span>
                  <Button
                    onClick={() => handleRunGcode(file)}
                    disabled={loading[file] || !isConnected || status !== 'ready'}
                    className="py-4 px-8 text-2xl font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl min-w-[120px] active:bg-orange-700 focus:outline-none select-none touch-manipulation"
                    title="Run this troubleshooting script"
                    style={{ WebkitTapHighlightColor: "rgba(255, 153, 0, 0.2)" }}
                  >
                    {loading[file] ? (
                      <span className="flex items-center gap-2"><svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Running...</span>
                    ) : (
                      <>Run</>
                    )}
                  </Button>
                  {result[file] && (
                    <span className="flex items-center gap-2 text-green-700 font-bold ml-2 text-lg"><svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{result[file]}</span>
                  )}
                  {error[file] && (
                    <span className="flex items-center gap-2 text-red-600 font-bold ml-2 text-lg"><svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{error[file]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={handleContact}
            className="w-full py-5 text-2xl font-bold bg-primary hover:bg-primary/90 text-white rounded-xl mt-6 transition-all active:bg-primary/80 select-none touch-manipulation"
            style={{ WebkitTapHighlightColor: "rgba(0, 153, 255, 0.2)" }}
          >
            <span role="img" aria-label="phone" className="text-2xl">📞</span> Customer Support
          </Button>
          {!isConnected && (
            <div className="text-red-600 font-bold mt-4 text-xl">Moonraker not connected.</div>
          )}
        </div>
      </div>
    </div>
  );
}

