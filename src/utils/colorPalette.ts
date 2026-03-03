const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#E11D48', // rose
  '#7C3AED', // purple
  '#0EA5E9', // sky
  '#D946EF', // fuchsia
  '#CA8A04', // yellow-700
]

export function getColor(index: number): string {
  return COLORS[index % COLORS.length]
}
