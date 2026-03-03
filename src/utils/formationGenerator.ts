import type { DancerPosition } from '@/types/formation'
import type { GroupSize } from '@/types/piece'
import { getColor } from './colorPalette'

export function generateStarterFormation(
  groupSize: GroupSize,
  dancerCount: number,
): DancerPosition[] {
  switch (groupSize) {
    case 'solo':
      return generateSolo()
    case 'duo':
      return generateDuo()
    case 'trio':
      return generateTriangle()
    case 'small_group':
      return generateSmallGroup(dancerCount)
    case 'large_group':
      return generateLargeGroup(dancerCount)
    default:
      return generateSmallGroup(dancerCount)
  }
}

function makeDancer(index: number, x: number, y: number): DancerPosition {
  return {
    dancer_id: `dancer_${index + 1}`,
    label: `${index + 1}`,
    x,
    y,
    color: getColor(index),
  }
}

function generateSolo(): DancerPosition[] {
  return [makeDancer(0, 0.5, 0.5)]
}

function generateDuo(): DancerPosition[] {
  return [
    makeDancer(0, 0.35, 0.5),
    makeDancer(1, 0.65, 0.5),
  ]
}

function generateTriangle(): DancerPosition[] {
  return [
    makeDancer(0, 0.5, 0.35),
    makeDancer(1, 0.35, 0.6),
    makeDancer(2, 0.65, 0.6),
  ]
}

function generateSmallGroup(count: number): DancerPosition[] {
  const positions: DancerPosition[] = []
  const centerX = 0.5
  const startY = 0.3
  const endY = 0.7
  const spread = 0.35

  const hasApex = count % 2 === 1
  const wingCount = hasApex ? Math.floor(count / 2) : count / 2

  let idx = 0

  if (hasApex) {
    positions.push(makeDancer(idx, centerX, startY))
    idx++
  }

  for (let i = 0; i < wingCount; i++) {
    const t = (i + 1) / (wingCount + (hasApex ? 0 : 1))
    const yPos = startY + t * (endY - startY)
    const xOffset = t * spread

    positions.push(makeDancer(idx, centerX - xOffset, yPos))
    idx++
    positions.push(makeDancer(idx, centerX + xOffset, yPos))
    idx++
  }

  return positions
}

function generateLargeGroup(count: number): DancerPosition[] {
  const positions: DancerPosition[] = []
  const frontRowCount = Math.ceil(count / 2)
  const backRowCount = count - frontRowCount

  const frontY = 0.6
  const backY = 0.35

  for (let i = 0; i < frontRowCount; i++) {
    const x = (i + 1) / (frontRowCount + 1)
    positions.push(makeDancer(positions.length, x, frontY))
  }

  for (let i = 0; i < backRowCount; i++) {
    const x = (i + 1) / (backRowCount + 1)
    positions.push(makeDancer(positions.length, x, backY))
  }

  return positions
}
