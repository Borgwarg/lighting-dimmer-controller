export interface Fixture {
  id: number
  name: string
  channel: number
  level: number
  on: boolean
  x: number
  y: number
}

export interface Group {
  id: number
  name: string
  fixtureIds: number[]
}

export interface ProgramStep {
  id: number
  name: string
  levels: Record<number, number>
  waitBeats: number
}

export interface SavedSequence {
  id: number
  name: string
  steps: ProgramStep[]
}

export type EffectName = 'chase' | 'flash' | 'fade' | 'random' | 'sparkle' | 'strobe'

export const initialFixtures: Fixture[] = [
  { id: 1, name: 'Beam 1', channel: 1, level: 68, on: true, x: 120, y: 80 },
  { id: 2, name: 'Beam 2', channel: 2, level: 54, on: true, x: 260, y: 120 },
  { id: 3, name: 'Beam 3', channel: 3, level: 42, on: true, x: 400, y: 90 },
  { id: 4, name: 'Beam 4', channel: 4, level: 59, on: true, x: 560, y: 140 },
  { id: 5, name: 'Beam 5', channel: 5, level: 75, on: true, x: 220, y: 240 },
  { id: 6, name: 'Beam 6', channel: 6, level: 48, on: true, x: 460, y: 250 },
]

export const defaultGroups: Group[] = [
  { id: 1, name: 'Front Row', fixtureIds: [1, 2, 3] },
  { id: 2, name: 'Back Row', fixtureIds: [4, 5, 6] },
]

export const defaultEffects: SavedSequence[] = [
  {
    id: 1,
    name: 'Pulse Sweep',
    steps: [
      { id: 1, name: 'Step 1', levels: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, waitBeats: 1 },
      { id: 2, name: 'Step 2', levels: { 1: 0, 2: 100, 3: 0, 4: 0, 5: 0, 6: 0 }, waitBeats: 1 },
      { id: 3, name: 'Step 3', levels: { 1: 0, 2: 0, 3: 100, 4: 0, 5: 0, 6: 0 }, waitBeats: 1 },
    ],
  },
]

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
