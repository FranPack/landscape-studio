<script setup lang="ts">
defineProps<{
  theme: 'dark' | 'light'
  scaleFeetPer100px: number | null
}>()

defineEmits<{
  close: []
  'toggle-theme': []
  'update:scale-feet-per100px': [value: number | null]
}>()
</script>

<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Settings</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="setting-row">
          <label>Theme</label>
          <div class="theme-toggle">
            <button :class="{ active: theme === 'dark' }" @click="theme !== 'dark' && $emit('toggle-theme')">Dark</button>
            <button :class="{ active: theme === 'light' }" @click="theme !== 'light' && $emit('toggle-theme')">Light</button>
          </div>
        </div>

        <div class="setting-row">
          <label>Scale</label>
          <div class="setting-inline">
            <input
              type="number"
              min="0"
              :value="scaleFeetPer100px ?? ''"
              placeholder="—"
              @change="$emit('update:scale-feet-per100px', ($event.target as HTMLInputElement).value ? +($event.target as HTMLInputElement).value : null)"
            />
            <span class="setting-unit">ft per 100px</span>
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
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
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
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 16px 20px; }
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.setting-row:last-child { border-bottom: none; }
.setting-row label {
  font-size: 12px;
  color: var(--text-secondary);
}
.theme-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.theme-toggle button {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 5px 12px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}
.theme-toggle button.active {
  background: var(--accent);
  color: #000;
}
.setting-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.setting-inline input {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 5px 8px;
  font-size: 12px;
  font-family: inherit;
  width: 80px;
  outline: none;
}
.setting-unit {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
