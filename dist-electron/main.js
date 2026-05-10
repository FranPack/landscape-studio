import { ipcMain, app, BrowserWindow } from "electron";
import { fileURLToPath } from "url";
import path from "path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 600,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      sandbox: false
    },
    title: "Landscape Studio"
  });
  win.on("maximize", () => win.webContents.send("win-state", "maximized"));
  win.on("unmaximize", () => win.webContents.send("win-state", "normal"));
  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
ipcMain.on("win-minimize", () => win?.minimize());
ipcMain.on("win-maximize", () => win && (win.isMaximized() ? win.unmaximize() : win.maximize()));
ipcMain.on("win-close", () => win?.close());
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
