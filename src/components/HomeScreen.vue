<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  'new-project': [type: 'photo' | 'plan']
  'open-project': []
  'load-recent': [project: RecentProject]
}>()

interface RecentProject {
  name: string
  type: 'photo' | 'plan'
  lastOpened: number
}

const recent = ref<RecentProject[]>([])

onMounted(() => {
  const stored = localStorage.getItem('recentProjects')
  if (stored) recent.value = JSON.parse(stored)
})

function formatDate(ts: number) {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString()
}
</script>

<template>
  <div class="home">
    <div class="home-container">
      <div class="home-header">
        <div class="logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a9 9 0 0 1 9 9c0 4.5-3 8-7 9.5V22H10v-1.5C6 19 3 15.5 3 11a9 9 0 0 1 9-9z"/>
            <path d="M9 12c0-1.7 1.3-3 3-3s3 1.3 3 3"/>
          </svg>
        </div>
        <h1>Serere</h1>
        <p class="tagline">Landscape design studio</p>
      </div>

      <div class="home-actions">
        <div class="action-card" @click="emit('new-project', 'photo')">
          <div class="action-icon">📷</div>
          <h3>Photo Overlay</h3>
          <p>Upload a photo of your yard and place plants on top</p>
        </div>
        <div class="action-card" @click="emit('new-project', 'plan')">
          <div class="action-icon">📐</div>
          <h3>2D Site Plan</h3>
          <p>Design from a top-down view with grid and symbols</p>
        </div>
        <div class="action-card secondary" @click="emit('open-project')">
          <div class="action-icon">📂</div>
          <h3>Open Project</h3>
          <p>Open an existing .landscape file</p>
        </div>
      </div>

      <div v-if="recent.length" class="recent-section">
        <div class="section-label">Recent</div>
        <div class="recent-list">
          <div v-for="(p, i) in recent" :key="i" class="recent-item" @click="emit('load-recent', p)">
            <div class="recent-type">{{ p.type === 'photo' ? '📷' : '📐' }}</div>
            <div class="recent-info">
              <div class="recent-name">{{ p.name }}</div>
              <div class="recent-date">{{ formatDate(p.lastOpened) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  overflow-y: auto;
}
.home-container {
  width: 100%;
  max-width: 720px;
  padding: 40px 24px;
}
.home-header {
  text-align: center;
  margin-bottom: 40px;
}
.logo {
  color: var(--accent);
  margin-bottom: 12px;
  display: inline-block;
}
h1 {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.tagline {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.home-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}
.action-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 16px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, transform 0.15s;
}
.action-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}
.action-card.secondary:hover {
  border-color: var(--text-secondary);
}
.action-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.action-card h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.action-card p {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}
.recent-section {
  margin-top: 16px;
}
.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 5px;
  cursor: pointer;
}
.recent-item:hover { border-color: var(--accent); }
.recent-type { font-size: 16px; }
.recent-info { flex: 1; }
.recent-name {
  font-size: 12px;
  color: var(--text-primary);
}
.recent-date {
  font-size: 10px;
  color: var(--text-muted);
}
</style>
