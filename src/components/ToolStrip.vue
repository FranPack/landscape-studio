<script setup lang="ts">
defineProps<{
  drawMode: boolean
}>()

defineEmits<{
  'toggle-draw-mode': []
}>()
</script>

<template>
  <div class="toolstrip">
    <div class="tool" :class="{ active: !drawMode }" title="Select (V)" @click="$emit('toggle-draw-mode')" v-if="drawMode">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-7 1-3 7z"/></svg>
    </div>
    <div class="tool" :class="{ active: !drawMode }" title="Select" @click="() => {}" v-if="!drawMode">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-7 1-3 7z"/></svg>
    </div>
    <div class="tool" :class="{ active: drawMode }" title="Draw Ground Cover (D)" @click="$emit('toggle-draw-mode')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 20 2 20"/></svg>
    </div>
    <div class="tool-sep" />
    <div class="tool" title="Reset Zoom (Ctrl+0)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.toolstrip {
  width: 44px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 2px;
  flex-shrink: 0;
}
.tool {
  width: 32px;
  height: 32px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
}
.tool:hover { background: var(--hover); color: var(--text-secondary); }
.tool.active { background: var(--accent-subtle); color: var(--accent); }
.tool svg { width: 15px; height: 15px; }
.tool-sep { width: 22px; height: 1px; background: var(--border); margin: 4px 0; }
</style>
