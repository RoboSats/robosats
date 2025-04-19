// Modules to control application life and create native browser window
import { app, BrowserWindow, session, protocol, net } from 'electron';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as os from "os";

let tor: ChildProcessWithoutNullStreams | null = null;

// Function to determine the current OS and find the appropriate Tor binary

function checkPlatformAndRunTor(): void {
  const platform = os.platform();

  switch (platform) {
    case 'win32':
      tor = spawn(path.join(__dirname, '/tor/tor-win/tor/tor.exe'));
      break;
    case 'darwin':
      tor = spawn(path.join(__dirname, '/tor/tor-mac/tor/tor'));
      break;
    case 'linux':
      tor = spawn(path.join(__dirname, '/tor/tor-linux/tor/tor'));
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Function to start Tor process
checkPlatformAndRunTor()


// Listen for Tor process stdout data
tor.stdout.on("data", (data: Buffer) => {
  const message = data.toString();
  console.log(`Data received: ${message}`);
});

// Listen for Tor process stderr data
tor.stderr.on("data", (data: Buffer) => {
  console.error(`Error received: ${data.toString()}`);
  app.exit(1); // Exit the app if there's an error in the Tor process
});

// Function to create the main application window
function createWindow(): void {
  // Create the browser window with specific dimensions
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon:path.join(__dirname, '/static/assets/images/favicon-32x32.png'),
    webPreferences: {
      nodeIntegration: false,  // Disable Node.js integration in the renderer
      contextIsolation: true,  // Enable context isolation for security
    },
  });

  // Load the index.html file from the app directory
  mainWindow.loadURL(`file://${path.resolve(__dirname, 'index.html#/garage')}`, {
    extraHeaders: "pragma: no-cache\n"  // Prevent caching of the loaded file
  });

  // Handle failed load attempts by reloading the file
  mainWindow.webContents.on("did-fail-load", () => {
    console.log("Failed to load the page, retrying...");
    mainWindow.loadURL(`file://${__dirname}/index.html#/garage`);
  });

  // Uncomment the following line to open the DevTools
  // mainWindow.webContents.openDevTools();
}

// This method is called when Electron has finished initialization
app.whenReady().then(() => {
  // Create the window after the app is ready
  createWindow();

  // Re-create a window if the app is activated and there are no other windows open (MacOS specific behavior)
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Setup the app session when Electron is ready
app.on("ready", () => {
  // Redirect requests to static files
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['file:///static/*'] }, (details, callback) => {
    const url = details.url;
    const modifiedUrl = url.slice(7);
    const staticFilePath = path.join(__dirname, modifiedUrl);
    callback({ redirectURL: `file://${staticFilePath}` });
  });

  // Set the proxy for the session to route through Tor
  session.defaultSession.setProxy({
    proxyRules: "socks://localhost:9050",
    proxyBypassRules: "<local>",
  });
});

// Handle all windows closed event except on macOS
app.on("window-all-closed", () => {
  // Terminate the Tor process if it exists
  tor?.kill();
  if (process.platform !== "darwin") app.quit();
});
