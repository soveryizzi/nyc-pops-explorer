// tesseract.js is only imported inside runOcr (dynamic import), so it
// never touches the main bundle — it's ~a few MB of JS+WASM, loaded
// only when a visitor actually uploads a photo to scan.

// Matches "7am", "7:00 AM", "7 p.m.", etc. — the primary signal a
// line is describing hours, since US POPS plates almost always use
// AM/PM rather than 24-hour time.
const AMPM_TIME = /\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)\b/i

// Secondary signal: plazas that post round-the-clock access often
// say "24 HOUR(S)" or "24/7" instead of a time range.
const TWENTY_FOUR_HOUR_ACCESS = /\b24[\s-]?(hours?|hrs?|\/7)\b/i

/**
 * Best-effort extraction of an hours-looking line (or lines) from raw
 * OCR text. Deliberately conservative — a line only qualifies if it
 * contains an actual time token, not just a keyword like "HOURS" on
 * its own, since a keyword-only match is much more likely to be a
 * false positive (e.g. a section header on the plate). Returns null
 * when nothing qualifies, which the caller treats as "not a plate
 * photo" — the upload still proceeds as a plain photo.
 */
export function extractHoursGuess(rawText: string): string | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const hourLines = lines.filter((line) => AMPM_TIME.test(line) || TWENTY_FOUR_HOUR_ACCESS.test(line))
  if (hourLines.length === 0) return null

  return hourLines.join(' ').replace(/\s+/g, ' ').trim()
}

export interface OcrResult {
  rawText: string
  hoursGuess: string | null
}

/**
 * Runs OCR on an image and returns both the raw text and a best-guess
 * hours line. Never throws for a "no text found" outcome — only for
 * a genuine failure to run OCR at all (caller decides how to degrade,
 * e.g. treat as a plain photo upload).
 */
export async function scanPhotoForHours(file: File): Promise<OcrResult> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return { rawText: text, hoursGuess: extractHoursGuess(text) }
  } finally {
    await worker.terminate()
  }
}
