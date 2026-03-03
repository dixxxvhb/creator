export interface StageDimensions {
  width: number
  height: number
}

export const STAGE_PRESETS: Record<string, StageDimensions> = {
  small: { width: 800, height: 500 },
  medium: { width: 1024, height: 600 },
  large: { width: 1280, height: 720 },
}
