#!/usr/bin/env python3

import asyncio
import websockets
import json
import requests
import asyncio
import shutil
import os

MOONRAKER_HOST = "localhost"
MOONRAKER_PORT = 7125
GCODE_COMMAND = "G28 A"  # Example G-code, change as needed

async def send_gcode(command):
    url = f"http://{MOONRAKER_HOST}:{MOONRAKER_PORT}/printer/gcode/script"
    try:
        resp = requests.post(url, json={"script": command})
        resp.raise_for_status()
        print(f"Sent G-code: {command}")
    except Exception as e:
        print(f"Failed to send G-code: {e}")

async def send_gcode_file(filepath):
    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith(';'):
                    await send_gcode(line)
                    await asyncio.sleep(0.1)  # small delay to avoid flooding
        print(f"Finished sending file: {filepath}")
    except Exception as e:
        print(f"Failed to send G-code file: {e}")

VIRTUAL_SD_PATH = os.path.expanduser("~/printer_data/gcodes")

async def start_print_via_websocket(websocket, filename):
    msg = {
        "jsonrpc": "2.0",
        "method": "printer.print.start",
        "params": {"filename": filename},
        "id": 41
    }
    await websocket.send(json.dumps(msg))
    print(f"Sent print start command for file: {filename}")

async def wait_for_print_to_finish(websocket):
    """Wait until print_stats.state is no longer 'printing'. Also display errors/shutdowns and live print info."""
    last_info = None
    last_state = None
    gcode_error_seen = False
    abnormal_end = False
    while True:
        try:
            message_str = await websocket.recv()
            data = json.loads(message_str)
            method = data.get("method")
            if method == "notify_status_update":
                status = data["params"][0]
                print("DEBUG STATUS:", json.dumps(status, indent=2))  # Debug output
                if "print_stats" in status:
                    ps = status["print_stats"]
                    state = ps.get("state", None)
                    last_state = state
                    info = f"State: {state}, File: {ps.get('filename')}, Progress: {ps.get('progress')}, Elapsed: {ps.get('print_duration')}s"
                    if info != last_info:
                        print(info)
                        last_info = info
                    if state == "error":
                        print("[PRINT ERROR] Print encountered an error!")
                        break
                    if state == "cancelled":
                        print("[PRINT CANCELLED] Print was cancelled!")
                        break
                    if state != "printing":
                        if state in ["complete", "cancelled", "error"]:
                            print(f"Print finished (state: {state})")
                            break
                        elif gcode_error_seen:
                            print(f"Print finished (state: {state})")
                            abnormal_end = True
                            break
                        else:
                            # Unexpected state but no G-code error: keep waiting
                            continue
            elif method == "notify_gcode_response":
                responses = data.get("params", [[]])[0]
                if isinstance(responses, list):
                    for resp in responses:
                        print(f"[GCODE RESPONSE] {resp}")
                        if isinstance(resp, str) and resp.strip().startswith("!!"):
                            print("[PRINT CANCELLED] Print was cancelled due to error!")
                            return
                else:
                    print(f"[GCODE RESPONSE] {responses}")
                    if isinstance(responses, str) and responses.strip().startswith("!!"):
                        print("[PRINT CANCELLED] Print was cancelled due to error!")
                        return
            elif method == "notify_klippy_shutdown":
                reason = data.get("params", [{}])[0].get("reason", "Unknown shutdown")
                print(f"[MOONRAKER ERROR] Klippy Shutdown: {reason}")
            elif method == "notify_klippy_error":
                error = data.get("params", [{}])[0].get("error", "Unknown error")
                print(f"[MOONRAKER ERROR] Klippy Error: {error}")
        except websockets.exceptions.ConnectionClosedError as e:
            print(f"WebSocket connection closed while waiting for print to finish: {e}")
            if last_state == "printing":
                print("[PRINT POSSIBLY CANCELLED OR ERRORED] Last state was printing before connection closed.")
                # Try to fetch print state from HTTP API as a fallback
                try:
                    import requests
                    url = f"http://{MOONRAKER_HOST}:{MOONRAKER_PORT}/printer/objects/query?objects=print_stats"
                    resp = requests.get(url, timeout=2)
                    if resp.ok:
                        ps = resp.json().get("result", {}).get("status", {}).get("print_stats", {})
                        state = ps.get("state")
                        print(f"[HTTP FALLBACK] Latest print_stats.state: {state}")
                        if state == "cancelled":
                            print("[PRINT CANCELLED] Print was cancelled!")
                        elif state == "error":
                            print("[PRINT ERROR] Print encountered an error!")
                        elif gcode_error_seen:
                            abnormal_end = True
                    else:
                        print("[HTTP FALLBACK] Could not fetch print_stats.")
                except Exception as ex:
                    print(f"[HTTP FALLBACK] Error fetching print_stats: {ex}")
            break
        except Exception as e:
            print(f"Error while waiting for print to finish: {e}")
            if last_state == "printing":
                print("[PRINT POSSIBLY CANCELLED OR ERRORED] Last state was printing before error occurred.")
                # Try to fetch print state from HTTP API as a fallback
                try:
                    import requests
                    url = f"http://{MOONRAKER_HOST}:{MOONRAKER_PORT}/printer/objects/query?objects=print_stats"
                    resp = requests.get(url, timeout=2)
                    if resp.ok:
                        ps = resp.json().get("result", {}).get("status", {}).get("print_stats", {})
                        state = ps.get("state")
                        print(f"[HTTP FALLBACK] Latest print_stats.state: {state}")
                        if state == "cancelled":
                            print("[PRINT CANCELLED] Print was cancelled!")
                        elif state == "error":
                            print("[PRINT ERROR] Print encountered an error!")
                        elif gcode_error_seen:
                            abnormal_end = True
                    else:
                        print("[HTTP FALLBACK] Could not fetch print_stats.")
                except Exception as ex:
                    print(f"[HTTP FALLBACK] Error fetching print_stats: {ex}")
            break
    # After loop: if a G-code error was seen and the final state is not complete/cancelled/error, always print a strong warning
    if gcode_error_seen and last_state not in ["complete", "cancelled", "error"]:
        print("[PRINT CANCELLED] Print was cancelled due to error!")

async def terminal_input_loop():
    loop = asyncio.get_event_loop()
    while True:
        try:
            filepath = await loop.run_in_executor(None, input, "Enter path to .gcode file to print (or 'quit' to exit): ")
            filepath = filepath.strip()
            if filepath.lower() == 'quit':
                print("Exiting G-code sender.")
                break
            if not os.path.isfile(filepath):
                print(f"File not found: {filepath}")
                continue
            filename = os.path.basename(filepath)
            dest = os.path.join(VIRTUAL_SD_PATH, filename)
            try:
                if filepath != dest:
                    shutil.copy(filepath, dest)
                    print(f"Copied {filepath} to {dest}")
                else:
                    print(f"File already in virtual SD directory: {dest}")
            except Exception as e:
                print(f"Failed to copy file: {e}")
                continue

            uri = f"ws://{MOONRAKER_HOST}:{MOONRAKER_PORT}/websocket"
            try:
                async with websockets.connect(
                    uri,
                    ping_interval=10,
                    ping_timeout=10
                ) as websocket:
                    print(f"Connected to Moonraker at {uri}")
                    subscribe_message = {
                        "jsonrpc": "2.0",
                        "method": "printer.objects.subscribe",
                        "params": {
                            "objects": {
                                "print_stats": ["state", "filename", "progress", "print_duration", "total_duration"]
                            }
                        },
                        "id": 1
                    }
                    await websocket.send(json.dumps(subscribe_message))
                    await start_print_via_websocket(websocket, filename)
                    print("Waiting for print to finish...")
                    await wait_for_print_to_finish(websocket)
                    print("Ready for next file.")
            except websockets.exceptions.ConnectionClosedError as e:
                print(f"WebSocket connection closed during print: {e}")
            except Exception as e:
                print(f"Unexpected error during print: {e}")
        except Exception as e:
            print(f"Unexpected error in input loop: {e}")
            # Instead of break, continue to allow more file attempts
            continue


async def main():
    await terminal_input_loop()


if __name__ == "__main__":
    asyncio.run(main())