import { useState, useMemo } from 'react'

const SERVICES = ['MOT', 'ADR', 'CFK'] as const
const REPAIRS = ['Brakes', 'Axels', 'Body'] as const

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface ScheduleItem {
  jobName: string
  bayId: string
  date: string
  startHour: number
  endHour: number
  duration: number
}

interface Slot {
  checkIn: string
  checkOut: string
  totalWorkHours: number
  totalDays: number
  schedule: ScheduleItem[]
}

interface WorkshopResult {
  workshopId: string
  workshopName: string
  canFulfillRequest: boolean
  missingServicesOrRepairs: string[]
  availableSlots: Slot[]
}

interface RequestSummary {
  services: string[]
  repairs: string[]
  startDate: string
  endDate: string
  totalRequestedHours: number
}

interface ApiResponse {
  success: boolean
  request?: RequestSummary
  results?: WorkshopResult[]
  error?: string
  message?: string
}

function App() {
  const defaultStartDate = useMemo(() => todayString(), [])
  const [services, setServices] = useState<string[]>([])
  const [repairs, setRepairs] = useState<string[]>([])
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleRepair = (id: string) => {
    setRepairs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (services.length === 0 && repairs.length === 0) {
      setError('Please select at least one service or repair.')
      setData(null)
      return
    }
    setError(null)
    setLoading(true)
    setData(null)
    try {
      const body: { services: string[]; repairs: string[]; startDate?: string } = {
        services,
        repairs,
      }
      if (startDate) body.startDate = startDate
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: ApiResponse = await res.json()
      setData(json)
      if (!res.ok) {
        setError(json.error || json.message || 'Request failed.')
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Could not reach server.'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon" />
            <span className="logo-text">VIAMANTA</span>
          </div>
          <nav>
            <a href="#" className="nav-link active">WORKSHOP</a>
          </nav>
          <button type="button" className="btn-cta">GET A DEMO</button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">Check workshop availability</h1>
          <p className="hero-sub">Maintenance and repair slots for the next 60 days.</p>
        </section>

        <section className="booking-section">
          <h2 className="section-title">Select services & repairs</h2>
          <p className="section-desc">
            Choose at least one service or repair and a start date. Availability is shown from the start date.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Services</label>
              <div className="checkbox-group">
                {SERVICES.map((id) => (
                  <label key={id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={services.includes(id)}
                      onChange={() => toggleService(id)}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Repairs</label>
              <div className="checkbox-group">
                {REPAIRS.map((id) => (
                  <label key={id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={repairs.includes(id)}
                      onChange={() => toggleRepair(id)}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Start date</label>
              <input
                type="date"
                className="date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date for availability search"
              />
              <p className="section-desc" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                Default: today. Availability is shown for 60 days from this date.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Check availability'}
          </button>
        </section>

        {loading && (
          <section className="loading">
            <p>Loading availability…</p>
          </section>
        )}

        {error && (
          <section className="results-section">
            <div className="error-message" role="alert">{error}</div>
          </section>
        )}

        {data?.success && data.request && (
          <section className="results-section">
            <h2 className="section-title">Available slots</h2>
            <div className="request-summary">
              Request: <strong>{data.request.services?.length ? data.request.services.join(', ') : '—'}</strong> (services) ·{' '}
              <strong>{data.request.repairs?.length ? data.request.repairs.join(', ') : '—'}</strong> (repairs) ·{' '}
              Total hours: <strong>{data.request.totalRequestedHours}h</strong> ·{' '}
              Period: <strong>{data.request.startDate}</strong> to <strong>{data.request.endDate}</strong>
            </div>
            <div className="results-list">
              {data.results?.map((w) => (
                <div
                  key={w.workshopId}
                  className={`workshop-card ${w.canFulfillRequest ? 'can-fulfill' : 'cannot-fulfill'}`}
                >
                  <p className="workshop-name">{w.workshopName}</p>
                  {!w.canFulfillRequest && w.missingServicesOrRepairs?.length > 0 && (
                    <p className="workshop-missing">
                      Missing: {w.missingServicesOrRepairs.join(', ')}
                    </p>
                  )}
                  {w.availableSlots?.length > 0 && (
                    <ul className="slots-list">
                      {w.availableSlots.map((slot, i) => (
                        <li key={i} className="slot-item">
                          <span className="slot-times">{slot.checkIn} → {slot.checkOut}</span>
                          <div className="slot-meta">
                            {slot.totalWorkHours}h work · {slot.totalDays} day(s)
                          </div>
                          <div>
                            {slot.schedule.map((job, j) => (
                              <span key={j} className="schedule-tag">
                                {job.jobName} {job.startHour}:00–{job.endHour}:00 ({job.duration}h)
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Workshop Availability Service — Part of Viamanta fleet maintenance.</p>
      </footer>
    </>
  )
}

export default App
