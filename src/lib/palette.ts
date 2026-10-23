const COLORS = [
  '#3ee0c2',
  '#f0b429',
  '#7aa2f7',
  '#f7768e',
  '#9ece6a',
  '#bb9af7',
  '#ff9e64',
  '#2ac3de',
  '#e0af68',
  '#73daca',
]

export function colorFor(id: string): string {
  if (id === 'IDLE') return '#243044'
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}
