import { useEffect, useState } from 'react'
import {
  EMPTY_APPROVED,
  fetchApproved,
  submissionsEnabled,
  type ApprovedContent,
} from '../lib/submissions'

// Approved visitor content (photos + hours updates) for one space.
// Resolves to empty immediately when submissions aren't configured.
export function useApprovedSubmissions(spaceId: string): ApprovedContent {
  const [content, setContent] = useState<ApprovedContent>(EMPTY_APPROVED)

  useEffect(() => {
    setContent(EMPTY_APPROVED)
    if (!submissionsEnabled) return
    let cancelled = false
    fetchApproved(spaceId)
      .then((c) => {
        if (!cancelled) setContent(c)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [spaceId])

  return content
}
