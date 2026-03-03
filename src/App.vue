<script setup lang="ts">
import { ref } from 'vue'
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

const backgroundImage = ref<string | null>(null)
const plants = ref<Plant[]>([])
const selectedId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const canvasRef = ref<InstanceType<typeof CanvasView> | null>(null)

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
  history.push(plants.value)
  const center = canvasRef.value?.getCenter() ?? { x: 200, y: 200 }
  plants.value.push({
    id: Date.now(),
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

function deleteSelected() {
  if (!selectedId.value) return
  history.push(plants.value)
  plants.value = plants.value.filter((p) => p.id !== selectedId.value)
  selectedId.value = null
}

function flipSelected() {
  const plant = plants.value.find((p) => p.id === selectedId.value)
  if (!plant) return
  history.push(plants.value)
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
  if (pos) {
    addPlant(drag.plant, pos.x, pos.y)
  } else {
    // dropped outside canvas, place in center
    addPlant(drag.plant)
  }
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
  if (pos) {
    addPlant(drag.plant, pos.x, pos.y)
  } else {
    addPlant(drag.plant)
  }
  drag.endDrag()
}
function undo() {
  const prev = history.undo(plants.value)
  if (prev) {
    plants.value = prev
    selectedId.value = null
  }
}

function redo() {
  const next = history.redo(plants.value)
  if (next) {
    plants.value = next
    selectedId.value = null
  }
}
useKeyboard({
  onDelete: deleteSelected,
  onEscape: () => {
    selectedId.value = null
    canvasRef.value?.clearSelection()
  },
  onUndo: undo,
  onRedo: redo,
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
        :has-selection="!!selectedId"
        :has-photo="!!backgroundImage"
        @upload-photo="triggerPhotoUpload"
        @delete-selected="deleteSelected"
        @flip-selected="flipSelected"
        @export="exportImage"
      />
      <CanvasView
        ref="canvasRef"
        :background-image="backgroundImage"
        :plants="plants"
        @selection-changed="selectedId = $event"
      />
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onPhotoUpload"
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
