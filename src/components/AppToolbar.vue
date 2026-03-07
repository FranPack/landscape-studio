<script setup lang="ts">
defineProps<{
  hasSelection: boolean
  hasPhoto: boolean
  drawMode: boolean
  selectedMaterial: { name: string; fill: string }
  materials: { name: string; fill: string }[]
  projectName: string
}>()

defineEmits<{
  'upload-photo': []
  'delete-selected': []
  'flip-selected': []
  'reset-zoom': []
  export: []
  'toggle-draw-mode': []
  'select-material': [mat: { name: string; fill: string }]
  save: []
  load: []
  'bring-forward': []
  'send-back': []
  'update:project-name': [value: string]
}>()
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="app-name">🌿 Landscape Studio</span>
      <input
        class="project-name-input"
        :value="projectName"
        @input="$emit('update:project-name', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="toolbar-center">
      <button class="btn btn-primary" @click="$emit('upload-photo')">📷 Upload Photo</button>
      <button class="btn" :class="{ active: drawMode }" @click="$emit('toggle-draw-mode')">
        ✏️ Draw
      </button>
      <div v-if="drawMode" class="material-picker">
        <button
          v-for="mat in materials"
          :key="mat.name"
          :class="{ active: selectedMaterial.name === mat.name }"
          :style="{ backgroundColor: mat.fill }"
          @click="$emit('select-material', mat)"
          :title="mat.name"
        />
      </div>
      <button class="btn" @click="$emit('reset-zoom')">⊙ Reset Zoom</button>
      <button class="btn" :disabled="!hasSelection" @click="$emit('bring-forward')">
        ↑ Forward
      </button>
      <button class="btn" :disabled="!hasSelection" @click="$emit('send-back')">↓ Back</button>

      <button class="btn" :disabled="!hasSelection" @click="$emit('flip-selected')">↔ Flip</button>
      <button class="btn btn-danger" :disabled="!hasSelection" @click="$emit('delete-selected')">
        🗑 Delete
      </button>
    </div>
    <div class="toolbar-right">
      <button class="btn" @click="$emit('save')">💾 Save</button>
      <button class="btn" @click="$emit('load')">📂 Load</button>
      <button class="btn btn-success" :disabled="!hasPhoto" @click="$emit('export')">
        📸 Export
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  padding: 8px 16px;
  height: 52px;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #7ec87e;
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #4a4a4a;
  background: #3a3a3a;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.btn:hover:not(:disabled) {
  background: #4a4a4a;
}

.btn-primary {
  background: #2d6a2d;
  border-color: #3d8a3d;
}

.btn-primary:hover:not(:disabled) {
  background: #3d8a3d;
}

.btn-success {
  background: #2d5a8a;
  border-color: #3d7aaa;
}

.btn-success:hover:not(:disabled) {
  background: #3d7aaa;
}

.btn-danger:hover:not(:disabled) {
  background: #8a2d2d;
  border-color: #aa3d3d;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.material-picker {
  display: flex;
  gap: 4px;
  align-items: center;
}

.material-picker button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
}

.material-picker button.active {
  border-color: #fff;
}

button.active {
  background: #4a4a4a;
  border: 1px solid #7ec87e;
  color: #7ec87e;
}
.project-name-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #444;
  color: #aaa;
  font-size: 13px;
  padding: 2px 4px;
  width: 140px;
  outline: none;
}
.project-name-input:focus {
  border-bottom-color: #7ec87e;
  color: #fff;
}
</style>
