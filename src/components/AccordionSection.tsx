import { useId, useState, type ReactNode } from 'react'

interface AccordionSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

// Same grid-rows 0fr/1fr collapse technique already used for the
// header's search/filter panels (AppHeader) — kept consistent rather
// than inventing a second way to animate a collapsible section.
export function AccordionSection({ title, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className="accordion__section">
      <button
        type="button"
        className="accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="accordion__trigger-label">{title}</span>
        <svg
          className="accordion__chevron"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
      </button>
      <div className="accordion__panel" data-open={open} id={panelId}>
        <div className="accordion__panel-inner">
          <div className="accordion__content">{children}</div>
        </div>
      </div>
    </div>
  )
}
