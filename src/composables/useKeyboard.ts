import { onMounted, onUnmounted } from 'vue'

interface Options {
  onDelete: () => void
  onEscape: () => void
  onUndo: () => void
  onRedo: () => void
}

export function useKeyboard(options: Options) {
  function onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      options.onDelete()
    }

    if (e.key === 'Escape') {
      options.onEscape()
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      options.onUndo()
    }

    if (
      ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
    ) {
      e.preventDefault()
      options.onRedo()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
