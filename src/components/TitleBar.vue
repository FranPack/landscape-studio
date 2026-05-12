<script setup lang="ts">
import { ref } from 'vue'

const platform = (window as any).electronAPI?.platform ?? 'web'
const openMenu = ref<string | null>(null)
const openSubmenu = ref<string | null>(null)
const isMaximized = ref(false)
;(window as any).electronAPI?.onWindowState((state: string) => {
  isMaximized.value = state === 'maximized'
})
function minimize() {
  ;(window as any).electronAPI?.minimize()
}
function maximize() {
  ;(window as any).electronAPI?.maximize()
}
function close() {
  ;(window as any).electronAPI?.close()
}
const isElectron = !!(window as any).electronAPI

defineProps<{
  showGrid: boolean
  dimBackground: boolean
  snapToGrid: boolean
}>()

const emit = defineEmits<{
  'upload-photo': []
  save: []
  load: []
  export: []
  'open-settings': []
  undo: []
  redo: []
  duplicate: []
  delete: []
  'reset-zoom': []
  'open-canvas-settings': []
  'toggle-grid': []
  'toggle-dim-bg': []
  'toggle-snap': []
  'open-shortcuts': []
  'open-about': []
}>()

function toggleMenu(name: string) {
  openMenu.value = openMenu.value === name ? null : name
  openSubmenu.value = null
}

function hoverMenu(name: string) {
  if (openMenu.value && openMenu.value !== name) {
    openMenu.value = name
    openSubmenu.value = null
  }
}

function closeAll() {
  openMenu.value = null
  openSubmenu.value = null
}

function fire(event: string) {
  emit(event as any)
  closeAll()
}

function onWindowClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.tb-menu') && !target.closest('.dropdown')) closeAll()
}
window.addEventListener('click', onWindowClick)
</script>

<template>
  <div class="titlebar">
    <!-- Logo -->
    <div class="tb-logo">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 2a9 9 0 0 1 9 9c0 4.5-3 8-7 9.5V22H10v-1.5C6 19 3 15.5 3 11a9 9 0 0 1 9-9z" />
        <path d="M9 12c0-1.7 1.3-3 3-3s3 1.3 3 3" />
      </svg>
      <span class="tb-logo-name">Serere</span>
    </div>

    <!-- Menu items -->
    <div class="tb-menu" style="-webkit-app-region: no-drag">
      <div
        class="tb-menu-item"
        :class="{ open: openMenu === 'file' }"
        @click="toggleMenu('file')"
        @mouseenter="hoverMenu('file')"
      >
        File
        <div v-if="openMenu === 'file'" class="dropdown" @click.stop>
          <div class="dd-item" @click="fire('upload-photo')">Upload Photo</div>
          <div class="dd-sep" />
          <div class="dd-item" @click="fire('save')">
            Save<span class="dd-shortcut">Ctrl+S</span>
          </div>
          <div class="dd-item" @click="fire('load')">Load</div>
          <div class="dd-item" @click="fire('export')">Export PNG</div>
          <div class="dd-sep" />
          <div class="dd-item" @click="fire('open-canvas-settings')">Canvas Settings...</div>
          <div class="dd-sep" />
          <div
            class="dd-item submenu-trigger"
            @mouseenter="openSubmenu = 'preferences'"
            @mouseleave="openSubmenu = null"
          >
            Preferences <span class="dd-arrow">▸</span>
            <div v-if="openSubmenu === 'preferences'" class="dropdown submenu">
              <div class="dd-item" @click="fire('open-settings')">Settings...</div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="tb-menu-item"
        :class="{ open: openMenu === 'edit' }"
        @click="toggleMenu('edit')"
        @mouseenter="hoverMenu('edit')"
      >
        Edit
        <div v-if="openMenu === 'edit'" class="dropdown" @click.stop>
          <div class="dd-item" @click="fire('undo')">
            Undo<span class="dd-shortcut">Ctrl+Z</span>
          </div>
          <div class="dd-item" @click="fire('redo')">
            Redo<span class="dd-shortcut">Ctrl+Y</span>
          </div>
          <div class="dd-sep" />
          <div class="dd-item" @click="fire('duplicate')">
            Duplicate<span class="dd-shortcut">Ctrl+D</span>
          </div>
          <div class="dd-item" @click="fire('delete')">
            Delete<span class="dd-shortcut">Del</span>
          </div>
        </div>
      </div>

      <div
        class="tb-menu-item"
        :class="{ open: openMenu === 'view' }"
        @click="toggleMenu('view')"
        @mouseenter="hoverMenu('view')"
      >
        View
        <div v-if="openMenu === 'view'" class="dropdown" @click.stop>
          <div class="dd-item" @click="fire('toggle-grid')">
            <span
              ><span class="check">{{ showGrid ? '✓' : '' }}</span> Show Grid</span
            >
          </div>
          <div class="dd-item" @click="fire('toggle-dim-bg')">
            <span
              ><span class="check">{{ dimBackground ? '✓' : '' }}</span> Dim Background</span
            >
          </div>
          <div class="dd-item" @click="fire('toggle-snap')">
            <span
              ><span class="check">{{ snapToGrid ? '✓' : '' }}</span> Snap to Grid</span
            >
          </div>
          <div class="dd-sep" />
          <div class="dd-item" @click="fire('reset-zoom')">
            Reset Zoom<span class="dd-shortcut">Ctrl+0</span>
          </div>
        </div>
      </div>

      <div
        class="tb-menu-item"
        :class="{ open: openMenu === 'help' }"
        @click="toggleMenu('help')"
        @mouseenter="hoverMenu('help')"
      >
        Help
        <div v-if="openMenu === 'help'" class="dropdown" @click.stop>
          <div class="dd-item" @click="fire('open-shortcuts')">Keyboard Shortcuts</div>
          <div class="dd-item" @click="fire('open-about')">About</div>
        </div>
      </div>
    </div>

    <!-- Drag region + centered title -->
    <div class="tb-drag">
      <span class="tb-title">Serere</span>
    </div>
    <div v-if="isElectron" class="win-controls" style="-webkit-app-region: no-drag">
      <button class="wc-btn" @click="minimize">
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path d="M14 8v1H3V8h11z" />
        </svg>
      </button>
      <button class="wc-btn" @click="maximize">
        <svg
          v-if="!isMaximized"
          width="18"
          height="18"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path d="M3 3v10h10V3H3zm9 9H4V4h8v8z" />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path d="M3 5v9h9V5H3zm8 8H4V6h7v7z" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M5 5h1V4h7v7h-1v1h2V3H5v2z" />
        </svg>
      </button>
      <button class="wc-btn close" @click="close">
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.116 8l-4.558 4.558.884.884L8 8.884l4.558 4.558.884-.884L8.884 8l4.558-4.558-.884-.884L8 7.116 3.442 2.558l-.884.884L7.116 8z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  height: 36px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  -webkit-app-region: drag;
  position: relative;
}
.tb-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  color: var(--accent);
  flex-shrink: 0;
}
.tb-logo-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent);
}
.tb-menu {
  display: flex;
  align-items: center;
  height: 100%;
  flex-shrink: 0;
}
.tb-menu-item {
  padding: 0 10px;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
}
.tb-menu-item:hover,
.tb-menu-item.open {
  background: var(--hover);
  color: var(--text-primary);
}
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 4px;
  min-width: 200px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}
.dd-item {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  position: relative;
}
.dd-item:hover {
  background: var(--hover);
  color: var(--text-primary);
}
.dd-shortcut {
  font-size: 10px;
  color: var(--text-muted);
}
.dd-sep {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
.dd-arrow {
  font-size: 10px;
  color: var(--text-muted);
}
.submenu {
  top: 0;
  left: 100%;
  margin-left: -2px;
}
.tb-drag {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tb-title {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  pointer-events: none;
}
.win-controls {
  display: flex;
  height: 100%;
  flex-shrink: 0;
}
.wc-btn {
  width: 46px;
  height: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wc-btn:hover {
  background: var(--hover);
  color: var(--text-primary);
}
.wc-btn.close:hover {
  background: #e81123;
  color: #fff;
}
.check {
  display: inline-block;
  width: 14px;
  color: var(--accent);
}
</style>
