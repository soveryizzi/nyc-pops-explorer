import { FeedbackForm } from './FeedbackForm'
import { useId } from 'react'

interface SettingsPanelProps {
  /* Subway station layer visibility — a map display toggle, not a
     POPS space filter, so it isn't part of the URL-driven FilterState. */
  showTransit: boolean
  onToggleTransit: (show: boolean) => void
}

// Lives inside the header's settings panel (see AppHeader): the data
// disclaimer, app settings (map toggles + feedback form), and credits.
export function SettingsPanel({ showTransit, onToggleTransit }: SettingsPanelProps) {
  const transitToggleId = useId()

  return (
    <div className="settings-panel">
      <section className="settings-panel__section">
        <h2 className="settings-panel__heading">A note</h2>
        <p className="settings-panel__text">
          This dataset hasn't been updated recently, so details like hours, amenities, and
          accessibility may not be accurate. We recommend verifying before you visit.
        </p>
      </section>

      <section className="settings-panel__section">
        <h2 className="settings-panel__heading">Settings</h2>
        <div className="toggle-row">
          <label className="toggle-row__label" htmlFor={transitToggleId}>
            Show train stations
          </label>
          <input
            id={transitToggleId}
            type="checkbox"
            role="switch"
            className="toggle"
            checked={showTransit}
            onChange={(e) => onToggleTransit(e.target.checked)}
          />
        </div>
        <FeedbackForm />
      </section>

      <section className="settings-panel__section">
        <h2 className="settings-panel__heading">Credits</h2>
        <p className="settings-panel__text">
          Map/data credits: OpenStreetMap contributors, OpenFreeMap, and NYC Open Data.
        </p>
      </section>
    </div>
  )
}
