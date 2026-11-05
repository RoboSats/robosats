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
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const torMonitor_1 = require("./torMonitor");
let tor = null;
let monitor = null;
function checkPlatformAndRunTor() {
    const platform = os.platform();
    const torBase = __dirname.includes('app.asar')
        ? path.join(process.resourcesPath, 'app.asar.unpacked')
        : __dirname;
    switch (platform) {
        case 'win32':
            tor = (0, child_process_1.spawn)(path.join(torBase, 'tor', 'tor-win', 'tor', 'tor.exe'));
            break;
        case 'darwin':
            tor = (0, child_process_1.spawn)(path.join(torBase, 'tor', 'tor-mac', 'tor', 'tor'));
            break;
        case 'linux': {
            const torDir = path.join(torBase, 'tor', 'tor-linux', 'tor');
            tor = (0, child_process_1.spawn)(path.join(torDir, 'tor'), [], {
                env: Object.assign(Object.assign({}, process.env), { LD_LIBRARY_PATH: torDir }),
            });
            break;
        }
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}
async function showTorFailureDialog(event) {
    const message = (0, torMonitor_1.buildFailureMessage)(event);
    const { response } = await electron_1.dialog.showMessageBox({
        type: 'error',
        title: 'Tor connection failed',
        message: 'RoboSats could not connect to the Tor network',
        detail: message,
        buttons: ['Open release page', 'Quit'],
        defaultId: 1,
        cancelId: 1,
    });
    if (response === 0) {
        await electron_1.shell.openExternal('https://github.com/RoboSats/robosats/releases/latest');
    }
    electron_1.app.exit(1);
}
checkPlatformAndRunTor();
monitor = new torMonitor_1.TorMonitor(tor);
monitor.on('tor-event', (event) => {
    if (event.type === 'bootstrap') {
        console.log(`Tor bootstrap: ${event.percent}% — ${event.summary}`);
        return;
    }
    if (event.type === 'connected') {
        console.log('Tor bootstrap complete.');
        return;
    }
    console.error('Tor failure event:', event);
    electron_1.app.whenReady().then(() => showTorFailureDialog(event));
});
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '/static/assets/images/favicon-32x32.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.loadURL(`file://${path.resolve(__dirname, 'index.html#/garage')}`, { extraHeaders: 'pragma: no-cache\n' });
    mainWindow.webContents.on('did-fail-load', () => {
        console.log('Failed to load the page, retrying...');
        mainWindow.loadURL(`file://${__dirname}/index.html#/garage`);
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('ready', () => {
    electron_1.session.defaultSession.webRequest.onBeforeRequest({ urls: ['file:///static/*'] }, (details, callback) => {
        const modifiedUrl = details.url.slice(7);
        const staticFilePath = path.join(__dirname, modifiedUrl);
        callback({ redirectURL: `file://${staticFilePath}` });
    });
    electron_1.session.defaultSession.setProxy({
        proxyRules: 'socks://localhost:9050',
        proxyBypassRules: '<local>',
    });
});
electron_1.app.on('window-all-closed', () => {
    monitor === null || monitor === void 0 ? void 0 : monitor.stop();
    tor === null || tor === void 0 ? void 0 : tor.kill();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=index.js.map