<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import { PLANTS, type PlantAsset } from '@/data/plants'

const props = defineProps<{
  materials: { name: string; fill: string }[]
  selectedMaterial: { name: string; fill: string }
}>()

const emit = defineEmits<{
  'plant-selected': [plant: PlantAsset]
  'select-material': [material: { name: string; fill: string }]
}>()

const drag = useDragStore()
const search = ref('')
const activeTab = ref<'plants' | 'materials'>('plants')

const filteredPlants = computed(() =>
  PLANTS.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase())),
)

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3)
}

let pendingPlant: PlantAsset | null = null
let didDrag = false

function onMouseDown(e: MouseEvent, plant: PlantAsset) {
  pendingPlant = plant
  didDrag = false
  const onMouseMove = (me: MouseEvent) => {
    if (!didDrag && pendingPlant) {
      didDrag = true
      drag.startDrag(pendingPlant, me.clientX, me.clientY)
    }
  }
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    pendingPlant = null
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onClick(_e: MouseEvent, plant: PlantAsset) {
  if (!didDrag) emit('plant-selected', plant)
}

function onTouchStart(e: TouchEvent, plant: PlantAsset) {
  const touch = e.touches[0]
  if (!touch) return
  drag.startDrag(plant, touch.clientX, touch.clientY)
}
</script>

<template>
  <div class="library">
    <div class="lib-header">
      <div class="lib-title">Library</div>
      <input v-model="search" class="lib-search" placeholder="Search..." />
      <div class="lib-tabs">
        <div class="lib-tab" :class="{ active: activeTab === 'plants' }" @click="activeTab = 'plants'">Plants</div>
        <div class="lib-tab" :class="{ active: activeTab === 'materials' }" @click="activeTab = 'materials'">Materials</div>
      </div>
    </div>

    <!-- Plants tab -->
    <div v-if="activeTab === 'plants'" class="lib-body">
      <div
        v-for="plant in filteredPlants"
        :key="plant.name"
        class="plant-item"
        @mousedown="onMouseDown($event, plant)"
        @touchstart.prevent="onTouchStart($event, plant)"
        @dragstart.prevent
        @click="onClick($event, plant)"
      >
        <div class="plant-thumb">
          <img v-if="plant.src" :src="plant.src" :alt="plant.name" draggable="false" />
          <span v-else>{{ initials(plant.name) }}</span>
        </div>
        <div class="plant-info">
          <div class="plant-name">{{ plant.name }}</div>
        </div>
      </div>
    </div>

    <!-- Materials tab -->
    <div v-if="activeTab === 'materials'" class="lib-body">
      <div class="lib-section">Ground Cover</div>
      <div
        v-for="mat in materials"
        :key="mat.name"
        class="mat-item"
        :class="{ active: selectedMaterial.name === mat.name }"
        @click="$emit('select-material', mat)"
      >
        <div class="mat-dot" :style="{ background: mat.fill }" />
        <span class="mat-name">{{ mat.name.charAt(0).toUpperCase() + mat.name.slice(1) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library {
  width: 240px;
  background: var(--bg-panel);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.lib-header {
  padding: 10px 10px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.lib-title {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.lib-search {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 11px;
  font-family: inherit;
  padding: 6px 8px;
  outline: none;
  margin-bottom: 8px;
}
.lib-search::placeholder { color: var(--text-muted); }
.lib-search:focus { border-color: var(--accent); }
.lib-tabs {
  display: flex;
}
.lib-tab {
  flex: 1;
  padding: 6px 0;
  text-align: center;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.lib-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.lib-body { flex: 1; overflow-y: auto; padding: 4px 6px; }
.lib-section {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 10px 6px 4px;
}
.plant-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 6px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.plant-item:hover { background: var(--hover); }
.plant-thumb {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--hover);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
  overflow: hidden;
}
.plant-thumb img { width: 100%; height: 100%; object-fit: cover; }
.plant-name { font-size: 12px; color: var(--text-secondary); }
.mat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}
.mat-item:hover { background: var(--hover); }
.mat-item.active { border-color: var(--accent); background: var(--accent-subtle); }
.mat-dot { width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0; }
.mat-name { font-size: 12px; color: var(--text-secondary); }
.mat-item.active .mat-name { color: var(--text-primary); }
</style>
