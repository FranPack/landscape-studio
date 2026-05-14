<script setup lang="ts">
type Tool = 'select' | 'ground-cover' | 'hardscape' | 'structure' | 'line-fence' | 'line-property'

defineProps<{
  selectedId: number | null
  selectedCoverId: number | null
  selectedCoverOpacity: number | null
  projectName: string
  activeTool: Tool
  materials: { name: string; fill: string; category: string }[]
  selectedMaterial: { name: string; fill: string; category: string }
}>()

defineEmits<{
  delete: []
  'flip-h': []
  'flip-v': []
  duplicate: []
  'bring-forward': []
  'send-back': []
  'opacity-changed': [value: number]
  'opacity-committed': []
  'update:project-name': [value: string]
  'cancel-draw': []
  'select-material': [material: { name: string; fill: string; category: string }]
}>()

const toolLabels: Record<Tool, string> = {
  select: 'Select',
  'ground-cover': 'Ground Cover',
  hardscape: 'Hardscape',
  structure: 'Structure',
  'line-fence': 'Fence',
  'line-property': 'Property Line',
}
</script>

<template>
  <div class="propbar">
    <!-- Draw mode active -->
    <!-- Drawing tools -->
    <template v-if="activeTool !== 'select'">
      <span class="prop-tag draw">{{ toolLabels[activeTool] }}</span>
      <div class="prop-divider" />

      <!-- Material picker for polygon tools -->
      <template
        v-if="
          activeTool === 'ground-cover' || activeTool === 'hardscape' || activeTool === 'structure'
        "
      >
        <div class="material-picker">
          <button
            v-for="mat in materials.filter(
              (m) =>
                m.category ===
                (activeTool === 'ground-cover'
                  ? 'cover'
                  : activeTool === 'hardscape'
                    ? 'hardscape'
                    : 'structure'),
            )"
            :key="mat.name"
            class="mat-btn"
            :class="{ active: selectedMaterial.name === mat.name }"
            :title="mat.name"
            @click="$emit('select-material', mat)"
          >
            <span class="mat-dot" :style="{ background: mat.fill }" />
            <span class="mat-label">{{ mat.name }}</span>
          </button>
        </div>
      </template>

      <div class="prop-divider" />
      <button class="prop-btn" @click="$emit('cancel-draw')">✕ Cancel</button>
    </template>

    <!-- Plant selected -->
    <template v-else-if="selectedId">
      <span class="prop-tag">Plant</span>
      <div class="prop-divider" />
      <button class="prop-btn" @click="$emit('flip-h')">Flip H</button>
      <button class="prop-btn" @click="$emit('flip-v')">Flip V</button>
      <div class="prop-divider" />
      <button class="prop-btn" @click="$emit('duplicate')">Duplicate</button>
      <button class="prop-btn" @click="$emit('bring-forward')">↑ Forward</button>
      <button class="prop-btn" @click="$emit('send-back')">↓ Back</button>
      <div class="prop-divider" />
      <button class="prop-btn danger" @click="$emit('delete')">Delete</button>
    </template>

    <!-- Cover selected -->
    <template v-else-if="selectedCoverId">
      <span class="prop-tag">Cover</span>
      <div class="prop-divider" />
      <label class="opacity-group">
        <span>Opacity</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          :value="selectedCoverOpacity ?? 1"
          @input="$emit('opacity-changed', +($event.target as HTMLInputElement).value)"
          @change="$emit('opacity-committed')"
        />
        <span>{{ Math.round((selectedCoverOpacity ?? 1) * 100) }}%</span>
      </label>
      <div class="prop-divider" />
      <button class="prop-btn" @click="$emit('duplicate')">Duplicate</button>
      <button class="prop-btn" @click="$emit('bring-forward')">↑ Forward</button>
      <button class="prop-btn" @click="$emit('send-back')">↓ Back</button>
      <div class="prop-divider" />
      <button class="prop-btn danger" @click="$emit('delete')">Delete</button>
    </template>

    <!-- Nothing -->
    <template v-else>
      <span class="prop-hint">Select a tool to begin</span>
    </template>

    <div class="prop-spacer" />
    <input
      class="project-name"
      :value="projectName"
      @input="$emit('update:project-name', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.propbar {
  height: 38px;
  background: var(--bg-bar);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 2px;
  flex-shrink: 0;
  user-select: none;
}
.prop-tag {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-subtle);
  padding: 2px 8px;
  border-radius: 3px;
  margin-right: 6px;
}
.prop-tag.draw {
  color: #f0a500;
  background: rgba(240, 165, 0, 0.1);
}
.prop-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}
.prop-btn:hover {
  background: var(--hover);
  color: var(--text-primary);
}
.prop-btn.danger {
  color: var(--danger);
}
.prop-divider {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 4px;
}
.prop-spacer {
  flex: 1;
}
.prop-hint {
  font-size: 11px;
  color: var(--text-muted);
}
.project-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  outline: none;
  font-family: inherit;
  text-align: right;
  width: 200px;
}
.project-name:focus {
  color: var(--text-primary);
}
.opacity-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  padding: 0 6px;
}
.opacity-group input[type='range'] {
  width: 80px;
  accent-color: var(--accent);
}
.opacity-group span:last-child {
  width: 30px;
}
.material-picker {
  display: flex;
  gap: 4px;
}
.mat-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid transparent;
  color: var(--text-secondary);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  text-transform: capitalize;
}
.mat-btn:hover {
  background: var(--hover);
}
.mat-btn.active {
  border-color: var(--accent);
  background: var(--accent-subtle);
  color: var(--text-primary);
}
.mat-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}
.mat-label {
  font-size: 11px;
}
</style>
