/**
 * Build handover checklist rows from room_types.amenities or rooms.amenities.
 * Supports: string[] (form loại phòng) và legacy { assetTemplates: { name, defaultCondition? }[] }.
 */

export type HandoverTemplateRow = { name: string; defaultCondition?: string }

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
      .map((s) => ({ name: s.trim(), defaultCondition: 'good' as const }))
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

/**
 * Ưu tiên CSVC khai báo theo phòng; nếu trống thì dùng theo loại phòng.
 */
export function handoverTemplatesFromRoomAndType(
  roomAmenities: unknown,
  roomTypeAmenities: unknown
): HandoverTemplateRow[] {
  const fromRoom = parseAmenitiesBlock(roomAmenities)
  if (fromRoom.length > 0) return fromRoom
  return parseAmenitiesBlock(roomTypeAmenities)
}
