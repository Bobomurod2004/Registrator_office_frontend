function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Backend `student_profile`/`employee_profile`ni ba'zan JSON-satr, ba'zan
 *  to'g'ridan-to'g'ri obyekt, ba'zan Python dict repri (bitta qo'shtirnoq,
 *  True/False/None) sifatida qaytaradi — barchasini qo'llab-quvvatlaydi. */
export function parseProfileJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (!trimmed) return null
  const direct = tryParseJson(trimmed)
  if (direct) return direct
  const pythonLike = trimmed
    .replace(/'/g, '"')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
  return tryParseJson(pythonLike)
}
