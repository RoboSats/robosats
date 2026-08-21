"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Modules to control application life and create native browser window
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
let tor = null;
// Function to determine the current OS and find the appropriate Tor binary
function checkPlatformAndRunTor() {
    const platform = os.platform();
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
            throw new Error(`Unsupported platform: ${platform}`);
    }
}
// Function to start Tor process
checkPlatformAndRunTor();
// Listen for Tor process stdout data
tor.stdout.on("data", (data) => {
    const message = data.toString();
    console.log(`Data received: ${message}`);
});
// Listen for Tor process stderr data
tor.stderr.on("data", (data) => {
    console.error(`Error received: ${data.toString()}`);
    electron_1.app.exit(1); // Exit the app if there's an error in the Tor process
});
// Function to create the main application window
function createWindow() {
    // Create the browser window with specific dimensions
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '/static/assets/images/favicon-32x32.png'),
        webPreferences: {
            nodeIntegration: false, // Disable Node.js integration in the renderer
            contextIsolation: true, // Enable context isolation for security
        },
    });
    // Load the index.html file from the app directory
    mainWindow.loadURL(`file://${path.resolve(__dirname, 'index.html#/garage')}`, {
        extraHeaders: "pragma: no-cache\n" // Prevent caching of the loaded file
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
electron_1.app.whenReady().then(() => {
    // Create the window after the app is ready
    createWindow();
    // Re-create a window if the app is activated and there are no other windows open (MacOS specific behavior)
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Setup the app session when Electron is ready
electron_1.app.on("ready", () => {
    // Redirect requests to static files
    electron_1.session.defaultSession.webRequest.onBeforeRequest({ urls: ['file:///static/*'] }, (details, callback) => {
        const url = details.url;
        const modifiedUrl = url.slice(7);
        const staticFilePath = path.join(__dirname, modifiedUrl);
        callback({ redirectURL: `file://${staticFilePath}` });
    });
    // Set the proxy for the session to route through Tor
    electron_1.session.defaultSession.setProxy({
        proxyRules: "socks://localhost:9050",
        proxyBypassRules: "<local>",
    });
});
// Handle all windows closed event except on macOS
electron_1.app.on("window-all-closed", () => {
    // Terminate the Tor process if it exists
    tor === null || tor === void 0 ? void 0 : tor.kill();
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
//# sourceMappingURL=index.js.map