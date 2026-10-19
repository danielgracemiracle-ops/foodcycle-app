import { getAllStock, registerStock, restock, setStock } from '@/lib/stock'
import { asArray, asId, asQuantity, errorResponse, readJson } from '@/lib/stock-validation'

export async function GET() {
  try {
    return Response.json({ stock: await getAllStock() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}

/** Registers listings the server has not seen yet. */
export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const items = asArray(body.items, 'items').map((raw) => {
      const item = raw as Record<string, unknown>
      return { foodId: asId(item.foodId, 'food id'), quantity: asQuantity(item.quantity) }
    })
    await registerStock(items)
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

/** A restaurant sets the absolute stock for its listing. */
export async function PUT(request: Request) {
  try {
    const body = await readJson(request)
    await setStock(asId(body.foodId, 'food id'), asQuantity(body.quantity))
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

/** Returns portions to stock after a paid order is cancelled or rejected. */
export async function PATCH(request: Request) {
  try {
    const body = await readJson(request)
    await restock(asId(body.foodId, 'food id'), asQuantity(body.quantity, 1, 100))
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
