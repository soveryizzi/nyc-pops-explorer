import { useState } from 'react'
import { MapView } from './components/MapView'
import { useSpaces } from './hooks/useSpaces'

function App() {
  const { spaces } = useSpaces()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="app">
      <MapView
        spaces={spaces}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDeselect={() => setSelectedId(null)}
      />
    </div>
  )
}

export default App
