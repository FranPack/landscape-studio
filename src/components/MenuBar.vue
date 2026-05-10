<script setup lang="ts">
defineEmits<{
  save: []
  load: []
  export: []
  undo: []
  redo: []
  'upload-photo': []
}>()
</script>

<template>
  <div class="menubar">
    <div class="menu-item" @click="$emit('upload-photo')">File</div>
    <div class="menu-item">Edit</div>
    <div class="menu-item">View</div>
    <div class="menu-item">Help</div>
  </div>
</template>

<style scoped>
.menubar {
  height: 28px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 2px;
  flex-shrink: 0;
  user-select: none;
}
.menu-item {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
}
.menu-item:hover {
  background: var(--hover);
  color: var(--text-primary);
}
</style>
