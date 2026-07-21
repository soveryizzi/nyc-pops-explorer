const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

/**
 * Downscales a photo client-side before upload. As a side effect of
 * re-encoding through canvas, this also strips all EXIF metadata
 * (including GPS) — canvas exports never carry it, by design.
 *
 * `imageOrientation: 'from-image'` bakes any EXIF rotation into the
 * actual pixels during decode, so the photo still comes out upright
 * after the (now EXIF-free) re-encode — otherwise portrait photos
 * from phones that rely on the EXIF orientation flag would end up
 * sideways once that flag is gone.
 *
 * Falls back to the original file untouched if decoding fails (some
 * browsers can't rasterize HEIC, for instance) — the resize is an
 * optimization, not something a submission should be blocked by.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
