'use client';
import React from "react";

import { useState } from 'react';
import { AlertTriangle, Power, Sprout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMoonrakerSocket } from '@/hooks/use-moonraker-socket';
import { startGrafting, emergencyStop, homePrinter, powerOff } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CameraView from '@/components/camera-view';
import GrafitoLogo from './grafito-logo';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const [isPoweringOff, setIsPoweringOff] = useState(false);
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const { status, isConnected, printerState, sendRequest } = useMoonrakerSocket();
  const [isHoming, setIsHoming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set initialization based on printer state
  React.useEffect(() => {
    if (printerState === 'ready') {
      setIsInitialized(true);
      setIsHoming(false);
    } else {
      setIsInitialized(false);
    }
  }, [printerState]);

  // Reset initialization if disconnected or error
  React.useEffect(() => {
    if (!isConnected || status !== 'ready') {
      setIsInitialized(false);
      setIsHoming(false);
    }
  }, [isConnected, status]);

  const handleInitialize = async () => {
    setIsHoming(true);
    sendRequest('printer.gcode.script', { script: 'G28' });
    toast({
      title: 'Initialization Started',
      description: 'Machine initialization (homing) started.',
    });
    // Optionally, you could wait for a status update or delay here
    setTimeout(() => {
      setIsHoming(false);
      setIsInitialized(true);
      toast({
        title: 'Initialization Complete',
        description: 'Machine is initialized and ready for grafting.',
      });
    }, 3000); // Simulate initialization time
  }

  const handleStart = async () => {
    setIsStarting(true);
    const result = await startGrafting();
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
    setIsStarting(false);
  };

  const handleStop = async () => {
    setIsStopping(true);
    const result = await emergencyStop();
    if (result.success) {
      toast({
        title: 'Emergency Stop Activated',
        description: result.message,
        variant: 'destructive',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
    setIsStopping(false);
  };
  
  const getStatusIndicatorColor = () => {
    if (!isConnected) return 'bg-yellow-500';
    if (status.includes('error')) return 'bg-red-500';
    if (status === 'ready') return 'bg-green-500';
    return 'bg-blue-500';
  }

  if (isPoweringOff) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <GrafitoLogo className="h-32 w-32 mb-6 animate-pulse" />
        <h2 className="text-2xl md:text-4xl font-bold mb-4 text-center">Shutting Down...</h2>
        <p className="text-base md:text-lg text-muted-foreground text-center max-w-xs">The device is powering off. Please wait until the screen turns off before unplugging.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-background via-gray-900 to-background text-foreground p-0 scroll-smooth overscroll-contain">
      {/* Header */}
      <header className="w-full flex flex-col items-center pt-6 pb-2">
        <GrafitoLogo className="h-14 w-14 md:h-20 md:w-20 mb-1 md:mb-2" />
        <h1 className="text-2xl md:text-4xl font-extrabold font-headline tracking-tight mb-1 md:mb-2 text-center">Grafito Grafting Machine Dashboard</h1>
        <p className="text-sm md:text-lg text-muted-foreground mb-2 md:mb-4 text-center max-w-xs md:max-w-xl">Professional control and monitoring interface for your robotic grafting machine.</p>
        <div className="w-full max-w-2xl md:max-w-5xl border-b border-muted mx-auto mb-1 md:mb-2" />
      </header>
      
      {/* Emergency & Power Off Buttons Row */}
      <div className="flex flex-row gap-2 md:gap-4 justify-end md:justify-end w-full px-2 pt-4 md:pt-6">
        {/* Emergency Stop Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              className="shadow-lg"
              disabled={isStopping}
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              {isStopping ? 'Stopping...' : 'Emergency Stop'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Emergency Stop Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to trigger the <b>EMERGENCY STOP</b>? This will immediately restart the printer firmware and halt all operations.<br/><br/>
                <span className="text-destructive font-bold">This action cannot be undone.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" asChild>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={isStopping}
              >
                {isStopping ? 'Stopping...' : 'Confirm Emergency Stop'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Power Off Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="shadow-lg border border-red-500 text-red-600 hover:bg-red-500 hover:text-white focus-visible:ring-red-500"
              disabled={isPoweringOff}
            >
              <Power className="mr-2 h-5 w-5" />
              {isPoweringOff ? 'Powering Off...' : 'Power Off'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Shutdown Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to <b>power off</b> this device?<br/><br/>
                <span className="text-destructive font-bold">This will shut down the Raspberry Pi. You will need to manually power it back on.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" asChild>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsPoweringOff(true);
                  const result = await powerOff();
                  toast({
                    title: result.success ? 'Shutting Down' : 'Shutdown Failed',
                    description: result.message,
                    variant: result.success ? undefined : 'destructive',
                  });
                  if (!result.success) setIsPoweringOff(false);
                }}
                disabled={isPoweringOff}
              >
                {isPoweringOff ? 'Powering Off...' : 'Confirm Power Off'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <main className="flex flex-col items-center justify-center gap-6 w-full max-w-6xl mx-auto px-2 sm:px-4 mt-2 select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 w-full">
          {/* Camera Card */}
          <Card className="w-full max-w-xl shadow-xl border-2 border-muted min-w-0 px-2 py-2 md:px-4 md:py-4">
            <CardHeader>
              <CardTitle className="text-xl">Camera View</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraView />
            </CardContent>
          </Card>
          {/* Controls Card */}
          <Card className="w-full max-w-xl shadow-xl border-2 border-muted flex flex-col justify-between min-w-0 px-2 py-2 md:px-4 md:py-4">
            <CardHeader>
              <CardTitle className="text-xl">Printer Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 mb-2">
                <Button
                  className="w-full min-h-14 py-4 md:py-6 text-lg md:text-xl font-bold rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 md:gap-3 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary tap-highlight-transparent"
                  onClick={handleInitialize}
                  disabled={isHoming || !isConnected || status !== 'ready' || isInitialized}
                  variant="secondary"
                >
                  <Power className="mr-2 md:mr-3 h-7 w-7" />
                  {isHoming ? (<span className="flex items-center"><svg className="animate-spin h-6 w-6 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Initializing...</span>) : isInitialized ? 'Initialized' : 'Initialize Machine'}
                </Button>
                {(!isInitialized && !isHoming) && (
                  <p className="text-xs text-muted-foreground text-center mt-1">Initialization required before grafting. Make sure the Machine is powered on and connected.</p>
                )}
                {isHoming && (
                  <p className="text-xs text-muted-foreground text-center mt-1">Waiting for Machine to finish homing...</p>
                )}
                <Button 
                  className="w-full min-h-14 py-4 md:py-6 text-lg md:text-xl font-bold rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 md:gap-3 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary tap-highlight-transparent"
                  onClick={handleStart}
                  disabled={isStarting || !isConnected || status !== 'ready' || !isInitialized}
                  title={!isInitialized ? 'Initialize the machine before starting grafting.' : ''}
                >
                  <Sprout className="mr-2 md:mr-3 h-7 w-7" />
                  {isStarting ? 'Grafting in Progress...' : 'Start Grafting'}
                </Button>
                {!isInitialized && (
                  <p className="text-xs text-muted-foreground text-center mt-1">You must initialize the machine before starting grafting.</p>
                )}
                <a href="/troubleshoot" className="block mt-4">
                  <Button
                    className="w-full min-h-12 py-3 md:py-4 text-lg font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 flex items-center justify-center gap-2 md:gap-3 active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400 tap-highlight-transparent"
                    variant="secondary"
                    type="button"
                  >
                    <span role="img" aria-label="wrench">🛠️</span> Troubleshoot
                  </Button>
                </a>
              </div>
              <p className="text-base text-muted-foreground text-center mt-2">
                Use the controls above to interact with your robotic grafting machine.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Card */}
        <div className="w-full max-w-2xl mx-auto">
          <Card className="flex flex-col justify-between shadow-lg border-2 border-muted min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Power className="h-6 w-6" />
                <span>Machine Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center">
              <div className="flex items-center gap-3 mb-2">
                <span className={`h-4 w-4 rounded-full animate-pulse ${getStatusIndicatorColor()}`}></span>
                <p className="text-lg font-medium capitalize">
                  {isConnected ? status : 'Connecting...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full flex flex-col items-center mt-6 py-2 border-t border-muted bg-background/80 text-xs md:text-sm">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Grafito Innovations. All rights reserved.</p>
      </footer>
    </div>
  );
}
