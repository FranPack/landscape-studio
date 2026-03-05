import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  points: number[]
  material: string
  fill: string
  opacity: number
}
interface HistoryState {
  plants: Plant[]
  groundCovers: GroundCover[]
}

export const useHistoryStore = defineStore('history', () => {
  const past = ref<HistoryState[]>([])
  const future = ref<HistoryState[]>([])

  function push(plants: Plant[], groundCovers: GroundCover[]) {
    past.value.push(JSON.parse(JSON.stringify({ plants, groundCovers })))
    future.value = []
  }

  function undo(plants: Plant[], groundCovers: GroundCover[]): HistoryState | null {
    if (!past.value.length) return null
    future.value.push(JSON.parse(JSON.stringify({ plants, groundCovers })))
    return past.value.pop()!
  }

  function redo(plants: Plant[], groundCovers: GroundCover[]): HistoryState | null {
    if (!future.value.length) return null
    past.value.push(JSON.parse(JSON.stringify({ plants, groundCovers })))
    return future.value.pop()!
  }

  return { push, undo, redo }
})
