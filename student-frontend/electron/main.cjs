const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        alwaysOnTop: true,
        frame: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false,
        },
    });

    // Find URL anywhere in the arguments
    let startUrl = process.argv.find(arg => typeof arg === 'string' && arg.startsWith('http'));
    if (!startUrl) {
        startUrl = process.env.EXAM_SERVER_URL || 'http://localhost:5173';
    }

    console.log(`Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Prevent window from losing focus
    mainWindow.on('blur', () => {
        if (mainWindow) {
            mainWindow.focus();
        }
    });

    // Block common exit shortcuts
    mainWindow.on('close', (e) => {
        // Only allow closing if app is quitting
        if (!app.isQuitting) {
            e.preventDefault();
        }
    });
}

app.on('ready', () => {
    createWindow();

    // Register global shortcuts to block
    const shortcuts = [
        'Alt+F4',
        'CommandOrControl+Shift+I',
        'F12',
        'Alt+F2',
    ];

    shortcuts.forEach(shortcut => {
        try {
            const success = globalShortcut.register(shortcut, () => {
                console.log(`Shortcut ${shortcut} is blocked.`);
                return false;
            });
            if (!success) {
                console.log(`Failed to register ${shortcut}`);
            }
        } catch (err) {
            console.error(`Error registering shortcut ${shortcut}:`, err);
        }
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
    app.isQuitting = true;
});
