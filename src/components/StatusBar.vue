<script setup lang="ts">
defineProps<{
  zoom: number
  activeTool: string
}>()

defineEmits<{
  'toggle-theme': []
}>()
</script>

<template>
  <div class="statusbar">
    <div class="st">Zoom <span>{{ Math.round(zoom * 100) }}%</span></div>
    <div class="st-sep" />
    <div class="st"><span>{{ activeTool }}</span> tool</div>
    <div class="st-spacer" />
    <div class="theme-toggle" @click="$emit('toggle-theme')">◑ Theme</div>
  </div>
</template>

<style scoped>
.statusbar {
  height: 24px;
  background: var(--bg-panel);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 16px;
  flex-shrink: 0;
  user-select: none;
}
.st {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
}
.st span { color: var(--text-secondary); }
.st-sep { width: 1px; height: 10px; background: var(--border); }
.st-spacer { flex: 1; }
.theme-toggle {
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--border);
}
.theme-toggle:hover { color: var(--text-secondary); }
</style>
