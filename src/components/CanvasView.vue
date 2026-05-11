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
interface GroundCover {
  id: number
  points: number[] // flat [x1,y1,x2,y2,...] stage coords
  material: string // 'turf' | 'mulch' | 'gravel' | 'sand' | 'concrete'
  fill: string // hex color
  opacity: number
}

const props = defineProps<{
  backgroundImage: string | null
  plants: Plant[]
  drawMode: boolean
  groundCovers: GroundCover[]
  selectedMaterial: { name: string; fill: string }
  selectedCoverId: number | null
  scaleFeetPer100px: number | null
  disableZoom: boolean
  showGrid: boolean
  dimBackground: boolean
}>()

const emit = defineEmits<{
  'selection-changed': [id: number | null]
  'push-history': []
  'add-ground-cover': [cover: GroundCover]
  'cover-selection-changed': [id: number | null]
  'cover-moved': [payload: { id: number; points: number[] }]
  'context-menu': [
    payload: { x: number; y: number; targetType: 'plant' | 'cover'; targetId: number },
  ]
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLDivElement | null>(null)
const inProgressPoints = ref<number[]>([])
const cursorPos = ref<{ x: number; y: number } | null>(null)
const stageScale = ref(1)

let stage: Konva.Stage
let bgLayer: Konva.Layer
let plantLayer: Konva.Layer
let gridLayer: Konva.Layer
let transformer: Konva.Transformer
let isUpdating = false
let spaceKeyDown: (e: KeyboardEvent) => void
let spaceKeyUp: (e: KeyboardEvent) => void
let groundCoverLayer: Konva.Layer

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
  gridLayer = new Konva.Layer({ listening: false })
  stage.add(gridLayer)
  plantLayer = new Konva.Layer()
  stage.add(bgLayer)

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
    if (props.disableZoom) return

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
    stageScale.value = clamped
    stage.position({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    })
    stage.position({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    })
    drawGrid()
  })
  let isPanning = false
  let panStart = { x: 0, y: 0 }

  stage.on('mousedown', (e) => {
    if (props.disableZoom) return
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
    drawGrid()
  })

  stage.on('mouseup', () => {
    isPanning = false
    stage.container().style.cursor = 'default'
  })
  let isSpacePanning = false
  let spaceDown = false

  spaceKeyDown = (e) => {
    if (props.disableZoom) return
    if (e.code === 'Space' && !spaceDown) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      spaceDown = true
      stage.container().style.cursor = 'grab'
    }
  }

  spaceKeyUp = (e) => {
    if (e.code === 'Space') {
      if (props.disableZoom) return
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
    if (props.disableZoom) return
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
      drawGrid()
    }
  })

  stage.on('mouseup', () => {
    isSpacePanning = false
    if (spaceDown) stage.container().style.cursor = 'grab'
  })
  groundCoverLayer = new Konva.Layer()
  stage.add(groundCoverLayer)
  stage.add(plantLayer) // make sure plantLayer is added AFTER so it's on top

  stage.on('click', () => {
    if (!props.drawMode) return
    const pos = stage.getRelativePointerPosition()
    if (!pos) return

    // Close polygon if clicking near first vertex (3+ points already placed)
    if (inProgressPoints.value.length >= 6) {
      const firstX = inProgressPoints.value[0]!
      const firstY = inProgressPoints.value[1]!
      const dist = Math.hypot(pos.x - firstX, pos.y - firstY)
      if (dist < 12 / stage.scaleX()) {
        emit('add-ground-cover', {
          id: Date.now(),
          points: inProgressPoints.value,
          material: props.selectedMaterial.name,
          fill: props.selectedMaterial.fill,
          opacity: 1,
        })
        inProgressPoints.value = []
        cursorPos.value = null
        return
      }
    }

    inProgressPoints.value.push(pos.x, pos.y)
  })

  stage.on('dblclick', () => {
    if (!props.drawMode) return
    // Remove the 2 extra points added by the preceding click events
    const pts = inProgressPoints.value.slice(0, -4)
    if (pts.length < 6) return // need at least 3 points
    emit('add-ground-cover', {
      id: Date.now(),
      points: pts,
      material: props.selectedMaterial.name,
      fill: props.selectedMaterial.fill,
      opacity: 1,
    })
    inProgressPoints.value = []
    cursorPos.value = null
  })

  stage.on('mousemove', () => {
    if (!props.drawMode) return
    const pos = stage.getRelativePointerPosition()
    if (pos) cursorPos.value = pos
  })
}
function drawGrid() {
  if (!gridLayer) return
  gridLayer.destroyChildren()
  if (!props.showGrid) {
    gridLayer.draw()
    return
  }

  const w = stage.width()
  const h = stage.height()
  const scale = stage.scaleX()
  const offsetX = stage.x()
  const offsetY = stage.y()

  // Determine spacing
  let minorSpacing: number
  let majorSpacing: number
  if (props.scaleFeetPer100px && props.scaleFeetPer100px > 0) {
    const stagePxPerUnit = 100 / props.scaleFeetPer100px // 1 unit in stage px
    minorSpacing = stagePxPerUnit         // 1 unit
    majorSpacing = stagePxPerUnit * 10    // 10 units
  } else {
    minorSpacing = 40
    majorSpacing = 200
  }

  const minorVisible = minorSpacing * scale > 4 // hide minor when too dense

  const left = -offsetX / scale
  const top = -offsetY / scale
  const right = left + w / scale
  const bottom = top + h / scale

  const addLine = (points: number[], stroke: string) => {
    gridLayer.add(new Konva.Line({
      points, stroke, strokeWidth: 1 / scale, listening: false,
    }))
  }

  if (minorVisible) {
    const startX = Math.floor(left / minorSpacing) * minorSpacing
    const startY = Math.floor(top / minorSpacing) * minorSpacing
    for (let x = startX; x < right; x += minorSpacing) {
      if (Math.abs(x % majorSpacing) < 0.01) continue
      addLine([x, top, x, bottom], 'rgba(255,255,255,0.04)')
    }
    for (let y = startY; y < bottom; y += minorSpacing) {
      if (Math.abs(y % majorSpacing) < 0.01) continue
      addLine([left, y, right, y], 'rgba(255,255,255,0.04)')
    }
  }

  const startMajorX = Math.floor(left / majorSpacing) * majorSpacing
  const startMajorY = Math.floor(top / majorSpacing) * majorSpacing
  for (let x = startMajorX; x < right; x += majorSpacing) {
    addLine([x, top, x, bottom], 'rgba(255,255,255,0.12)')
  }
  for (let y = startMajorY; y < bottom; y += majorSpacing) {
    addLine([left, y, right, y], 'rgba(255,255,255,0.12)')
  }

  gridLayer.draw()
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
      opacity: props.dimBackground ? 0.4 : 1,
    })
    bgLayer.add(kImg)
    bgLayer.draw()
  }
  img.src = props.backgroundImage
}

watch(() => props.dimBackground, drawBackground)
watch(() => props.groundCovers, syncGroundCovers, { deep: true })
watch(
  () => props.drawMode,
  () => syncGroundCovers(props.groundCovers),
)
watch(
  () => props.selectedCoverId,
  () => syncGroundCovers(props.groundCovers),
)
watch(
  () => props.drawMode,
  (val) => {
    if (stage) stage.container().style.cursor = val ? 'crosshair' : 'default'
  },
)
watch(() => props.showGrid, drawGrid)
watch(() => props.scaleFeetPer100px, drawGrid)
watch(
  () => props.disableZoom,
  (val) => {
    if (transformer) transformer.listening(!val)
    syncPlants(props.plants)
    syncGroundCovers(props.groundCovers)
  },
)

function createPatternCanvas(material: string, fill: string): HTMLCanvasElement {
  const size = 20
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!

  ctx.fillStyle = fill
  ctx.fillRect(0, 0, size, size)

  if (material === 'mulch') {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.lineTo(10, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(10, 20)
    ctx.lineTo(20, 10)
    ctx.stroke()
  } else if (material === 'gravel' || material === 'sand') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    const dots = [
      [4, 4],
      [14, 8],
      [8, 16],
      [2, 14],
      [17, 3],
    ]
    for (const [x, y] of dots) {
      ctx.beginPath()
      ctx.arc(x!, y!, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (material === 'concrete') {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, size, size)
  }

  return c
}

function syncGroundCovers(covers: GroundCover[]) {
  if (!groundCoverLayer) return
  groundCoverLayer.destroyChildren()
  covers.forEach((cover) => {
    const group = new Konva.Group({ draggable: !props.drawMode && !props.disableZoom })

    const patternCanvas = createPatternCanvas(cover.material, cover.fill)

    const shape = new Konva.Line({
      id: String(cover.id),
      name: 'cover',
      points: cover.points,
      fillPatternImage: patternCanvas as unknown as HTMLImageElement,
      fillPatternRepeat: 'repeat',
      opacity: cover.opacity,
      closed: true,
      listening: true,
      stroke: cover.id === props.selectedCoverId ? '#fff' : 'transparent',
      strokeWidth: 2,
    })

    group.add(shape)
    group.on('click tap', () => emit('cover-selection-changed', cover.id))
    group.on('contextmenu', (e) => {
      e.evt.preventDefault()
      emit('cover-selection-changed', cover.id)
      emit('context-menu', {
        x: e.evt.clientX,
        y: e.evt.clientY,
        targetType: 'cover',
        targetId: cover.id,
      })
    })
    group.on('dragstart', () => emit('push-history'))
    group.on('dragend', () => {
      const dx = group.x()
      const dy = group.y()
      const newPoints = cover.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy))
      emit('cover-moved', { id: cover.id, points: newPoints })
    })
    groundCoverLayer.add(group)

    if (cover.id === props.selectedCoverId) {
      for (let i = 0; i < cover.points.length; i += 2) {
        const idx = i
        const handle = new Konva.Circle({
          x: cover.points[idx]!,
          y: cover.points[idx + 1]!,
          radius: 6,
          fill: '#fff',
          stroke: '#7ec87e',
          strokeWidth: 2,
          draggable: true,
          name: 'vertex-handle',
        })
        handle.on('dragstart', () => emit('push-history'))
        handle.on('dragmove', () => {
          const newPoints = [...cover.points]
          newPoints[idx] = handle.x()
          newPoints[idx + 1] = handle.y()
          shape.points(newPoints)
          groundCoverLayer.draw()
        })
        handle.on('dragend', () => {
          const newPoints = [...cover.points]
          newPoints[idx] = handle.x()
          newPoints[idx + 1] = handle.y()
          emit('cover-moved', { id: cover.id, points: newPoints })
        })
        group.add(handle)
      }
    }
  })
  groundCoverLayer.draw()
}

watch(
  [inProgressPoints, cursorPos],
  () => {
    if (!groundCoverLayer) return
    groundCoverLayer.findOne('#preview')?.destroy()
    groundCoverLayer.find('.vertex-dot').forEach((n) => n.destroy())

    if (inProgressPoints.value.length < 2) return

    for (let i = 0; i < inProgressPoints.value.length; i += 2) {
      const isFirst = i === 0
      const closeable = inProgressPoints.value.length >= 6
      const dot = new Konva.Circle({
        x: inProgressPoints.value[i]!,
        y: inProgressPoints.value[i + 1]!,
        radius: isFirst && closeable ? 6 : 4,
        fill: isFirst && closeable ? '#7ec87e' : '#fff',
        opacity: 0.8,
        name: 'vertex-dot',
        listening: false,
      })
      groundCoverLayer.add(dot)
    }

    const pts = cursorPos.value
      ? [...inProgressPoints.value, cursorPos.value.x, cursorPos.value.y]
      : [...inProgressPoints.value]
    const preview = new Konva.Line({
      id: 'preview',
      points: pts,
      stroke: '#fff',
      strokeWidth: 1.5,
      dash: [6, 4],
      closed: false,
      listening: false,
    })
    groundCoverLayer.add(preview)
    groundCoverLayer.draw()
  },
  { deep: true },
)

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

  newPlants.forEach((plant, i) => {
    const node = plantLayer.findOne(`#${plant.id}`)
    if (node) node.zIndex(i)
  })
  transformer.moveToTop()

  isUpdating = true
  newPlants.forEach((plant) => {
    const node = plantLayer.findOne(`#${plant.id}`) as Konva.Image
    if (!node) return
    node.draggable(!props.disableZoom)
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
        draggable: !props.disableZoom,
        offsetX: plant.width / 2,
        offsetY: plant.height / 2,
      })

      node.on('click tap', () => {
        transformer.nodes([node])
        emit('selection-changed', plant.id)
        plantLayer.draw()
      })
      node.on('contextmenu', (e) => {
        e.evt.preventDefault()
        transformer.nodes([node])
        emit('selection-changed', plant.id)
        emit('context-menu', {
          x: e.evt.clientX,
          y: e.evt.clientY,
          targetType: 'plant',
          targetId: plant.id,
        })
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
  stageScale.value = 1
  drawGrid()
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
  cancelDraw: () => {
    inProgressPoints.value = []
    cursorPos.value = null
  },
  removeLastVertex: () => {
    if (inProgressPoints.value.length >= 2) {
      inProgressPoints.value = inProgressPoints.value.slice(0, -2)
    }
  },
})
</script>

<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <div v-if="scaleFeetPer100px && backgroundImage" class="scale-bar">
      <div class="scale-bar-line" />
      <span>{{ (scaleFeetPer100px / stageScale).toFixed(1) }} ft</span>
    </div>

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
.scale-bar {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  pointer-events: none;
  z-index: 10;
}
.scale-bar-line {
  width: 100px;
  height: 4px;
  background: #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid #fff;
  border-top: none;
}
.scale-bar span {
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 3px #000;
}
</style>
