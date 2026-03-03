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

export const useHistoryStore = defineStore('history', () => {
  const past = ref<Plant[][]>([])
  const future = ref<Plant[][]>([])

  function push(state: Plant[]) {
    past.value.push(JSON.parse(JSON.stringify(state)))
    future.value = []
  }

  function undo(current: Plant[]): Plant[] | null {
    if (past.value.length === 0) return null
    future.value.push(JSON.parse(JSON.stringify(current)))
    return past.value.pop()!
  }

  function redo(current: Plant[]): Plant[] | null {
    if (future.value.length === 0) return null
    past.value.push(JSON.parse(JSON.stringify(current)))
    return future.value.pop()!
  }

  const canUndo = () => past.value.length > 0
  const canRedo = () => future.value.length > 0

  return { push, undo, redo, canUndo, canRedo }
})
