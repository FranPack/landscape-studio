export type SymbolCategory = 'tree' | 'shrub' | 'hedge' | 'perennial' | 'annual' | 'grass' | 'vine'

export interface PlantSymbol {
  id: string
  name: string
  type: string
  category: SymbolCategory
  defaultDiameter: number // diameter at maturity in project units (typ. feet)
}

export const SYMBOLS: PlantSymbol[] = [
  // Trees — by size and type
  {
    id: 'tree-deciduous-large',
    name: 'Large Deciduous Tree',
    type: 'tree-deciduous',
    category: 'tree',
    defaultDiameter: 40,
  },
  {
    id: 'tree-deciduous-medium',
    name: 'Medium Deciduous Tree',
    type: 'tree-deciduous',
    category: 'tree',
    defaultDiameter: 25,
  },
  {
    id: 'tree-deciduous-small',
    name: 'Small Deciduous Tree',
    type: 'tree-deciduous',
    category: 'tree',
    defaultDiameter: 15,
  },
  {
    id: 'tree-evergreen-large',
    name: 'Large Evergreen Tree',
    type: 'tree-evergreen',
    category: 'tree',
    defaultDiameter: 30,
  },
  {
    id: 'tree-evergreen-small',
    name: 'Small Evergreen Tree',
    type: 'tree-evergreen',
    category: 'tree',
    defaultDiameter: 15,
  },
  {
    id: 'tree-conifer',
    name: 'Conifer',
    type: 'tree-conifer',
    category: 'tree',
    defaultDiameter: 20,
  },
  {
    id: 'tree-ornamental',
    name: 'Ornamental Tree',
    type: 'tree-ornamental',
    category: 'tree',
    defaultDiameter: 15,
  },
  {
    id: 'tree-flowering',
    name: 'Flowering Tree',
    type: 'tree-flowering',
    category: 'tree',
    defaultDiameter: 18,
  },

  // Shrubs — by size and form
  {
    id: 'shrub-round-large',
    name: 'Large Round Shrub',
    type: 'shrub-round',
    category: 'shrub',
    defaultDiameter: 8,
  },
  {
    id: 'shrub-round-medium',
    name: 'Medium Round Shrub',
    type: 'shrub-round',
    category: 'shrub',
    defaultDiameter: 5,
  },
  {
    id: 'shrub-round-small',
    name: 'Small Round Shrub',
    type: 'shrub-round',
    category: 'shrub',
    defaultDiameter: 3,
  },
  {
    id: 'shrub-spreading',
    name: 'Spreading Shrub',
    type: 'shrub-spreading',
    category: 'shrub',
    defaultDiameter: 6,
  },
  {
    id: 'shrub-upright',
    name: 'Upright/Columnar Shrub',
    type: 'shrub-upright',
    category: 'shrub',
    defaultDiameter: 3,
  },

  // Hedge
  { id: 'hedge', name: 'Hedge', type: 'hedge', category: 'hedge', defaultDiameter: 3 },

  // Perennials
  {
    id: 'perennial',
    name: 'Perennial',
    type: 'perennial',
    category: 'perennial',
    defaultDiameter: 2,
  },

  // Annuals
  { id: 'annual', name: 'Annual', type: 'annual', category: 'annual', defaultDiameter: 1.5 },

  // Grass
  {
    id: 'grass-ornamental',
    name: 'Ornamental Grass',
    type: 'grass-ornamental',
    category: 'grass',
    defaultDiameter: 4,
  },

  // Vines
  { id: 'vine', name: 'Vine', type: 'vine', category: 'vine', defaultDiameter: 6 },
]
