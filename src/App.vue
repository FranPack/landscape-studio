<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import CanvasView from '@/components/CanvasView.vue'
import { useHistoryStore } from '@/stores/historyStore'
import { useKeyboard } from '@/composables/useKeyboard'
import PropertyBar from './components/PropertyBar.vue'
import ToolStrip from './components/ToolStrip.vue'
import PlantLibrary from './components/PlantLibrary.vue'
import StatusBar from './components/StatusBar.vue'
import TitleBar from './components/TitleBar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import CanvasSettingsModal from '@/components/CanvasSettingsModal.vue'

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

const history = useHistoryStore()
const isElectron = navigator.userAgent.includes('Electron')
const stageZoom = ref(1)
const theme = ref<'dark' | 'light'>((localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark')
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
const projectName = ref('my-landscape')
const scaleFeetPer100px = ref<number | null>(null)
const contextMenu = ref<{ x: number; y: number } | null>(null)
const contextMenuRef = ref<HTMLDivElement | null>(null)
const showSettings = ref(false)
const showCanvasSettings = ref(false)
const units = ref<'ft' | 'm'>('ft')
const showGrid = ref(localStorage.getItem('showGrid') === 'true')
const dimBackground = ref(localStorage.getItem('dimBackground') === 'true')
const snapToGrid = ref(localStorage.getItem('snapToGrid') === 'true')
const cursorPos = ref<{ x: number; y: number } | null>(null)

const materials = [
  { name: 'turf', fill: '#4a7c3f' },
  { name: 'mulch', fill: '#6b3a2a' },
  { name: 'gravel', fill: '#9e9e9e' },
  { name: 'sand', fill: '#c2a96e' },
  { name: 'concrete', fill: '#b0b0b0' },
]

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.toggle('light', theme.value === 'light')
  localStorage.setItem('theme', theme.value)
  canvasRef.value?.redraw()
}

function flipSelectedV() {
  const plant = plants.value.find((p) => p.id === selectedId.value)
  if (!plant) return
  history.push(plants.value, groundCovers.value)
  plant.scaleY *= -1
}

function triggerPhotoUpload() {
  fileInput.value?.click()
}
function onContextMenu(payload: {
  x: number
  y: number
  targetType: 'plant' | 'cover'
  targetId: number
}) {
  if (payload.targetType === 'plant') {
    selectedId.value = payload.targetId
    selectedCoverId.value = null
  } else {
    selectedCoverId.value = payload.targetId
    selectedId.value = null
  }
  contextMenu.value = { x: payload.x, y: payload.y }
}

function closeContextMenu() {
  contextMenu.value = null
}
function onWindowClick(e: MouseEvent) {
  if (contextMenuRef.value && !contextMenuRef.value.contains(e.target as Node)) {
    closeContextMenu()
  }
}
watch(contextMenu, (val) => {
  if (val) {
    window.addEventListener('click', onWindowClick)
    window.addEventListener('wheel', onWheel, { passive: false })
  } else {
    window.removeEventListener('click', onWindowClick)
    window.removeEventListener('wheel', onWheel)
  }
})

function onWheel(e: WheelEvent) {
  e.preventDefault()
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
function duplicateSelected() {
  if (selectedId.value) {
    const plant = plants.value.find((p) => p.id === selectedId.value)
    if (!plant) return
    history.push(plants.value, groundCovers.value)
    plants.value.push({ ...plant, id: nextPlantId++, x: plant.x + 20, y: plant.y + 20 })
  } else if (selectedCoverId.value) {
    const cover = groundCovers.value.find((c) => c.id === selectedCoverId.value)
    if (!cover) return
    history.push(plants.value, groundCovers.value)
    groundCovers.value.push({ ...cover, id: Date.now(), points: cover.points.map((v) => v + 20) })
  }
}

const selectedCoverOpacity = computed(() => {
  if (!selectedCoverId.value) return null
  return groundCovers.value.find((c) => c.id === selectedCoverId.value)?.opacity ?? null
})

function setCoverOpacity(value: number) {
  const cover = groundCovers.value.find((c) => c.id === selectedCoverId.value)
  if (cover) cover.opacity = value
}

function commitCoverOpacity() {
  history.push(plants.value, groundCovers.value)
}

function bringForward() {
  if (selectedId.value) {
    const idx = plants.value.findIndex((p) => p.id === selectedId.value)
    if (idx < plants.value.length - 1) {
      history.push(plants.value, groundCovers.value)
      const arr = [...plants.value]
      const tmp = arr[idx]!
      arr[idx] = arr[idx + 1]!
      arr[idx + 1] = tmp
      plants.value = arr
    }
  } else if (selectedCoverId.value) {
    const idx = groundCovers.value.findIndex((c) => c.id === selectedCoverId.value)
    if (idx < groundCovers.value.length - 1) {
      history.push(plants.value, groundCovers.value)
      const arr = [...groundCovers.value]
      const tmp = arr[idx]!
      arr[idx] = arr[idx + 1]!
      arr[idx + 1] = tmp
      groundCovers.value = arr
    }
  }
}

function sendBack() {
  if (selectedId.value) {
    const idx = plants.value.findIndex((p) => p.id === selectedId.value)
    if (idx > 0) {
      history.push(plants.value, groundCovers.value)
      const arr = [...plants.value]
      const tmp = arr[idx]!
      arr[idx] = arr[idx - 1]!
      arr[idx - 1] = tmp
      plants.value = arr
    }
  } else if (selectedCoverId.value) {
    const idx = groundCovers.value.findIndex((c) => c.id === selectedCoverId.value)
    if (idx > 0) {
      history.push(plants.value, groundCovers.value)
      const arr = [...groundCovers.value]
      const tmp = arr[idx]!
      arr[idx] = arr[idx - 1]!
      arr[idx - 1] = tmp
      groundCovers.value = arr
    }
  }
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
    projectName: projectName.value,
    backgroundImage: backgroundImage.value,
    plants: plants.value,
    groundCovers: groundCovers.value,
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.value}.landscape`
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
      projectName.value = data.projectName ?? 'my-landscape'
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

function toggleGrid() {
  showGrid.value = !showGrid.value
  localStorage.setItem('showGrid', String(showGrid.value))
}

function toggleDimBackground() {
  dimBackground.value = !dimBackground.value
  localStorage.setItem('dimBackground', String(dimBackground.value))
}
function toggleSnapToGrid() {
  snapToGrid.value = !snapToGrid.value
  localStorage.setItem('snapToGrid', String(snapToGrid.value))
}

useKeyboard({
  onDelete: deleteSelected,
  onEscape: () => {
    selectedId.value = null
    selectedCoverId.value = null
    canvasRef.value?.clearSelection()
    canvasRef.value?.cancelDraw()
  },

  onUndo: undo,
  onRedo: redo,
  onReset: resetZoom,
  onDuplicate: duplicateSelected,
  onRemoveVertex: () => {
    if (drawMode.value) canvasRef.value?.removeLastVertex()
    else deleteSelected()
  },
})
onMounted(() => {
  if (import.meta.env.DEV) backgroundImage.value = '/default.png'
  document.documentElement.classList.toggle('light', theme.value === 'light')
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
    <TitleBar
      @save="saveProject"
      @load="loadProject"
      @export="exportImage"
      @undo="undo"
      @redo="redo"
      @upload-photo="triggerPhotoUpload"
      @duplicate="duplicateSelected"
      @delete="deleteSelected"
      @reset-zoom="resetZoom"
      @open-settings="showSettings = true"
      @open-canvas-settings="showCanvasSettings = true"
      :show-grid="showGrid"
      :dim-background="dimBackground"
      @toggle-grid="toggleGrid"
      @toggle-dim-bg="toggleDimBackground"
      :snap-to-grid="snapToGrid"
      @toggle-snap="toggleSnapToGrid"
    />
    <!-- prettier-ignore -->
    <PropertyBar
      :selected-id="selectedId"
      :selected-cover-id="selectedCoverId"
      :selected-cover-opacity="selectedCoverOpacity"
      :project-name="projectName"
      :draw-mode="drawMode"
      @delete="deleteSelected"
      @flip-h="flipSelected"
      @flip-v="flipSelectedV"
      @duplicate="duplicateSelected"
      @bring-forward="bringForward"
      @send-back="sendBack"
      @opacity-changed="setCoverOpacity($event)"
      @opacity-committed="commitCoverOpacity"
      @update:project-name="projectName = $event"
      @cancel-draw="drawMode = false; canvasRef?.cancelDraw()"
    />
    <div class="workspace">
      <ToolStrip :draw-mode="drawMode" @toggle-draw-mode="drawMode = !drawMode" />
      <!-- prettier-ignore -->
      <CanvasView
        ref="canvasRef"
        :background-image="backgroundImage"
        :plants="plants"
        :ground-covers="groundCovers"
        :draw-mode="drawMode"
        :selected-material="selectedMaterial"
        :selected-cover-id="selectedCoverId"
        :scale-feet-per100px="scaleFeetPer100px"
        :disable-zoom="!!contextMenu"
        @selection-changed="selectedId = $event"
        @push-history="history.push(plants, groundCovers)"
        @add-ground-cover="addGroundCover($event)"
        @cover-selection-changed="selectedCoverId = $event; selectedId = null; canvasRef?.clearSelection()"
        @cover-moved="onCoverMoved($event)"
        @context-menu="onContextMenu"
        :show-grid="showGrid"
        :dim-background="dimBackground"
        :snap-to-grid="snapToGrid"
        @zoom-change="stageZoom = $event"
        @cursor-move="cursorPos = $event"
      />
      <PlantLibrary
        :materials="materials"
        :selected-material="selectedMaterial"
        @plant-selected="addPlant"
        @select-material="selectedMaterial = $event"
      />
    </div>
    <StatusBar
      :zoom="stageZoom"
      :cursor-x="cursorPos?.x ?? null"
      :cursor-y="cursorPos?.y ?? null"
      :scale-feet-per100px="scaleFeetPer100px"
      :units="units"
      :active-tool="drawMode ? 'Draw' : 'Select'"
    />

    <!-- Hidden inputs -->
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

    <!-- Context menu -->
    <div
      ref="contextMenuRef"
      v-if="contextMenu"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <button @click.stop="(duplicateSelected(), closeContextMenu())">Duplicate</button>
      <button @click.stop="(bringForward(), closeContextMenu())">Bring Forward</button>
      <button @click.stop="(sendBack(), closeContextMenu())">Send Back</button>
      <button class="danger" @click.stop="(deleteSelected(), closeContextMenu())">Delete</button>
    </div>

    <SettingsModal
      v-if="showSettings"
      :theme="theme"
      :scale-feet-per100px="scaleFeetPer100px"
      @close="showSettings = false"
      @toggle-theme="toggleTheme"
      @update:scale-feet-per100px="scaleFeetPer100px = $event"
    />
    <CanvasSettingsModal
      v-if="showCanvasSettings"
      :scale-feet-per100px="scaleFeetPer100px"
      :units="units"
      :project-name="projectName"
      @close="showCanvasSettings = false"
      @update:scale-feet-per100px="scaleFeetPer100px = $event"
      @update:units="units = $event"
      @update:project-name="projectName = $event"
    />
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
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-base);
  user-select: none;
  overflow: hidden;
}
.workspace {
  flex: 1;
  display: flex;
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
.context-menu {
  position: fixed;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.context-menu button {
  background: none;
  border: none;
  color: var(--text-primary);
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}
.context-menu button:hover {
  background: var(--hover);
}
.context-menu button.danger {
  color: var(--danger);
}
</style>
