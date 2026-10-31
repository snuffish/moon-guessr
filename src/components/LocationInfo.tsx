import { useEffect, useState } from 'react'
import { formatCoords, type LocationState } from '../lib/location'
import { getMoonSky } from '../lib/moon'
import { lookupPlace } from '../lib/place'

function formatTime(date: Date, at: Date): string {
  const sameDay = date.toDateString() === at.toDateString()
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
    ...(sameDay ? {} : { weekday: 'short' }),
  } as Intl.DateTimeFormatOptions).format(date)
}

function SkyLine({ at, latitude, longitude }: { at: Date; latitude: number; longitude: number }) {
  const sky = getMoonSky(at, latitude, longitude)
  const events = [
    sky.nextRise && { label: 'rises', time: sky.nextRise },
    sky.nextSet && { label: 'sets', time: sky.nextSet },
  ]
    .filter((e): e is { label: string; time: Date } => Boolean(e))
    .sort((a, b) => +a.time - +b.time)

  return (
    <p>
      Moon is {sky.up ? 'up' : 'down'} ({Math.round(sky.altitude)}°, {sky.direction})
      {events.length === 0
        ? ' · no moonrise or moonset in the next 2 days'
        : events.map((e) => ` · ${e.label} ${formatTime(e.time, at)}`).join('')}
    </p>
  )
}

function usePlace(location: LocationState): string | null {
  const [place, setPlace] = useState<string | null>(null)
  const latitude = location.status === 'ok' ? location.latitude : null
  const longitude = location.status === 'ok' ? location.longitude : null

  useEffect(() => {
    setPlace(null)
    if (latitude === null || longitude === null) return
    const controller = new AbortController()
    lookupPlace(latitude, longitude, controller.signal).then((p) => {
      if (!controller.signal.aborted) setPlace(p)
    })
    return () => controller.abort()
  }, [latitude, longitude])

  return place
}

export function LocationInfo({ location, at }: { location: LocationState; at: Date }) {
  const place = usePlace(location)
  if (location.status === 'pending') return <p>Your location: locating…</p>
  if (location.status === 'error') return <p>Your location: {location.message}</p>
  const km = Math.max(1, Math.round(location.accuracy / 1000))
  const mapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=10/${location.latitude}/${location.longitude}`
  return (
    <>
      <p>
        Your location:{' '}
        {place && (
          <>
            <strong>{place}</strong>{' '}
            <small>
              (© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>)
            </small>{' '}
            ·{' '}
          </>
        )}
        <a href={mapUrl} target="_blank" rel="noreferrer">
          {formatCoords(location.latitude, location.longitude)}
        </a>{' '}
        (±{km} km)
      </p>
      <SkyLine at={at} latitude={location.latitude} longitude={location.longitude} />
    </>
  )
}
