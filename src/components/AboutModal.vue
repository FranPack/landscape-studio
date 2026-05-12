<script setup lang="ts">
defineEmits<{
  close: []
}>()

const version = '0.1.0'
</script>

<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-body">
        <div class="logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a9 9 0 0 1 9 9c0 4.5-3 8-7 9.5V22H10v-1.5C6 19 3 15.5 3 11a9 9 0 0 1 9-9z"/>
            <path d="M9 12c0-1.7 1.3-3 3-3s3 1.3 3 3"/>
          </svg>
        </div>
        <h1>Serere</h1>
        <p class="tagline">Latin for "to plant, to cultivate"</p>
        <p class="version">Version {{ version }}</p>
        <p class="description">
          A landscape design tool for visualizing yards, gardens, and outdoor spaces.
        </p>
        <button class="close-btn" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 380px;
  max-width: 90vw;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
.modal-body {
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}
.logo {
  color: var(--accent);
  margin-bottom: 8px;
}
h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-primary);
}
.tagline {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: 4px;
}
.version {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.description {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 280px;
  margin-bottom: 16px;
}
.close-btn {
  background: var(--accent);
  border: none;
  color: #000;
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.5px;
}
.close-btn:hover { opacity: 0.9; }
</style>
