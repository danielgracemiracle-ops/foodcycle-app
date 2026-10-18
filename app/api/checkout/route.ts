import { confirmCheckout, holdStock, releaseCheckout, StockError } from '@/lib/stock'
import { asArray, asId, asName, asQuantity, errorResponse, readJson } from '@/lib/stock-validation'

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const key = asId(body.key, 'idempotency key')
    const holderId = asId(body.holderId, 'customer id')

    switch (body.action) {
      case 'hold': {
        const seen = new Set<string>()
        const items = asArray(body.items, 'items').map((raw) => {
          const item = raw as Record<string, unknown>
          const foodId = asId(item.foodId, 'food id')
          if (seen.has(foodId)) throw new StockError('Duplicate item in checkout.')
          seen.add(foodId)
          return { foodId, name: asName(item.name), quantity: asQuantity(item.quantity, 1, 10) }
        })
        return Response.json(await holdStock(key, holderId, items))
      }
      case 'confirm': {
        const orderIds = asArray(body.orderIds, 'order ids').map((id) => asId(id, 'order id'))
        return Response.json(await confirmCheckout(key, holderId, orderIds))
      }
      case 'release':
        return Response.json(await releaseCheckout(key, holderId))
      default:
        throw new StockError('Unknown checkout action.')
    }
  } catch (error) {
    return errorResponse(error)
  }
}
