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
  symbolType?: string
  diameter?: number
}
interface GroundCover {
  id: number
  points: number[] // flat [x1,y1,x2,y2,...] stage coords
  material: string // 'turf' | 'mulch' | 'gravel' | 'sand' | 'concrete'
  fill: string // hex color
  opacity: number
}
interface Line {
  id: number
  points: number[]
  type: 'fence' | 'property'
}
interface Bed {
  id: number
  points: number[]
  label?: string
}

const props = defineProps<{
  backgroundImage: string | null
  plants: Plant[]
  activeTool:
    | 'select'
    | 'ground-cover'
    | 'hardscape'
    | 'structure'
    | 'bed'
    | 'line-fence'
    | 'line-property'
  groundCovers: GroundCover[]
  selectedMaterial: { name: string; fill: string }
  selectedCoverId: number | null
  scaleFeetPer100px: number | null
  disableZoom: boolean
  showGrid: boolean
  dimBackground: boolean
  snapToGrid: boolean
  viewMode: 'photo' | 'plan'
  lines: Line[]
  beds: Bed[]
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
  'zoom-change': [zoom: number]
  'cursor-move': [pos: { x: number; y: number } | null]
  'add-line': [line: Line]
  'add-bed': [bed: Bed]
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLDivElement | null>(null)
const inProgressPoints = ref<number[]>([])
const cursorPos = ref<{ x: number; y: number } | null>(null)
const stageScale = ref(1)
const isDrawingPolygon = () =>
  props.activeTool === 'ground-cover' ||
  props.activeTool === 'hardscape' ||
  props.activeTool === 'structure' ||
  props.activeTool === 'bed'
const isDrawingLine = () =>
  props.activeTool === 'line-fence' || props.activeTool === 'line-property'
let stage: Konva.Stage
let bgLayer: Konva.Layer
let plantLayer: Konva.Layer
let gridLayer: Konva.Layer
let transformer: Konva.Transformer
let isUpdating = false
let spaceKeyDown: (e: KeyboardEvent) => void
let spaceKeyUp: (e: KeyboardEvent) => void
let groundCoverLayer: Konva.Layer
let imagePos = { x: 0, y: 0 }
let linesLayer: Konva.Layer
let bedsLayer: Konva.Layer

onMounted(() => {
  initStage()
  window.addEventListener('resize', onResize)
  drawBackground()
  drawGrid()
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
    if (e.target === stage || e.target.getLayer() === bgLayer) {
      transformer.nodes([])
      emit('selection-changed', null)
      emit('cover-selection-changed', null)
    }
  })
  stage.on('wheel', (e) => {
    e.evt.preventDefault()
    if (props.disableZoom) return

    // Zoom with Ctrl/Cmd
    if (e.evt.ctrlKey || e.evt.metaKey) {
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
      emit('zoom-change', clamped)
      stage.position({
        x: pointer.x - mousePointTo.x * clamped,
        y: pointer.y - mousePointTo.y * clamped,
      })
      drawGrid()
      return
    }

    // Pan: shift converts vertical scroll to horizontal
    const dx = e.evt.shiftKey ? e.evt.deltaY : e.evt.deltaX
    const dy = e.evt.shiftKey ? 0 : e.evt.deltaY
    stage.position({
      x: stage.x() - dx,
      y: stage.y() - dy,
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
  bedsLayer = new Konva.Layer()
  stage.add(bedsLayer)
  linesLayer = new Konva.Layer()
  stage.add(linesLayer)
  stage.add(plantLayer) // make sure plantLayer is added AFTER so it's on top

  stage.on('click', () => {
    const pos = stage.getRelativePointerPosition()
    if (!pos) return

    if (isDrawingPolygon()) {
      // Close polygon if clicking near first vertex (3+ points already placed)
      if (inProgressPoints.value.length >= 6) {
        const firstX = inProgressPoints.value[0]!
        const firstY = inProgressPoints.value[1]!
        const dist = Math.hypot(pos.x - firstX, pos.y - firstY)
        if (dist < 12 / stage.scaleX()) {
          if (props.activeTool === 'bed') {
            emit('add-bed', { id: Date.now(), points: inProgressPoints.value })
          } else {
            emit('add-ground-cover', {
              id: Date.now(),
              points: inProgressPoints.value,
              material: props.selectedMaterial.name,
              fill: props.selectedMaterial.fill,
              opacity: 1,
            })
          }
          inProgressPoints.value = []
          cursorPos.value = null
          return
        }
      }
      inProgressPoints.value.push(pos.x, pos.y)
    } else if (isDrawingLine()) {
      inProgressPoints.value.push(pos.x, pos.y)
    }
  })

  stage.on('dblclick', () => {
    const pts = inProgressPoints.value.slice(0, -4)

    if (isDrawingPolygon()) {
      if (pts.length < 6) return
      if (props.activeTool === 'bed') {
        emit('add-bed', { id: Date.now(), points: pts })
      } else {
        emit('add-ground-cover', {
          id: Date.now(),
          points: pts,
          material: props.selectedMaterial.name,
          fill: props.selectedMaterial.fill,
          opacity: 1,
        })
      }
      inProgressPoints.value = []
      cursorPos.value = null
    } else if (isDrawingLine()) {
      if (pts.length < 4) return // need at least 2 points
      emit('add-line', {
        id: Date.now(),
        points: pts,
        type: props.activeTool === 'line-fence' ? 'fence' : 'property',
      })
      inProgressPoints.value = []
      cursorPos.value = null
    }
  })

  stage.on('mousemove', () => {
    const pos = stage.getRelativePointerPosition()
    if (pos) {
      emit('cursor-move', { x: pos.x - imagePos.x, y: pos.y - imagePos.y })
    } else {
      emit('cursor-move', null)
    }
    if ((isDrawingPolygon() || isDrawingLine()) && pos) cursorPos.value = pos
  })

  stage.on('mouseleave', () => emit('cursor-move', null))
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
  const styles = getComputedStyle(document.documentElement)
  const minorColor = styles.getPropertyValue('--grid-minor').trim()
  const majorColor = styles.getPropertyValue('--grid-major').trim()

  // Determine spacing
  const minorSpacing = getMinorSpacing()
  const majorSpacing = minorSpacing * 10

  const minorVisible = minorSpacing * scale > 4 // hide minor when too dense

  const left = -offsetX / scale
  const top = -offsetY / scale
  const right = left + w / scale
  const bottom = top + h / scale

  const addLine = (points: number[], stroke: string) => {
    gridLayer.add(
      new Konva.Line({
        points,
        stroke,
        strokeWidth: 1 / scale,
        listening: false,
      }),
    )
  }

  if (minorVisible) {
    const startX = Math.floor((left - imagePos.x) / minorSpacing) * minorSpacing + imagePos.x
    const startY = Math.floor((top - imagePos.y) / minorSpacing) * minorSpacing + imagePos.y
    for (let x = startX; x < right; x += minorSpacing) {
      if (Math.abs((x - imagePos.x) % majorSpacing) < 0.01) continue
      addLine([x, top, x, bottom], minorColor)
    }
    for (let y = startY; y < bottom; y += minorSpacing) {
      if (Math.abs((y - imagePos.y) % majorSpacing) < 0.01) continue
      addLine([left, y, right, y], minorColor)
    }
  }

  const startMajorX = Math.floor((left - imagePos.x) / majorSpacing) * majorSpacing + imagePos.x
  const startMajorY = Math.floor((top - imagePos.y) / majorSpacing) * majorSpacing + imagePos.y
  for (let x = startMajorX; x < right; x += majorSpacing) {
    addLine([x, top, x, bottom], majorColor)
  }
  for (let y = startMajorY; y < bottom; y += majorSpacing) {
    addLine([left, y, right, y], majorColor)
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

    imagePos = { x: (sw - w) / 2, y: (sh - h) / 2 }
    console.log('imagePos set:', imagePos)
    bgLayer.add(kImg)
    bgLayer.draw()
    drawGrid()
  }
  img.src = props.backgroundImage
}

watch(() => props.dimBackground, drawBackground)
watch(() => props.groundCovers, syncGroundCovers, { deep: true })
watch(
  () => props.activeTool,
  () => syncGroundCovers(props.groundCovers),
)
watch(
  () => props.selectedCoverId,
  () => syncGroundCovers(props.groundCovers),
)
watch(
  () => props.activeTool,
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
function syncBeds(beds: Bed[]) {
  if (!bedsLayer) return
  bedsLayer.destroyChildren()
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7ec87e'

  beds.forEach((bed) => {
    // Bed fill (mulch color)
    const fill = new Konva.Line({
      id: String(bed.id),
      name: 'bed',
      points: bed.points,
      fill: '#6b3a2a',
      opacity: 0.4,
      closed: true,
      listening: true,
    })
    bedsLayer.add(fill)

    // Bed outline (visible border)
    const outline = new Konva.Line({
      points: bed.points,
      stroke: accent,
      strokeWidth: 2,
      closed: true,
      listening: false,
    })
    bedsLayer.add(outline)
  })
  bedsLayer.draw()
}
watch(() => props.beds, syncBeds, { deep: true })
function syncGroundCovers(covers: GroundCover[]) {
  if (!groundCoverLayer) return
  groundCoverLayer.destroyChildren()
  covers.forEach((cover) => {
    const group = new Konva.Group({ draggable: !isDrawingPolygon() && !props.disableZoom })

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
    group.on('dragmove', () => {
      if (!props.snapToGrid) return
      const s = getMinorSpacing()
      group.x(Math.round((group.x() - imagePos.x) / s) * s + imagePos.x)
      group.y(Math.round((group.y() - imagePos.y) / s) * s + imagePos.y)
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

function syncLines(lines: Line[]) {
  if (!linesLayer) return
  linesLayer.destroyChildren()
  lines.forEach((line) => {
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7ec87e'
    const isFence = line.type === 'fence'

    const shape = new Konva.Line({
      id: String(line.id),
      name: 'line',
      points: line.points,
      stroke: isFence ? accent : 'rgba(255,255,255,0.6)',
      strokeWidth: isFence ? 2 : 1.5,
      dash: isFence ? undefined : [8, 4],
      lineCap: 'round',
      lineJoin: 'round',
      closed: false,
      listening: true,
    })
    linesLayer.add(shape)

    // For fence: add small marks along the line
    if (isFence) {
      for (let i = 0; i < line.points.length - 2; i += 2) {
        const x1 = line.points[i]!
        const y1 = line.points[i + 1]!
        const x2 = line.points[i + 2]!
        const y2 = line.points[i + 3]!
        const segments = 5
        for (let j = 1; j < segments; j++) {
          const t = j / segments
          const mx = x1 + (x2 - x1) * t
          const my = y1 + (y2 - y1) * t
          const dx = x2 - x1
          const dy = y2 - y1
          const len = Math.hypot(dx, dy)
          if (len === 0) continue
          const nx = -dy / len
          const ny = dx / len
          const tickLen = 4
          linesLayer.add(
            new Konva.Line({
              points: [mx - nx * tickLen, my - ny * tickLen, mx + nx * tickLen, my + ny * tickLen],
              stroke: accent,
              strokeWidth: 1,
              listening: false,
            }),
          )
        }
      }
    }
  })
  linesLayer.draw()
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
watch(() => props.lines, syncLines, { deep: true })
watch(
  () => props.viewMode,
  () => {
    drawGrid()
  },
)
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

    if (plant.symbolType) {
      // Plan-view symbol
      const node = createSymbolNode(plant)
      plantLayer.add(node)
      transformer.moveToTop()
      plantLayer.draw()
    } else {
      // Photo-view image
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
          offsetY: plant.height,
        })
        attachPlantHandlers(node, plant)
        plantLayer.add(node)
        transformer.moveToTop()
        plantLayer.draw()
      }
      img.src = plant.src
    }
  })
}

function attachPlantHandlers(node: Konva.Node, plant: Plant) {
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
  node.on('dragmove', () => {
    if (!props.snapToGrid) return
    const s = getMinorSpacing()
    node.x(Math.round((node.x() - imagePos.x) / s) * s + imagePos.x)
    node.y(Math.round((node.y() - imagePos.y) / s) * s + imagePos.y)
  })
}

function createSymbolNode(plant: Plant): Konva.Group {
  const group = new Konva.Group({
    id: String(plant.id),
    name: 'plant',
    x: plant.x,
    y: plant.y,
    scaleX: plant.scaleX,
    scaleY: plant.scaleY,
    rotation: plant.rotation,
    draggable: !props.disableZoom,
  })

  const radius = plant.diameter! / 2
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7ec87e'

  // Base circle (canopy) for all symbol types
  group.add(
    new Konva.Circle({
      radius,
      stroke: accent,
      strokeWidth: 1.5,
      fill: 'rgba(126,200,126,0.08)',
    }),
  )

  // Center dot
  group.add(
    new Konva.Circle({
      radius: 1.5,
      fill: accent,
    }),
  )

  // Type-specific overlay
  if (plant.symbolType?.startsWith('tree-evergreen') || plant.symbolType === 'tree-conifer') {
    // 8-point star outline for evergreens
    const spikes = 8
    const points: number[] = []
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.7
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      points.push(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    group.add(new Konva.Line({ points, stroke: accent, strokeWidth: 1, closed: true }))
  } else if (plant.symbolType === 'tree-deciduous') {
    // Cross lines for deciduous
    const r = radius * 0.7
    group.add(new Konva.Line({ points: [-r, 0, r, 0], stroke: accent, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [0, -r, 0, r], stroke: accent, strokeWidth: 1 }))
    group.add(
      new Konva.Line({
        points: [-r * 0.7, -r * 0.7, r * 0.7, r * 0.7],
        stroke: accent,
        strokeWidth: 1,
      }),
    )
    group.add(
      new Konva.Line({
        points: [-r * 0.7, r * 0.7, r * 0.7, -r * 0.7],
        stroke: accent,
        strokeWidth: 1,
      }),
    )
  }

  attachPlantHandlers(group, plant)
  return group
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
  emit('zoom-change', 1)
  drawGrid()
}
function getMinorSpacing(): number {
  if (props.scaleFeetPer100px && props.scaleFeetPer100px > 0) {
    return 100 / props.scaleFeetPer100px
  }
  return 40
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
  redraw: () => {
    drawGrid()
    syncPlants(props.plants)
    syncGroundCovers(props.groundCovers)
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

    <div v-if="!backgroundImage && viewMode === 'photo'" class="empty-state">
      <div class="empty-icon">🌿</div>
      <p>Upload a photo of your yard to get started</p>
      <p class="hint">Then click any plant in the sidebar to place it</p>
    </div>
    <div ref="canvasEl" v-show="backgroundImage || viewMode === 'plan'" />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-base);
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 64px;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
}

.empty-state .hint {
  font-size: 13px;
  color: var(--text-muted);
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
  background: var(--text-primary);
  border-left: 2px solid var(--text-primary);
  border-right: 2px solid var(--text-primary);
  border-top: none;
}
.scale-bar span {
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 3px #000;
}
</style>
