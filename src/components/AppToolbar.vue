<script setup lang="ts">
defineProps<{
  hasSelection: boolean
  hasPhoto: boolean
}>()

defineEmits<{
  'upload-photo': []
  'delete-selected': []
  'flip-selected': []
  'reset-zoom': []
  export: []
}>()
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="app-name">🌿 Landscape Studio</span>
    </div>
    <div class="toolbar-center">
      <button class="btn btn-primary" @click="$emit('upload-photo')">📷 Upload Photo</button>
      <button class="btn" @click="$emit('reset-zoom')">⊙ Reset Zoom</button>

      <button class="btn" :disabled="!hasSelection" @click="$emit('flip-selected')">↔ Flip</button>
      <button class="btn btn-danger" :disabled="!hasSelection" @click="$emit('delete-selected')">
        🗑 Delete
      </button>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-success" :disabled="!hasPhoto" @click="$emit('export')">
        💾 Export
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
</style>
