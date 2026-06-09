// Tallas disponibles, en su orden canónico de visualización (S → XXL).
export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const

export type Size = (typeof SIZES)[number]

// Índice de orden de una talla; las desconocidas van al final.
export function sizeRank(size: string): number {
  const i = SIZES.indexOf(size as Size)
  return i === -1 ? SIZES.length : i
}
