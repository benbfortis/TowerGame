// cap-android-livereload.mjs — live-reload deploy helper.
// Injects the Vite dev server URL into capacitor.config.json, builds and
// installs the APK once, then starts the Vite dev server so the device
// WebView loads from it. Restores config on exit.
//
// Usage: npm run cap:android:livereload
//
// Env vars:
//   HOST_IP=192.168.x.x   Override auto-detected LAN IP
//   PORT=3001             Override Vite port (default 3000)
//   ADB_REVERSE=1         Use USB tunnel instead of Wi-Fi
//       (required on networks that isolate clients — hotel/corporate Wi-Fi)

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { networkInterfaces } from 'os';
import { resolve } from 'path';

const PORT = parseInt(process.env.PORT || '3000', 10);
const ADB_REVERSE = process.env.ADB_REVERSE === '1';
const APP_ID = 'com.towergame.app';

function getLanIp() {
  if (process.env.HOST_IP) return process.env.HOST_IP;
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  throw new Error('Could not detect LAN IP. Set HOST_IP=<ip> to override.');
}

function run(cmd, opts = {}) {
  console.log(`\n[livereload] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
}

const ip = getLanIp();
const devUrl = `http://${ip}:${PORT}`;
console.log(`[livereload] Dev server → ${devUrl}`);

const configPath = resolve('capacitor.config.json');
const originalConfig = readFileSync(configPath, 'utf8');

function restoreConfig() {
  writeFileSync(configPath, originalConfig);
  console.log('[livereload] Restored production capacitor config.');
  try { run('npx cap sync android'); } catch { /* ignore restore-sync failures */ }
}

// Inject dev server URL into config.
const config = JSON.parse(originalConfig);
config.server = { ...(config.server || {}), url: devUrl, cleartext: true };
writeFileSync(configPath, JSON.stringify(config, null, 2));

let viteProc = null;

try {
  run('npx cap sync android');

  if (ADB_REVERSE) {
    run(`adb reverse tcp:${PORT} tcp:${PORT}`);
    console.log(`[livereload] ADB reverse tunnel active on port ${PORT}`);
  }

  run('cd android && gradlew.bat assembleDebug');
  run('adb install -r android\\app\\build\\outputs\\apk\\debug\\app-debug.apk');
  run(`adb shell am start -n ${APP_ID}/${APP_ID}.MainActivity`);

  console.log(`\n[livereload] APK installed. Starting Vite on ${devUrl} …`);

  viteProc = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  });

  viteProc.on('close', () => {
    restoreConfig();
    process.exit(0);
  });
} catch (err) {
  console.error('[livereload] Error:', err.message);
  if (viteProc) viteProc.kill();
  restoreConfig();
  process.exit(1);
}

function onExit() {
  if (viteProc) viteProc.kill();
  restoreConfig();
  process.exit(0);
}

process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);
