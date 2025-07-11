'use client';

import { useState, useEffect, useRef } from 'react';

// In a real setup, this would be derived from the window location or an environment variable.
const WEBSOCKET_URL = 'ws://localhost:7125/websocket';

interface MoonrakerMessage {
  id?: number;
  jsonrpc?: string;
  method: string;
  params?: {
    objects?: {
      [key: string]: string[];
    };
  };
  result?: any;
  error?: {
    message: string;
    code: number;
  };
}

export function useMoonrakerSocket() {
  const [printerState, setPrinterState] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error' | 'closed'>('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  // --- G28 retry logic ---
  const g28RetryInterval = useRef<NodeJS.Timeout | null>(null);
  const g28RetryDelay = 5000; // ms
  const hasSentG28 = useRef(false);

  function startG28Retry() {
    if (g28RetryInterval.current) return; // already retrying
    hasSentG28.current = false;
    g28RetryInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Send G28
        const request = {
          jsonrpc: "2.0",
          method: "printer.gcode.script",
          params: { script: "G28" }
        };
        ws.current.send(JSON.stringify(request));
        hasSentG28.current = true;
        console.log("Sent G28 (homing) command via retry loop");
      }
    }, g28RetryDelay);
  }

  function stopG28Retry() {
    if (g28RetryInterval.current) {
      clearInterval(g28RetryInterval.current);
      g28RetryInterval.current = null;
      console.log("Stopped G28 retry loop");
    }
  }

  // --- End G28 retry logic ---

  function connect() {
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connecting/connected');
      return;
    }
    console.log(`Attempting to connect to Moonraker at ${WEBSOCKET_URL}`);
    try {
      ws.current = new WebSocket(WEBSOCKET_URL);
      const timeout = setTimeout(() => {
        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
          console.error('Connection timeout - could not connect to Moonraker');
          setStatus('error');
          ws.current.close();
          if (!reconnectTimer.current) {
            reconnectTimer.current = setTimeout(connect, 5000);
          }
        }
      }, 10000);
      ws.current.onopen = () => {
        clearTimeout(timeout);
        console.log('Moonraker WebSocket connected successfully');
        setIsConnected(true);
        setStatus('ready');
        subscribeToPrinterObjects();
        // Start G28 retry logic on connect
        startG28Retry();
      };
      ws.current.onmessage = (event) => {
        try {
          const message: MoonrakerMessage = JSON.parse(event.data);
          console.log('Received Moonraker message:', message);
          if (message.error) {
            console.error('Moonraker error:', message.error);
            setStatus('error');
            return;
          }
          if (message.method === 'notify_status_update') {
            // message.params is an object like { printer: { state: 'ready' } }
            // We use 'any' type for message.params as Moonraker sends dynamic payloads
            const params: any = message.params;
            if (params && params.printer && typeof params.printer.state === 'string') {
              setPrinterState(params.printer.state);
              // If printer is ready, stop G28 retry
              if (params.printer.state === 'ready') {
                stopG28Retry();
              } else {
                // If not ready and G28 has been sent, keep retrying
                if (!g28RetryInterval.current) {
                  startG28Retry();
                }
              }
            }
            console.log('Status update:', message.params);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          console.log('Raw message:', event.data);
        }
      };
      ws.current.onclose = (event) => {
        console.log('Moonraker WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setStatus('closed');
        // Only attempt to reconnect if it wasn't a normal close
        if (event.code !== 1000) {
          console.log('Attempting to reconnect in 5 seconds...');
          if (!reconnectTimer.current) {
            reconnectTimer.current = setTimeout(connect, 5000);
          }
        }
      };

      ws.current.onerror = (error) => {
        console.error('Moonraker WebSocket error:', error);
        setStatus('error');
        
        // Attempt to reconnect after error
        if (!reconnectTimer.current) {
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };


    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setStatus('error');
      
      // Attempt to reconnect after error
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    }
  };

  const subscribeToPrinterObjects = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const subscriptionRequest: MoonrakerMessage = {
      jsonrpc: "2.0",
      method: 'printer.objects.subscribe',
      params: {
        objects: {
          printer: ["state"],
          display_status: ["message"],
          gcode_move: ["position"],
          toolhead: ["position", "extruder", "target", "temperature"],
          extruder: ["target", "temperature"],
          fan: ["speed"],
          heater_bed: ["target", "temperature"],
          heater_generic: ["target", "temperature"]
        }
      }
    };
    ws.current.send(JSON.stringify(subscriptionRequest));
  };


  function sendRequest(method: string, params?: any) {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    const request: MoonrakerMessage = {
      jsonrpc: "2.0",
      method,
      params: params || {}
    };
    ws.current.send(JSON.stringify(request));
  }


  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      stopG28Retry();
    };
  }, []);

  return {
    status,
    isConnected,
    printerState,
    sendRequest,
    subscribeToPrinterObjects,
    startG28Retry, // Expose for manual trigger if needed
    stopG28Retry
  };

}

