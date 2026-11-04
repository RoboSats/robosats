import { app, BrowserWindow, dialog, shell, session } from 'electron';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { TorMonitor, TorEvent, buildFailureMessage } from './torMonitor';

let tor: ChildProcessWithoutNullStreams | null = null;
let monitor: TorMonitor | null = null;

function checkPlatformAndRunTor(): void {
  const platform = os.platform();

  const torBase = __dirname.includes('app.asar')
    ? path.join(process.resourcesPath, 'app.asar.unpacked')
    : __dirname;

  switch (platform) {
    case 'win32':
      tor = spawn(path.join(torBase, 'tor', 'tor-win', 'tor', 'tor.exe'));
      break;
    case 'darwin':
      tor = spawn(path.join(torBase, 'tor', 'tor-mac', 'tor', 'tor'));
      break;
    case 'linux': {
      const torDir = path.join(torBase, 'tor', 'tor-linux', 'tor');
      tor = spawn(path.join(torDir, 'tor'), [], {
        env: { ...process.env, LD_LIBRARY_PATH: torDir },
      });
      break;
    }
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function showTorFailureDialog(event: TorEvent): Promise<void> {
  const message = buildFailureMessage(event);
  const { response } = await dialog.showMessageBox({
    type: 'error',
    title: 'Tor connection failed',
    message: 'RoboSats could not connect to the Tor network',
    detail: message,
    buttons: ['Open release page', 'Quit'],
    defaultId: 1,
    cancelId: 1,
  });
  if (response === 0) {
    await shell.openExternal(
      'https://github.com/RoboSats/robosats/releases/latest',
    );
  }
  app.exit(1);
}

checkPlatformAndRunTor();

monitor = new TorMonitor(tor!);
monitor.on('tor-event', (event: TorEvent) => {
  if (event.type === 'bootstrap') {
    console.log(`Tor bootstrap: ${event.percent}% — ${event.summary}`);
    return;
  }
  if (event.type === 'connected') {
    console.log('Tor bootstrap complete.');
    return;
  }
  console.error('Tor failure event:', event);
  app.whenReady().then(() => showTorFailureDialog(event));
});

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '/static/assets/images/favicon-32x32.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(
    `file://${path.resolve(__dirname, 'index.html#/garage')}`,
    { extraHeaders: 'pragma: no-cache\n' },
  );

  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load the page, retrying...');
    mainWindow.loadURL(`file://${__dirname}/index.html#/garage`);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('ready', () => {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['file:///static/*'] },
    (details, callback) => {
      const modifiedUrl = details.url.slice(7);
      const staticFilePath = path.join(__dirname, modifiedUrl);
      callback({ redirectURL: `file://${staticFilePath}` });
    },
  );

  session.defaultSession.setProxy({
    proxyRules: 'socks://localhost:9050',
    proxyBypassRules: '<local>',
  });
});

app.on('window-all-closed', () => {
  monitor?.stop();
  tor?.kill();
  if (process.platform !== 'darwin') app.quit();
});
