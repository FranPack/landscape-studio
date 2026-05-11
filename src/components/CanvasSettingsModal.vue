<script setup lang="ts">
defineProps<{
  scaleFeetPer100px: number | null
  units: 'ft' | 'm'
  projectName: string
}>()

defineEmits<{
  close: []
  'update:scale-feet-per100px': [value: number | null]
  'update:units': [value: 'ft' | 'm']
  'update:project-name': [value: string]
}>()
</script>

<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Canvas Settings</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="setting-row">
          <label>Project Name</label>
          <input
            type="text"
            class="text-input"
            :value="projectName"
            @input="$emit('update:project-name', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="setting-row">
          <label>Units</label>
          <div class="seg-toggle">
            <button :class="{ active: units === 'ft' }" @click="$emit('update:units', 'ft')">Feet</button>
            <button :class="{ active: units === 'm' }" @click="$emit('update:units', 'm')">Meters</button>
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
            <span class="setting-unit">{{ units }} per 100px</span>
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
.seg-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.seg-toggle button {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 5px 12px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}
.seg-toggle button.active {
  background: var(--accent);
  color: #000;
}
.setting-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.text-input,
.setting-inline input {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 5px 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
}
.text-input { width: 200px; }
.setting-inline input { width: 80px; }
.setting-unit {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
