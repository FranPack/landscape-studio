import { onMounted, onUnmounted } from 'vue'

interface Options {
  onDelete: () => void
  onEscape: () => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onDuplicate?: () => void
  onRemoveVertex?: () => void
}

export function useKeyboard(options: Options) {
  function onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === 'Delete') {
      options.onDelete()
    } else if (e.key === 'Backspace') {
      if (options.onRemoveVertex) options.onRemoveVertex()
      else options.onDelete()
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault()
      options.onDuplicate?.()
    }

    if (e.key === 'Escape') {
      options.onEscape()
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault()
      options.onUndo()
    }

    if (
      ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault()
      options.onRedo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '0' && !e.shiftKey) {
      e.preventDefault()
      options.onReset()
    }
    if (e.code === 'Space') e.preventDefault()
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
