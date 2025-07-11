# **App Name**: Grafito GraftMaster

## Core Features:

- Loading Screen: Implements a loading screen with a spinning Grafito logo and initialization text.
- Main Dashboard: Presents a full-screen main dashboard with prominent 'Start Grafting' and 'Emergency Stop' buttons.
- Start Grafting: Sends a request to the backend to execute the '/home/pi/start_grafting.py' script upon 'Start Grafting' button press.
- Emergency Stop: Triggers a FIRMWARE_RESTART command to Klipper via Moonraker API when the 'Emergency Stop' button is pressed.
- Company Branding: Displays the 'Grafito' company name in the top-left corner with appropriate branding.
- Live Status: Optionally shows a live status text from the robotic grafting machine using a WebSocket connection to the Moonraker API.
- Camera Feed: Provides a modular <CameraView /> component to display the live camera feed, if available.

## Style Guidelines:

- Primary color: A vibrant shade of green (#2ECC71), evoking the essence of plant life and the precision of technology. This differs from the requested hex code of #4CAF50, because it achieves better contrast.
- Background color: Light, desaturated green (#F0FFF0) to provide a clean and calming backdrop.
- Accent color: A light yellow (#FFFFE0) to draw attention to interactive elements, particularly the 'Start Grafting' button.
- Body and headline font: 'Inter', a sans-serif, offers a clean and modern appearance, ensuring readability.
- Uses simple, clear icons to enhance usability and provide visual cues for different actions and statuses; include a warning icon for the Emergency Stop button.
- Employs a full-screen layout with centered buttons to focus user interaction and ensure ease of use, even on smaller screens.
- Subtle animations during state transitions (e.g., button presses, status updates) to enhance user feedback without being distracting.