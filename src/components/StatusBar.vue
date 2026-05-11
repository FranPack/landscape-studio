<script setup lang="ts">
defineProps<{
  zoom: number
  cursorX: number | null
  cursorY: number | null
  scaleFeetPer100px: number | null
  units: 'ft' | 'm'
  activeTool: string
}>()
</script>

<template>
  <div class="statusbar">
    <div class="st">Zoom <span>{{ Math.round(zoom * 100) }}%</span></div>
    <div class="st-sep" />
    <div class="st" v-if="cursorX !== null && cursorY !== null">
      X <span>{{ Math.round(cursorX) }}</span>
      Y <span>{{ Math.round(cursorY) }}</span>
    </div>
    <div class="st-sep" v-if="scaleFeetPer100px" />
    <div class="st" v-if="scaleFeetPer100px">
      Scale <span>{{ scaleFeetPer100px }} {{ units }} / 100px</span>
    </div>
    <div class="st-spacer" />
    <div class="st"><span>{{ activeTool }}</span> tool</div>
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
  display: flex;
  gap: 6px;
}
.st span { color: var(--text-secondary); }
.st-sep { width: 1px; height: 10px; background: var(--border); }
.st-spacer { flex: 1; }
</style>
