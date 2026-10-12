import { useTheater } from '../theater/TheaterContext'

export function Narration() {
  const { title, body, notice, setNotice, mode } = useTheater()

  return (
    <section className="narration" aria-live="polite">
      <p className="narration-mode">{mode === 'demo' ? '演示' : '探究'}</p>
      <h2>{title}</h2>
      <p className="narration-body">{body}</p>
      {notice && (
        <p className="narration-notice">
          {notice}
          <button type="button" onClick={() => setNotice(null)}>
            好
          </button>
        </p>
      )}
    </section>
  )
}
