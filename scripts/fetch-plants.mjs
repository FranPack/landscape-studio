/**
 * One-time script: fetches plant images, removes backgrounds via remove.bg,
 * saves transparent PNGs to public/plants/, and prints updated plants.ts entries.
 *
 * Usage:
 *   REMOVE_BG_API_KEY=your_key node scripts/fetch-plants.mjs
 *
 * Get a free API key (50 credits/month) at https://www.remove.bg/api
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'plants')
const API_KEY = process.env.REMOVE_BG_API_KEY

if (!API_KEY) {
  console.error('Missing REMOVE_BG_API_KEY. Run as:\n  REMOVE_BG_API_KEY=your_key node scripts/fetch-plants.mjs')
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

// Verified Wikipedia thumbnail URLs (fetched via Wikipedia REST API)
const plants = [
  // Trees
  { name: 'Japanese Maple',    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Acer_palmatum0.jpg/330px-Acer_palmatum0.jpg' },
  { name: 'Dogwood',           src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Cornus_florida_Arkansas.jpg/330px-Cornus_florida_Arkansas.jpg' },
  { name: 'Redbud',            src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/RedbudOhio02.jpg/330px-RedbudOhio02.jpg' },
  { name: 'Crepe Myrtle',      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Lagerstroemia_indica_Blanco1.207.png/330px-Lagerstroemia_indica_Blanco1.207.png' },
  { name: 'Magnolia',          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Magnolia_x_soulangeana_%28Jean_Tosti%29.jpg/330px-Magnolia_x_soulangeana_%28Jean_Tosti%29.jpg' },
  { name: 'Ornamental Cherry', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Cerisier_du_Japon_Prunus_serrulata.jpg/330px-Cerisier_du_Japon_Prunus_serrulata.jpg' },
  { name: 'River Birch',       src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/RiverBirchBark01.JPG/330px-RiverBirchBark01.JPG' },

  // Shrubs
  { name: 'Hydrangea',         src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/%28Natural%29_Hydrangea_macrophylla%2C_Iwafune%2C_Isumi%2C_Chiba%2C_Japan_2.jpg/330px-%28Natural%29_Hydrangea_macrophylla%2C_Iwafune%2C_Isumi%2C_Chiba%2C_Japan_2.jpg' },
  { name: 'Azalea',            src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Rhododendron_calendulaceum.jpg/330px-Rhododendron_calendulaceum.jpg' },
  { name: 'Rhododendron',      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Rhododendron_ponticum_ssp._baeticum_in_Cambarinho_Botanical_Reserve%2C_Portugal.JPG/330px-Rhododendron_ponticum_ssp._baeticum_in_Cambarinho_Botanical_Reserve%2C_Portugal.JPG' },
  { name: 'Boxwood',           src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Buxus_sempervirens.jpg/330px-Buxus_sempervirens.jpg' },
  { name: 'Knockout Rose',     src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Rosa_Knockout_Pink_0zz.jpg/330px-Rosa_Knockout_Pink_0zz.jpg' },
  { name: 'Rose Bush',         src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/2020-05-20_08_05_42_Multiflora_Rose_flowers_along_a_walking_path_within_Horsepen_Run_Stream_Valley_Park_in_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg/330px-2020-05-20_08_05_42_Multiflora_Rose_flowers_along_a_walking_path_within_Horsepen_Run_Stream_Valley_Park_in_Oak_Hill%2C_Fairfax_County%2C_Virginia.jpg' },
  { name: 'Forsythia',         src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Forsythia_flower.JPG/330px-Forsythia_flower.JPG' },
  { name: 'Spirea',            src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Spiraea_japonica_25-06-2010_13-58-09.JPG/330px-Spiraea_japonica_25-06-2010_13-58-09.JPG' },
  { name: 'Butterfly Bush',    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/BuddlejaDavidiiStrauch.jpg/330px-BuddlejaDavidiiStrauch.jpg' },
  { name: 'Holly',             src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Ilex-aquifolium_%28Europaeische_Stechpalme-1%29.jpg/330px-Ilex-aquifolium_%28Europaeische_Stechpalme-1%29.jpg' },
  { name: 'Arborvitae',        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Thuja_occidentalis.jpg/330px-Thuja_occidentalis.jpg' },
  { name: 'Juniper',           src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Jun_chin_shoot.jpg/330px-Jun_chin_shoot.jpg' },
  { name: 'Yew',               src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Taxus_baccata_MHNT.jpg/330px-Taxus_baccata_MHNT.jpg' },

  // Perennials & Groundcover
  { name: 'Lavender',          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Lavandula_angustifolia_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-087.jpg/330px-Lavandula_angustifolia_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-087.jpg' },
  { name: 'Hosta',             src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Hosta_Bressingham_Blue.JPG/330px-Hosta_Bressingham_Blue.JPG' },
  { name: 'Daylily',           src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/HemerocallisFulva1UME.jpg/330px-HemerocallisFulva1UME.jpg' },
  { name: 'Black-eyed Susan',  src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Rudbeckia_hirta_kz03.jpg/330px-Rudbeckia_hirta_kz03.jpg' },
  { name: 'Coneflower',        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Echinacea_purpurea_Grandview_Prairie.jpg/330px-Echinacea_purpurea_Grandview_Prairie.jpg' },
  { name: 'Salvia',            src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Salvia_nemorosa-IMG_3624.jpg/330px-Salvia_nemorosa-IMG_3624.jpg' },
  { name: 'Peony',             src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Lactiflora1b.UME.jpg/330px-Lactiflora1b.UME.jpg' },
  { name: 'Iris',              src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Iris_Germanica_2012-2.jpg/330px-Iris_Germanica_2012-2.jpg' },
  { name: 'Sedum',             src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Sedum_spectabile_-_blossom_top_%28aka%29.jpg/330px-Sedum_spectabile_-_blossom_top_%28aka%29.jpg' },
  { name: 'Ornamental Grass',  src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Pennisetum_alopecuroides_-_Berlin_Botanical_Garden_-_IMG_8624.JPG/330px-Pennisetum_alopecuroides_-_Berlin_Botanical_Garden_-_IMG_8624.JPG' },
]

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

async function removeBg(imageUrl, outputPath) {
  const formData = new FormData()
  formData.append('image_url', imageUrl)
  formData.append('size', 'auto')

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': API_KEY },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`remove.bg error ${res.status}: ${text}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
}

const lines = []

for (const plant of plants) {
  const filename = `${slug(plant.name)}.png`
  const outputPath = path.join(OUT_DIR, filename)

  if (fs.existsSync(outputPath)) {
    console.log(`⏭  Skipping ${plant.name} (already exists)`)
    lines.push(`  { name: '${plant.name}', src: '/plants/${filename}' },`)
    continue
  }

  process.stdout.write(`⏳ Processing ${plant.name}...`)
  try {
    await removeBg(plant.src, outputPath)
    console.log(' ✓')
    lines.push(`  { name: '${plant.name}', src: '/plants/${filename}' },`)
  } catch (err) {
    console.log(` ✗ ${err.message}`)
    lines.push(`  // FAILED: { name: '${plant.name}', src: '/plants/${filename}' },`)
  }

  // Small delay to avoid hammering the API
  await new Promise(r => setTimeout(r, 500))
}

console.log('\n\n--- Paste this into src/data/plants.ts ---\n')
console.log('export const PLANTS: PlantAsset[] = [')
console.log(lines.join('\n'))
console.log(']')
