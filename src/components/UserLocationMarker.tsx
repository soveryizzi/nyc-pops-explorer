// Purely a "here's where you are" reference point, like the transit
// dots — no tap target, no interaction. The accent color is used
// deliberately: it's the app's one hue that isn't already claimed by
// a semantic meaning (outdoor=terracotta, indoor=lake), so "you" reads
// as its own distinct thing on the map.
export function UserLocationMarker() {
  return (
    <div className="user-location-marker" aria-hidden="true">
      <span className="user-location-marker__ping" />
      <span className="user-location-marker__dot" />
    </div>
  )
}
