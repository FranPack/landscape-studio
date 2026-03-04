<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import { PLANTS, type PlantAsset } from '@/data/plants'

const emit = defineEmits<{
  'plant-selected': [plant: PlantAsset]
}>()

const drag = useDragStore()
const search = ref('')

const plants = PLANTS

const filteredPlants = computed(() =>
  plants.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase())),
)

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
  if (!didDrag) {
    emit('plant-selected', plant)
  }
}

function onTouchStart(e: TouchEvent, plant: PlantAsset) {
  const touch = e.touches[0]
  if (!touch) return
  drag.startDrag(plant, touch.clientX, touch.clientY)
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h3>Plants</h3>
      <input v-model="search" class="search" type="text" placeholder="Search plants..." />
    </div>
    <div class="plant-grid">
      <div
        v-for="plant in filteredPlants"
        :key="plant.name"
        class="plant-card"
        @mousedown="onMouseDown($event, plant)"
        @touchstart.prevent="onTouchStart($event, plant)"
        @dragstart.prevent
        @click="onClick($event, plant)"
      >
        <div class="plant-thumb">
          <img :src="plant.src" :alt="plant.name" draggable="false" />
        </div>
        <span class="plant-name">{{ plant.name }}</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background: #222;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid #333;
}

.sidebar-header h3 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888;
  margin-bottom: 8px;
}

.search {
  width: 100%;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #333;
  color: #fff;
  font-size: 13px;
  outline: none;
}

.search:focus {
  border-color: #7ec87e;
}

.plant-grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-content: start;
}

.plant-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
}

.plant-card:hover {
  background: #333;
  border-color: #7ec87e;
}

.plant-thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  background: #2a2a2a;
}

.plant-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plant-name {
  font-size: 11px;
  color: #aaa;
  text-align: center;
  line-height: 1.2;
}
</style>
