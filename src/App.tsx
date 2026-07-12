import { useState } from 'react'
import { MapView } from './components/MapView'
import { SpaceDetail } from './components/SpaceDetail'
import { useSpaces } from './hooks/useSpaces'

function App() {
  const { spaces } = useSpaces()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = spaces.find((space) => space.id === selectedId) ?? null

  return (
    <div className="app">
      <MapView
        spaces={spaces}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDeselect={() => setSelectedId(null)}
      />
      {selected && <SpaceDetail space={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

export default App
