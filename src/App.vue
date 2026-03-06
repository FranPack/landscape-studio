<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import Sidebar from '@/components/AppSidebar.vue'
import Toolbar from '@/components/AppToolbar.vue'
import CanvasView from '@/components/CanvasView.vue'
import { useHistoryStore } from '@/stores/historyStore'
import { useKeyboard } from '@/composables/useKeyboard'

const history = useHistoryStore()

interface Plant {
  id: number
  src: string
  name: string
  x: number
  y: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  rotation: number
}

interface GroundCover {
  id: number
  points: number[] // flat [x1,y1,x2,y2,...] stage coords
  material: string // 'turf' | 'mulch' | 'gravel' | 'sand' | 'concrete'
  fill: string // hex color
  opacity: number
}

const backgroundImage = ref<string | null>(null)
const plants = ref<Plant[]>([])
const selectedId = ref<number | null>(null)
const selectedCoverId = ref<number | null>(null)
let nextPlantId = 1
const fileInput = ref<HTMLInputElement | null>(null)
const canvasRef = ref<InstanceType<typeof CanvasView> | null>(null)
const groundCovers = ref<GroundCover[]>([])
const drawMode = ref(false)
const selectedMaterial = ref<{ name: string; fill: string }>({ name: 'turf', fill: '#4a7c3f' })
// eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
let nextCoverId = 1
const loadInput = ref<HTMLInputElement | null>(null)

const materials = [
  { name: 'turf', fill: '#4a7c3f' },
  { name: 'mulch', fill: '#6b3a2a' },
  { name: 'gravel', fill: '#9e9e9e' },
  { name: 'sand', fill: '#c2a96e' },
  { name: 'concrete', fill: '#b0b0b0' },
]

function triggerPhotoUpload() {
  fileInput.value?.click()
}

function onPhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    backgroundImage.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

function addPlant(plant: { src: string; name: string }, x?: number, y?: number) {
  history.push(plants.value, groundCovers.value)
  const center = canvasRef.value?.getCenter() ?? { x: 200, y: 200 }
  plants.value.push({
    id: nextPlantId++,
    src: plant.src,
    name: plant.name,
    x: x ?? center.x,
    y: y ?? center.y,
    width: 150,
    height: 150,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  })
}
function addGroundCover(cover: GroundCover) {
  history.push(plants.value, groundCovers.value)
  groundCovers.value.push(cover)
}
function onCoverMoved(payload: { id: number; points: number[] }) {
  const cover = groundCovers.value.find((c) => c.id === payload.id)
  if (cover) cover.points = payload.points
}

function deleteSelected() {
  if (selectedId.value) {
    history.push(plants.value, groundCovers.value)
    plants.value = plants.value.filter((p) => p.id !== selectedId.value)
    selectedId.value = null
  } else if (selectedCoverId.value) {
    history.push(plants.value, groundCovers.value)
    groundCovers.value = groundCovers.value.filter((c) => c.id !== selectedCoverId.value)
    selectedCoverId.value = null
  }
}

function flipSelected() {
  const plant = plants.value.find((p) => p.id === selectedId.value)
  if (!plant) return
  history.push(plants.value, groundCovers.value)
  plant.scaleX *= -1
}

function exportImage() {
  canvasRef.value?.exportImage()
}

const drag = useDragStore()

function onMouseMove(e: MouseEvent) {
  if (drag.dragging) drag.updatePosition(e.clientX, e.clientY)
}

function onMouseUp(e: MouseEvent) {
  if (!drag.dragging || !drag.plant) return
  const pos = canvasRef.value?.getCanvasPosition(e.clientX, e.clientY)
  if (pos) addPlant(drag.plant, pos.x, pos.y)
  drag.endDrag()
}

function onTouchMove(e: TouchEvent) {
  if (drag.dragging) {
    const touch = e.touches[0]
    if (!touch) return
    drag.updatePosition(touch.clientX, touch.clientY)
  }
}

function onTouchEnd(e: TouchEvent) {
  if (!drag.dragging || !drag.plant) return
  const touch = e.changedTouches[0]
  if (!touch) return
  const pos = canvasRef.value?.getCanvasPosition(touch.clientX, touch.clientY)
  if (pos) addPlant(drag.plant, pos.x, pos.y)
  drag.endDrag()
}
function undo() {
  const prev = history.undo(plants.value, groundCovers.value)
  if (prev) {
    plants.value = prev.plants
    groundCovers.value = prev.groundCovers
    selectedId.value = null
    selectedCoverId.value = null
  }
}

function redo() {
  const next = history.redo(plants.value, groundCovers.value)
  if (next) {
    plants.value = next.plants
    groundCovers.value = next.groundCovers
    selectedId.value = null
    selectedCoverId.value = null
  }
}
function resetZoom() {
  canvasRef.value?.resetZoom()
}

function saveProject() {
  const data = {
    version: 1,
    backgroundImage: backgroundImage.value,
    plants: plants.value,
    groundCovers: groundCovers.value,
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'landscape.landscape'
  a.click()
  URL.revokeObjectURL(url)
}

function loadProject() {
  loadInput.value?.click()
}

function onLoadFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target?.result as string)
      backgroundImage.value = data.backgroundImage ?? null
      plants.value = data.plants ?? []
      groundCovers.value = data.groundCovers ?? []
      nextPlantId = Math.max(0, ...plants.value.map((p: Plant) => p.id)) + 1
      selectedId.value = null
      selectedCoverId.value = null
      history.clear()
    } catch {
      console.error('Failed to load project')
    }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

useKeyboard({
  onDelete: deleteSelected,
  onEscape: () => {
    selectedId.value = null
    canvasRef.value?.clearSelection()
    canvasRef.value?.cancelDraw()
  },

  onUndo: undo,
  onRedo: redo,
  onReset: resetZoom,
})
onMounted(() => {
  if (import.meta.env.DEV) {
    backgroundImage.value = '/default.png'
  }
})
</script>

<template>
  <div
    class="app"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @dragstart.prevent
  >
    <Sidebar @plant-selected="addPlant" />
    <main class="canvas-area">
      <Toolbar
        :has-selection="!!selectedId || !!selectedCoverId"
        :has-photo="!!backgroundImage"
        @upload-photo="triggerPhotoUpload"
        @delete-selected="deleteSelected"
        @flip-selected="flipSelected"
        @export="exportImage"
        @reset-zoom="resetZoom"
        :draw-mode="drawMode"
        :selected-material="selectedMaterial"
        :materials="materials"
        @toggle-draw-mode="drawMode = !drawMode"
        @select-material="selectedMaterial = $event"
        @save="saveProject"
        @load="loadProject"
      />
      <CanvasView
        ref="canvasRef"
        :background-image="backgroundImage"
        :plants="plants"
        @selection-changed="selectedId = $event"
        @push-history="history.push(plants, groundCovers)"
        :ground-covers="groundCovers"
        :draw-mode="drawMode"
        :selected-material="selectedMaterial"
        :selected-cover-id="selectedCoverId"
        @add-ground-cover="addGroundCover($event)"
        @cover-selection-changed="
          selectedCoverId = $event; // prettier-ignore
          selectedId = null; // prettier-ignore
          canvasRef?.clearSelection(); // prettier-ignore
        "
        @cover-moved="onCoverMoved($event)"
      />
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onPhotoUpload"
      />
      <input
        ref="loadInput"
        type="file"
        accept=".landscape"
        style="display: none"
        @change="onLoadFile"
      />
    </main>
    <!-- Drag ghost -->
    <div
      v-if="drag.dragging"
      class="drag-ghost"
      :style="{ left: drag.ghostX + 'px', top: drag.ghostY + 'px' }"
    >
      <img :src="drag.plant?.src" />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1a1a1a;
  color: #fff;
  height: 100vh;
  overflow: hidden;
}

.app {
  display: flex;
  height: 100vh;
  user-select: none;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.drag-ghost {
  position: fixed;
  width: 80px;
  height: 80px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  opacity: 0.85;
  z-index: 1000;
}

.drag-ghost img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
