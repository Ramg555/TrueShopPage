const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export function formatPrice(value: number): string {
  return currencyFormatter.format(value)
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDate(value: string): string {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : dateFormatter.format(d)
}

// Etiqueta y color para el estado de un pedido.
export function orderStatusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case 'Pending':
      return { label: 'Pendiente', color: 'warning' }
    case 'Paid':
      return { label: 'Pagado', color: 'info' }
    case 'Shipped':
      return { label: 'Enviado', color: 'info' }
    case 'Delivered':
      return { label: 'Entregado', color: 'success' }
    case 'Cancelled':
      return { label: 'Cancelado', color: 'error' }
    default:
      return { label: status, color: 'secondary' }
  }
}

// Estados válidos de un pedido, en orden de avance del flujo.
export const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'] as const
