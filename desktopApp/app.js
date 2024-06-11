// Modules to control application life and create native browser window
const { app, BrowserWindow, session, protocol, net } = require("electron");
const { spawn } = require("child_process");
const path = require('path');
const os = require('os');



function getTorExecutablePath(){
  const platform = os.platform();

  switch (platform) {
    case "win32": // Windows
      return "./tor/tor-win/tor/tor.exe";
    case "darwin": // macOS
      return "./tor/tor-macos/tor/tor";
    case "linux": // Linux
      return "./tor/tor-linux/tor/tor";
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function startTor(){
  const torPath = getTorExecutablePath();
  return spawn(torPath);
}

const tor = startTor();

// Listen for Tor process stdout data
tor.stdout.on("data", (data) => {
  console.log(`data received \n${data}`);

  // Check if Tor is ready
  if (data.includes("Bootstrapped 100%")) {
    createWindow();
  }
  console.log(`Data received \n${data}`);
});

// Listen for Tor process stderr data
tor.stderr.on("data", (data) => {
  console.log(`Error received \n${data}`);
  app.exit(1);
});

function createWindow() {

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences:{
      contextIsolation: true,
    }
  });

  // and load the index.html of the app.
  
  mainWindow.loadURL(`file://`+ path.resolve(__dirname,`index.html#/robot`),{ extraHeaders: "pragma: no-cache\n" });
  
  mainWindow.webContents.on("did-fail-load", function () {
    console.log("did-fail-load");
    mainWindow.loadURL(`file://${__dirname}/index.html#/robot`,);
  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  createWindow();
  
  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("ready", () => {

  session.defaultSession.webRequest.onBeforeRequest({ urls: ['file:///static/*'] }, (details, callback) => {
    const url = details.url;
    //console.log(url);
    const modifiedUrl = url.substr(7);
      const staticFilePath = path.join(__dirname, modifiedUrl);
      callback({ redirectURL: 'file://' + staticFilePath });
  });

  session.defaultSession.setProxy({
    proxyRules: "socks://localhost:9050",
    proxyBypassRules: "<local>",
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  tor?.kill();
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Listen for exit event on the main process
app.on("exit", () => {
  // Terminate the Tor daemon process
  tor?.kill();
});

// Optionally, listen for the uncaughtException event to handle any uncaught exceptions
app.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Terminate the Tor daemon process
  tor?.kill();
  // Exit the main process with a non-zero exit code
  app.exit(1);
});

// Optionally, listen for the SIGINT signal (Ctrl+C) to handle the termination of the main process
app.on("SIGINT", () => {
  // Terminate the Tor daemon process
  tor?.kill();
  // Exit the main process
  app.exit();
});

// Optionally, listen for the SIGTERM signal to handle the termination of the main process
app.on("SIGTERM", () => {
  // Terminate the Tor daemon process
  tor?.kill();
  // Exit the main process
  app.exit();
});
