# StudioGraft Dashboard Kiosk Setup

This guide explains how to set up the StudioGraft Next.js dashboard as a secure kiosk application on a Raspberry Pi, supporting both headless and desktop environments.

---

## Features
- Auto-starts the dashboard on system boot (headless or desktop)
- Launches Chromium in kiosk mode on desktop login
- Disables right-click and common keyboard shortcuts (for security)
- Prevents users from opening new tabs, closing the dashboard, or accessing dev tools

---

## 1. Prerequisites
- Raspberry Pi OS (with Desktop recommended for kiosk)
- Node.js, npm, and Chromium browser installed
- This repository cloned to `/home/<user>/studioGraft-master`

---

## 2. Install Dependencies
```bash
cd ~/studioGraft-master
npm install
```

---

## 3. Systemd Service for Headless/Boot Startup
Create a file named `studio-graft.service` in your project root with:

```ini
[Unit]
Description=StudioGraft Next.js Dashboard
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/<user>/studioGraft-master
ExecStart=/usr/bin/npm run start
Restart=always
User=<user>
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Replace `<user>` with your Raspberry Pi username.

**Enable the service:**
```bash
sudo cp studio-graft.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable studio-graft.service
sudo systemctl start studio-graft.service
```

---

## 4. Kiosk Mode on Desktop Login
Create `~/.config/autostart/studio-graft-kiosk.desktop` with:

```ini
[Desktop Entry]
Type=Application
Name=StudioGraft Kiosk
Exec=chromium-browser --noerrdialogs --kiosk --incognito --disable-translate --no-first-run --fast --fast-start --disable-features=TranslateUI --disable-pinch --overscroll-history-navigation=0 --disable-application-cache --disable-session-crashed-bubble --disable-infobars http://localhost:3000
X-GNOME-Autostart-enabled=true
```

This will launch Chromium in kiosk mode pointed at your dashboard on login.

---

## 5. Lockdown: Disable Right-Click & Shortcuts
Add the following to your `src/app/layout.tsx`:

```tsx
import { useEffect } from "react";

export default function RootLayout({ children }) {
  useEffect(() => {
    // Disable right-click
    const disableContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);

    // Block common shortcuts
    const blockKeys = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "U"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ["R", "T", "W"].includes(e.key.toUpperCase())) ||
        (e.key === "F5") ||
        (e.altKey && e.key === "F4")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener("keydown", blockKeys, true);
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", blockKeys, true);
    };
  }, []);
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

## 6. Rebuild & Test
```bash
npm run build
npm run start
```
Or simply reboot your Raspberry Pi.

---

## 7. Usage
- On boot, the dashboard runs at `http://localhost:3000`.
- On desktop login, Chromium opens in full-screen kiosk mode.
- Users cannot close, reload, or open new tabs, nor access dev tools.

---

## 8. Customization
- To further lock down the browser (e.g., hide mouse cursor), adjust Chromium flags in the `.desktop` file.
- For more security, add additional JavaScript restrictions as needed.

---

## 9. Troubleshooting
- To check service status:
  ```bash
  sudo systemctl status studio-graft.service
  ```
- To view logs:
  ```bash
  journalctl -u studio-graft.service
  ```

---

## 10. Credits
StudioGraft Dashboard Kiosk Setup for Raspberry Pi
