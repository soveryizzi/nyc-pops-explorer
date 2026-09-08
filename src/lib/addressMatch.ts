import type { PopsSpace } from './resolvers'

function tokenize(text: string): string[] {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

interface AddressKey {
  space: PopsSpace
  number: string
  streetWord: string
}

// space.address is already "<number> <street...>" (see resolveAddress)
// — pull out the house number and the street's first word, the same
// shape a tokenized OCR line takes ("334 WALLABOUT STREET" -> "334"
// then "WALLABOUT" as adjacent tokens).
function addressKey(space: PopsSpace): AddressKey | null {
  const match = /^(\d+)\s+([A-Za-z0-9]+)/.exec(space.address)
  if (!match) return null
  return { space, number: match[1], streetWord: match[2].toUpperCase() }
}

/**
 * Best-effort match of OCR'd photo text to a known POPS space, by
 * house number immediately followed by the street's first word
 * somewhere in the text. Deliberately conservative: returns null on
 * no match *or* on any ambiguity (two different spaces both look
 * plausible), rather than guessing — silently attaching a visitor's
 * photo to the wrong real address is worse than not attaching it at
 * all, and the caller's fallback (plain, space-less feedback) is
 * always a safe default either way.
 */
export function matchSpaceByAddress(rawText: string, spaces: PopsSpace[]): PopsSpace | null {
  const tokens = tokenize(rawText)
  if (tokens.length < 2) return null

  const keys = spaces.map(addressKey).filter((k): k is AddressKey => k !== null)
  if (keys.length === 0) return null

  let matched: PopsSpace | null = null
  for (let i = 0; i < tokens.length - 1; i++) {
    const number = tokens[i]
    const streetWord = tokens[i + 1]
    for (const key of keys) {
      if (key.number !== number || key.streetWord !== streetWord) continue
      if (matched && matched.id !== key.space.id) return null // ambiguous
      matched = key.space
    }
  }
  return matched
}
