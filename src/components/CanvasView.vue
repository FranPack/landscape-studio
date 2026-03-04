<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Konva from 'konva'

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

const props = defineProps<{
  backgroundImage: string | null
  plants: Plant[]
}>()

const emit = defineEmits<{
  'selection-changed': [id: number | null]
  'push-history': []
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLDivElement | null>(null)

let stage: Konva.Stage
let bgLayer: Konva.Layer
let plantLayer: Konva.Layer
let transformer: Konva.Transformer
let isUpdating = false
let spaceKeyDown: (e: KeyboardEvent) => void
let spaceKeyUp: (e: KeyboardEvent) => void

onMounted(() => {
  initStage()
  window.addEventListener('resize', onResize)
  drawBackground()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', spaceKeyDown)
  window.removeEventListener('keyup', spaceKeyUp)
  stage?.destroy()
})

function initStage() {
  const { width, height } = wrapperRef.value!.getBoundingClientRect()

  stage = new Konva.Stage({
    container: canvasEl.value!,
    width,
    height,
  })

  bgLayer = new Konva.Layer()
  plantLayer = new Konva.Layer()
  stage.add(bgLayer)
  stage.add(plantLayer)

  transformer = new Konva.Transformer({
    rotateEnabled: true,
    borderStroke: '#7ec87e',
    anchorStroke: '#7ec87e',
    anchorFill: '#fff',
    anchorSize: 10,
  })
  plantLayer.add(transformer)

  stage.on('click tap', (e) => {
    if (e.target === stage) {
      transformer.nodes([])
      emit('selection-changed', null)
    }
  })
  stage.on('wheel', (e) => {
    e.evt.preventDefault()

    const scaleBy = 1.05
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()!

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clamped = Math.max(0.2, Math.min(5, newScale))

    stage.scale({ x: clamped, y: clamped })
    stage.position({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    })
  })
  let isPanning = false
  let panStart = { x: 0, y: 0 }

  stage.on('mousedown', (e) => {
    if (e.evt.button !== 1) return // middle button only
    e.evt.preventDefault()
    isPanning = true
    stage.container().style.cursor = 'grabbing'
    panStart = { x: e.evt.clientX - stage.x(), y: e.evt.clientY - stage.y() }
  })

  stage.on('mousemove', (e) => {
    if (!isPanning) return
    stage.position({
      x: e.evt.clientX - panStart.x,
      y: e.evt.clientY - panStart.y,
    })
  })

  stage.on('mouseup', () => {
    isPanning = false
    stage.container().style.cursor = 'default'
  })
  let isSpacePanning = false
  let spaceDown = false

  spaceKeyDown = (e) => {
    if (e.code === 'Space' && !spaceDown) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      spaceDown = true
      stage.container().style.cursor = 'grab'
    }
  }

  spaceKeyUp = (e) => {
    if (e.code === 'Space') {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      spaceDown = false
      isSpacePanning = false
      stage.container().style.cursor = 'default'
    }
  }

  window.addEventListener('keydown', spaceKeyDown)
  window.addEventListener('keyup', spaceKeyUp)

  stage.on('mousedown', (e) => {
    if (e.evt.button === 0 && spaceDown) {
      isSpacePanning = true
      panStart = { x: e.evt.clientX - stage.x(), y: e.evt.clientY - stage.y() }
      stage.container().style.cursor = 'grabbing'
    }
  })

  stage.on('mousemove', (e) => {
    if (isSpacePanning) {
      stage.position({
        x: e.evt.clientX - panStart.x,
        y: e.evt.clientY - panStart.y,
      })
    }
  })

  stage.on('mouseup', () => {
    isSpacePanning = false
    if (spaceDown) stage.container().style.cursor = 'grab'
  })
}

function onResize() {
  if (!stage || !wrapperRef.value) return
  const { width, height } = wrapperRef.value.getBoundingClientRect()
  stage.width(width)
  stage.height(height)
  drawBackground()
}

watch(() => props.backgroundImage, drawBackground, { immediate: true })

function drawBackground() {
  if (!props.backgroundImage || !stage) return
  bgLayer.destroyChildren()

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const sw = stage.width()
    const sh = stage.height()
    const scale = Math.min(sw / img.width, sh / img.height)
    const w = img.width * scale
    const h = img.height * scale

    const kImg = new Konva.Image({
      image: img,
      x: (sw - w) / 2,
      y: (sh - h) / 2,
      width: w,
      height: h,
    })
    bgLayer.add(kImg)
    bgLayer.draw()
  }
  img.src = props.backgroundImage
}

watch(() => props.plants, syncPlants, { deep: true })

function syncPlants(newPlants: Plant[]) {
  if (!plantLayer) return

  // Remove plants that no longer exist
  plantLayer
    .getChildren((node) => node.name() === 'plant')
    .forEach((node) => {
      if (!newPlants.find((p) => p.id === Number(node.id()))) {
        if (transformer.nodes().includes(node)) {
          transformer.nodes([])
          emit('selection-changed', null)
        }
        node.destroy()
      }
    })

  // Update existing plants (handles undo/redo position changes)
  isUpdating = true
  newPlants.forEach((plant) => {
    const node = plantLayer.findOne(`#${plant.id}`) as Konva.Image
    if (!node) return
    node.x(plant.x)
    node.y(plant.y)
    node.scaleX(plant.scaleX)
    node.scaleY(plant.scaleY)
    node.rotation(plant.rotation)
  })
  isUpdating = false
  plantLayer.draw()

  // Add new plants
  newPlants.forEach((plant) => {
    if (plantLayer.findOne(`#${plant.id}`)) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const node = new Konva.Image({
        id: String(plant.id),
        name: 'plant',
        image: img,
        x: plant.x,
        y: plant.y,
        width: plant.width,
        height: plant.height,
        scaleX: plant.scaleX,
        scaleY: plant.scaleY,
        rotation: plant.rotation,
        draggable: true,
        offsetX: plant.width / 2,
        offsetY: plant.height / 2,
      })

      node.on('click tap', () => {
        transformer.nodes([node])
        emit('selection-changed', plant.id)
        plantLayer.draw()
      })

      node.on('transformend dragend', () => {
        const p = props.plants.find((p) => p.id === Number(node.id()))
        if (!p) return
        p.x = node.x()
        p.y = node.y()
        p.scaleX = node.scaleX()
        p.scaleY = node.scaleY()
        p.rotation = node.rotation()
      })
      node.on('dragstart transformstart', () => {
        if (!isUpdating) emit('push-history')
      })
      plantLayer.add(node)
      transformer.moveToTop()
      plantLayer.draw()
    }
    img.src = plant.src
  })
}

function exportImage() {
  if (!stage) return
  transformer.nodes([])
  plantLayer.draw()

  const dataURL = stage.toDataURL({ pixelRatio: 2 })

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  if (isMobile) {
    // Open in new tab so user can long press to save
    const win = window.open()
    if (win) {
      win.document.write(`
        <html>
          <head><title>Save Your Design</title></head>
          <body style="margin:0;background:#000;display:flex;flex-direction:column;align-items:center;padding:20px;font-family:sans-serif;color:#fff;">
            <p style="margin-bottom:12px">Long press the image and tap <strong>Save Image</strong></p>
            <img src="${dataURL}" style="max-width:100%;border-radius:8px;" />
          </body>
        </html>
      `)
    }
  } else {
    const a = document.createElement('a')
    a.href = dataURL
    a.download = 'landscape-design.png'
    a.click()
  }
}
function clearSelection() {
  transformer.nodes([])
  plantLayer.draw()
}
function resetZoom() {
  stage.scale({ x: 1, y: 1 })
  stage.position({ x: 0, y: 0 })
}

defineExpose({
  exportImage,
  getCenter: () => {
    const scale = stage.scaleX()
    return {
      x: (stage.width() / 2 - stage.x()) / scale,
      y: (stage.height() / 2 - stage.y()) / scale,
    }
  },

  getCanvasPosition: (clientX: number, clientY: number) => {
    const rect = canvasEl.value?.getBoundingClientRect()
    if (!rect) return null
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom)
      return null
    const scale = stage.scaleX()
    return {
      x: (clientX - rect.left - stage.x()) / scale,
      y: (clientY - rect.top - stage.y()) / scale,
    }
  },

  clearSelection,
  resetZoom,
})
</script>

<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <div v-if="!backgroundImage" class="empty-state">
      <div class="empty-icon">🌿</div>
      <p>Upload a photo of your yard to get started</p>
      <p class="hint">Then click any plant in the sidebar to place it</p>
    </div>
    <div ref="canvasEl" v-show="backgroundImage" />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #111;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #555;
}

.empty-icon {
  font-size: 64px;
}

.empty-state p {
  font-size: 16px;
  color: #666;
}

.empty-state .hint {
  font-size: 13px;
  color: #444;
}
</style>
