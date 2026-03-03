import { app as e, BrowserWindow as n } from "electron";
import { fileURLToPath as a } from "url";
import o from "path";
const i = o.dirname(a(import.meta.url)), l = process.env.NODE_ENV === "development";
function r() {
  const t = new n({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 600,
    webPreferences: {
      preload: o.join(i, "preload.js"),
      contextIsolation: !0
    },
    title: "Landscape Studio"
  });
  l ? t.loadURL("http://localhost:5173") : t.loadFile(o.join(i, "../dist/index.html"));
}
e.whenReady().then(r);
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});
e.on("activate", () => {
  n.getAllWindows().length === 0 && r();
});
