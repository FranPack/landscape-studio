import { defineStore } from 'pinia'
import { ref } from 'vue'

interface DragPlant {
  src: string
  name: string
}

export const useDragStore = defineStore('drag', () => {
  const dragging = ref(false)
  const plant = ref<DragPlant | null>(null)
  const ghostX = ref(0)
  const ghostY = ref(0)

  function startDrag(p: DragPlant, x: number, y: number) {
    plant.value = p
    ghostX.value = x
    ghostY.value = y
    dragging.value = true
  }

  function updatePosition(x: number, y: number) {
    ghostX.value = x
    ghostY.value = y
  }

  function endDrag() {
    dragging.value = false
    plant.value = null
  }

  return { dragging, plant, ghostX, ghostY, startDrag, updatePosition, endDrag }
})
