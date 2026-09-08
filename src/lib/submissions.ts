import { supabase } from './supabase'

export const submissionsEnabled = supabase !== null

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

export interface ApprovedPhoto {
  id: string
  url: string
}

export interface ApprovedHours {
  id: string
  hoursText: string
  createdAt: string
}

export interface ApprovedContent {
  photos: ApprovedPhoto[]
  hours: ApprovedHours[]
}

export const EMPTY_APPROVED: ApprovedContent = { photos: [], hours: [] }

interface SubmissionRow {
  id: string
  kind: 'photo' | 'hours' | 'plate'
  hours_text: string | null
  photo_path: string | null
  created_at: string
}

const BUCKET = 'pops-photos'

// Thrown specifically when the storage upload step fails, so a caller
// can tell "your photo didn't make it up" apart from "the submission
// itself couldn't be saved" — two different, differently-actionable
// messages to show (see FeedbackForm's error handling).
export class PhotoUploadError extends Error {
  constructor() {
    super('Photo upload failed')
    this.name = 'PhotoUploadError'
  }
}

function fileExt(file: File): string {
  return (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
}

function photoPath(spaceId: string, file: File): string {
  const safeSpace = spaceId.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `${safeSpace}/${crypto.randomUUID()}.${fileExt(file)}`
}

// Feedback isn't tied to a space, so its photos get their own storage
// prefix rather than reusing a per-space folder.
function feedbackPhotoPath(file: File): string {
  return `feedback/${crypto.randomUUID()}.${fileExt(file)}`
}

export async function submitHours(spaceId: string, hoursText: string): Promise<void> {
  if (!supabase) throw new Error('Submissions are not configured')
  const { error } = await supabase
    .from('submissions')
    .insert({ space_id: spaceId, kind: 'hours', hours_text: hoursText })
  if (error) throw error
}

// `message`/`email` are optional extras: PhotosSection's per-space
// flow never sends them, but the general feedback form does when it
// auto-matches an uploaded photo to a space (see FeedbackForm +
// lib/addressMatch) — the visitor's typed note shouldn't vanish just
// because their photo got redirected out of the plain 'feedback' kind.
export async function submitPhoto(
  spaceId: string,
  file: File,
  message?: string,
  email?: string,
): Promise<void> {
  if (!supabase) throw new Error('Submissions are not configured')
  const path = photoPath(spaceId, file)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (uploadError) throw new PhotoUploadError()

  const { error } = await supabase
    .from('submissions')
    .insert({ space_id: spaceId, kind: 'photo', photo_path: path, message: message || null, email: email || null })
  if (error) throw error
}

// A photo of the legally-required hours plate, OCR'd client-side. One
// row carries both hours_text and photo_path, so a moderator reviews
// the claimed hours right next to the photo they were read from.
export async function submitPlate(
  spaceId: string,
  file: File,
  hoursText: string,
  message?: string,
  email?: string,
): Promise<void> {
  if (!supabase) throw new Error('Submissions are not configured')
  const path = photoPath(spaceId, file)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (uploadError) throw new PhotoUploadError()

  const { error } = await supabase.from('submissions').insert({
    space_id: spaceId,
    kind: 'plate',
    photo_path: path,
    hours_text: hoursText,
    message: message || null,
    email: email || null,
  })
  if (error) throw error
}

// General app feedback, not tied to any space — space_id is left out
// of the insert (nullable column, exactly for this kind). The photo
// is optional and, when present, goes through the same
// upload-then-reference-the-path flow as submitPhoto/submitPlate.
export async function submitFeedback(message: string, email?: string, photo?: File): Promise<void> {
  if (!supabase) throw new Error('Submissions are not configured')

  let path: string | undefined
  if (photo) {
    path = feedbackPhotoPath(photo)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, photo, { contentType: photo.type || undefined })
    if (uploadError) throw new PhotoUploadError()
  }

  const { error } = await supabase
    .from('submissions')
    .insert({ kind: 'feedback', message, email: email || null, photo_path: path ?? null })
  if (error) throw error
}

export async function fetchApproved(spaceId: string): Promise<ApprovedContent> {
  if (!supabase) return EMPTY_APPROVED
  const { data, error } = await supabase
    .from('submissions')
    .select('id, kind, hours_text, photo_path, created_at')
    .eq('space_id', spaceId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error || !data) return EMPTY_APPROVED

  const rows = data as SubmissionRow[]
  return {
    // 'plate' rows have both fields — they show up in the photo grid
    // *and* supply the "last updated" hours line below.
    photos: rows
      .filter((r) => (r.kind === 'photo' || r.kind === 'plate') && r.photo_path)
      .map((r) => ({
        id: r.id,
        url: supabase!.storage.from(BUCKET).getPublicUrl(r.photo_path!).data.publicUrl,
      })),
    hours: rows
      .filter((r) => (r.kind === 'hours' || r.kind === 'plate') && r.hours_text)
      .map((r) => ({ id: r.id, hoursText: r.hours_text!, createdAt: r.created_at })),
  }
}
