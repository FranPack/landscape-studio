<script setup lang="ts">
defineEmits<{
  close: []
}>()
const isMac = navigator.platform.includes('Mac') || navigator.userAgent.includes('Mac')
function k(key: string) {
  if (!isMac) return key
  const map: Record<string, string> = {
    Ctrl: '⌘',
    Shift: '⇧',
    Alt: '⌥',
  }
  return map[key] ?? key
}
const shortcuts = [
  {
    section: 'Selection',
    items: [
      { keys: ['Left click'], action: 'Select plant/cover' },
      { keys: ['Right click'], action: 'Open context menu' },
      { keys: ['Delete'], action: 'Delete selected' },
      { keys: ['Esc'], action: 'Deselect / cancel draw' },
      { keys: ['Ctrl', 'D'], action: 'Duplicate selected' },
    ],
  },
  {
    section: 'History',
    items: [
      { keys: ['Ctrl', 'Z'], action: 'Undo' },
      {
        keys: [
          ['Ctrl', 'Y'],
          ['Ctrl', 'Shift', 'Z'],
        ],
        action: 'Redo',
      },
    ],
  },
  {
    section: 'Canvas',
    items: [
      { keys: ['Ctrl', '0'], action: 'Reset zoom' },
      { keys: ['Scroll'], action: 'Zoom in/out' },
      {
        keys: [
          ['Middle click', 'Drag'],
          ['Space', 'Left click', 'Drag'],
        ],
        action: 'Pan',
      },
    ],
  },
  {
    section: 'Drawing',
    items: [
      { keys: ['Left click'], action: 'Place vertex' },
      { keys: ['Click first vertex'], action: 'Close polygon (3+ points)' },
      { keys: ['Double click'], action: 'Close polygon' },
      { keys: ['Backspace'], action: 'Remove last vertex' },
    ],
  },
]
</script>

<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Keyboard Shortcuts</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div v-for="section in shortcuts" :key="section.section" class="ks-section">
          <div class="ks-section-title">{{ section.section }}</div>
          <div v-for="item in section.items" :key="item.action" class="ks-row">
            <span class="ks-action">{{ item.action }}</span>
            <span class="ks-keys">
              <template
                v-for="(combo, ci) in Array.isArray(item.keys[0]) ? item.keys : [item.keys]"
                :key="ci"
              >
                <template v-for="(key, i) in combo" :key="i">
                  <kbd>{{ k(key) }}</kbd>
                  <span v-if="i < combo.length - 1" class="ks-plus">+</span>
                </template>
                <span
                  v-if="ci < (Array.isArray(item.keys[0]) ? item.keys.length : 1) - 1"
                  class="ks-or"
                  >or</span
                >
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}
.modal-close:hover {
  color: var(--text-primary);
}
.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
}
.ks-section {
  margin-bottom: 18px;
}
.ks-section:last-child {
  margin-bottom: 0;
}
.ks-section-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}
.ks-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
}
.ks-action {
  color: var(--text-secondary);
}
.ks-keys {
  display: flex;
  gap: 4px;
}
.ks-plus {
  color: var(--text-muted);
  font-size: 11px;
  align-self: center;
}
.ks-or {
  color: var(--text-muted);
  font-size: 10px;
  margin: 0 4px;
  align-self: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
kbd {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-primary);
}
</style>
