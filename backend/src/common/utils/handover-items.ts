/**
 * Danh sách CSVC cho phiếu bàn giao (JSON trong asset_handovers.items).
 * Nguồn: rooms.amenities (ưu tiên) → room_types.amenities (string[] hoặc { assetTemplates }).
 */

export type HandoverTemplateRow = { name: string; defaultCondition?: string }

export type HandoverStoredItem = {
  name: string
  condition: string
  quantity: number
  note: string
}

function dedupeByName(rows: HandoverTemplateRow[]): HandoverTemplateRow[] {
  const seen = new Set<string>()
  const out: HandoverTemplateRow[] = []
  for (const r of rows) {
    const key = r.name.trim().toLowerCase()
    if (!r.name.trim() || seen.has(key)) continue
    seen.add(key)
    out.push({ name: r.name.trim(), defaultCondition: r.defaultCondition })
  }
  return out
}

function parseAmenitiesBlock(amenities: unknown): HandoverTemplateRow[] {
  if (amenities == null) return []

  if (Array.isArray(amenities)) {
    const fromStrings = amenities
      .filter((x): x is string => typeof x === 'string')
      .map((s) => ({ name: s.trim(), defaultCondition: 'good' }))
    return dedupeByName(fromStrings)
  }

  if (typeof amenities === 'object') {
    const o = amenities as Record<string, unknown>
    if (Array.isArray(o.assetTemplates)) {
      const fromTemplates: HandoverTemplateRow[] = []
      for (const t of o.assetTemplates as unknown[]) {
        if (!t || typeof t !== 'object') continue
        const row = t as { name?: unknown; defaultCondition?: unknown }
        const name = typeof row.name === 'string' ? row.name.trim() : ''
        if (!name) continue
        const dc = typeof row.defaultCondition === 'string' ? row.defaultCondition : 'good'
        fromTemplates.push({ name, defaultCondition: dc })
      }
      return dedupeByName(fromTemplates)
    }
  }

  return []
}

export function handoverTemplateRowsFromRoomAndType(
  roomAmenities: unknown,
  roomTypeAmenities: unknown
): HandoverTemplateRow[] {
  const fromRoom = parseAmenitiesBlock(roomAmenities)
  if (fromRoom.length > 0) return fromRoom
  return parseAmenitiesBlock(roomTypeAmenities)
}

/** Map template default → điều kiện UI bàn giao (good / fair / poor) */
function toUiCondition(defaultCondition: string | undefined): string {
  const c = (defaultCondition || 'good').toLowerCase()
  if (c === 'normal') return 'fair'
  if (c === 'broken') return 'poor'
  if (c === 'fair' || c === 'poor') return c
  return 'good'
}

export function buildHandoverItemsForRoom(room: {
  amenities: unknown
  roomType: { amenities: unknown } | null
}): HandoverStoredItem[] {
  const rows = handoverTemplateRowsFromRoomAndType(room.amenities, room.roomType?.amenities)
  return rows.map((r) => ({
    name: r.name,
    condition: toUiCondition(r.defaultCondition),
    quantity: 1,
    note: ''
  }))
}
