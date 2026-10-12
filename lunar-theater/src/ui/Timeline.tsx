import { useTheater } from '../theater/TheaterContext'

export function Timeline() {
  const { t, extra, scrub, playing, togglePlaying, speed, setSpeed, replay, mode, lesson } =
    useTheater()
  const day = ((t % 1) + 1) % 1 * lesson.periodDays

  return (
    <div className="timeline">
      <div className="timeline-marks" aria-hidden="true">
        {lesson.marks.map((m) => (
          <span key={m.label} style={{ left: `${m.t * 100}%` }}>
            {m.label}
          </span>
        ))}
      </div>
      <input
        className="timeline-slider"
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={t}
        aria-label={lesson.timelineAria}
        onChange={(e) => scrub(Number(e.target.value))}
      />
      <div className="timeline-row">
        <div className="timeline-play">
          <button
            type="button"
            className="icon-btn"
            onClick={(e) => {
              e.currentTarget.blur()
              togglePlaying()
            }}
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? '暂停' : '播放'}
          </button>
          <button type="button" className="text-btn" onClick={replay}>
            重演
          </button>
          <span className="day-readout">
            {lesson.periodUnit === '层' ? (
              lesson.insetCaption(t, extra).name
            ) : (
              <>
                第 {day.toFixed(1)} 日
                <small> / {lesson.periodDays.toFixed(lesson.periodDays > 40 ? 0 : 2)}</small>
              </>
            )}
          </span>
        </div>
        <div className="speed">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              className={speed === s ? 'chip is-on' : 'chip'}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
          <span className="speed-hint">{mode === 'demo' ? '演示速度' : lesson.speedExploreHint}</span>
        </div>
      </div>
    </div>
  )
}
