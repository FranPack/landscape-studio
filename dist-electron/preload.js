import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  onWindowState: (cb) => ipcRenderer.on("win-state", (_e, state) => cb(state)),
  minimize: () => ipcRenderer.send("win-minimize"),
  maximize: () => ipcRenderer.send("win-maximize"),
  close: () => ipcRenderer.send("win-close")
});
