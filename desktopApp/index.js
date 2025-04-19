"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Modules to control application life and create native browser window
var electron_1 = require("electron");
var child_process_1 = require("child_process");
var path = require("path");
var os = require("os");
var tor = null;
// Function to determine the current OS and find the appropriate Tor binary
function checkPlatformAndRunTor() {
    var platform = os.platform();
    switch (platform) {
        case 'win32':
            tor = (0, child_process_1.spawn)(path.join(__dirname, '/tor/tor-win/tor/tor.exe'));
            break;
        case 'darwin':
            tor = (0, child_process_1.spawn)(path.join(__dirname, '/tor/tor-mac/tor/tor'));
            break;
        case 'linux':
            tor = (0, child_process_1.spawn)(path.join(__dirname, '/tor/tor-linux/tor/tor'));
            break;
        default:
            throw new Error("Unsupported platform: ".concat(platform));
    }
}
// Function to start Tor process
checkPlatformAndRunTor();
// Listen for Tor process stdout data
tor.stdout.on("data", function (data) {
    var message = data.toString();
    console.log("Data received: ".concat(message));
});
// Listen for Tor process stderr data
tor.stderr.on("data", function (data) {
    console.error("Error received: ".concat(data.toString()));
    electron_1.app.exit(1); // Exit the app if there's an error in the Tor process
});
// Function to create the main application window
function createWindow() {
    // Create the browser window with specific dimensions
    var mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '/static/assets/images/favicon-32x32.png'),
        webPreferences: {
            nodeIntegration: false, // Disable Node.js integration in the renderer
            contextIsolation: true, // Enable context isolation for security
        },
    });
    // Load the index.html file from the app directory
    mainWindow.loadURL("file://".concat(path.resolve(__dirname, 'index.html#/garage')), {
        extraHeaders: "pragma: no-cache\n" // Prevent caching of the loaded file
    });
    // Handle failed load attempts by reloading the file
    mainWindow.webContents.on("did-fail-load", function () {
        console.log("Failed to load the page, retrying...");
        mainWindow.loadURL("file://".concat(__dirname, "/index.html#/garage"));
    });
    // Uncomment the following line to open the DevTools
    // mainWindow.webContents.openDevTools();
}
// This method is called when Electron has finished initialization
electron_1.app.whenReady().then(function () {
    // Create the window after the app is ready
    createWindow();
    // Re-create a window if the app is activated and there are no other windows open (MacOS specific behavior)
    electron_1.app.on("activate", function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Setup the app session when Electron is ready
electron_1.app.on("ready", function () {
    // Redirect requests to static files
    electron_1.session.defaultSession.webRequest.onBeforeRequest({ urls: ['file:///static/*'] }, function (details, callback) {
        var url = details.url;
        var modifiedUrl = url.slice(7);
        var staticFilePath = path.join(__dirname, modifiedUrl);
        callback({ redirectURL: "file://".concat(staticFilePath) });
    });
    // Set the proxy for the session to route through Tor
    electron_1.session.defaultSession.setProxy({
        proxyRules: "socks://localhost:9050",
        proxyBypassRules: "<local>",
    });
});
// Handle all windows closed event except on macOS
electron_1.app.on("window-all-closed", function () {
    // Terminate the Tor process if it exists
    tor === null || tor === void 0 ? void 0 : tor.kill();
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
//# sourceMappingURL=index.js.map