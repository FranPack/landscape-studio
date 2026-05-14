<script setup lang="ts">
type Tool = 'select' | 'ground-cover' | 'hardscape' | 'structure' | 'line-fence' | 'line-property'

defineProps<{
  activeTool: Tool
}>()

defineEmits<{
  'set-tool': [tool: Tool]
}>()
</script>

<template>
  <div class="toolstrip">
    <div class="tool" :class="{ active: activeTool === 'select' }" title="Select (V)" @click="$emit('set-tool', 'select')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 3l14 9-7 1-3 7z"/>
      </svg>
    </div>
    <div class="tool-sep" />
    <div class="tool" :class="{ active: activeTool === 'ground-cover' }" title="Ground Cover" @click="$emit('set-tool', 'ground-cover')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="3 12 12 3 21 12 12 21" />
      </svg>
    </div>
    <div class="tool" :class="{ active: activeTool === 'hardscape' }" title="Hardscape" @click="$emit('set-tool', 'hardscape')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    </div>
    <div class="tool" :class="{ active: activeTool === 'structure' }" title="Structure" @click="$emit('set-tool', 'structure')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 21V10l9-7 9 7v11" />
        <path d="M9 21V12h6v9" />
      </svg>
    </div>
    <div class="tool-sep" />
    <div class="tool" :class="{ active: activeTool === 'line-fence' }" title="Fence" @click="$emit('set-tool', 'line-fence')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 20V8l3-3 3 3v12" />
        <path d="M9 20V8l3-3 3 3v12" />
        <path d="M15 20V8l3-3 3 3v12" />
        <line x1="3" y1="11" x2="21" y2="11" />
        <line x1="3" y1="16" x2="21" y2="16" />
      </svg>
    </div>
    <div class="tool" :class="{ active: activeTool === 'line-property' }" title="Property Line" @click="$emit('set-tool', 'line-property')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3">
        <line x1="3" y1="12" x2="21" y2="12" />
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
