const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "EditorJay",
  });

  // In development, load from Vite dev server
  // In production, we'd load the dist/index.html
  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:5174";
  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startBackend() {
  console.log("Starting backend server...");
  // For development, we use ts-node via npm script
  // In production, we'd spawn the compiled JS
  serverProcess = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname, "server"),
    shell: true,
    stdio: "inherit",
  });

  serverProcess.on("error", (err) => {
    console.error("Failed to start server:", err);
  });
}

app.on("ready", () => {
  // startBackend(); // Concurrently handles this in the root script for dev,
  // but for a "pure" electron start we'd do it here.
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Ensure backend dies when Electron exits
app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
