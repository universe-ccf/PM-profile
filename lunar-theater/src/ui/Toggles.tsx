import { useTheater } from '../theater/TheaterContext'

export function Toggles() {
  const {
    lesson,
    showLabels,
    setShowLabels,
    extra,
    setExtra,
    cameraPreset,
    setCameraPreset,
  } = useTheater()

  return (
    <div className="toggles">
      <label className={showLabels ? 'check is-on' : 'check'}>
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(e) => setShowLabels(e.target.checked)}
        />
        标注
      </label>
      {lesson.extraLabel && (
        <label className={extra ? 'check is-on' : 'check'}>
          <input
            type="checkbox"
            checked={extra}
            onChange={(e) => setExtra(e.target.checked)}
          />
          {lesson.extraLabel}
        </label>
      )}
      <span className="toggle-gap" />
      {lesson.presets.map((p) => (
        <button
          key={p.id}
          type="button"
          className={cameraPreset === p.id ? 'chip is-on' : 'chip'}
          onClick={(e) => {
            e.currentTarget.blur()
            setCameraPreset(p.id)
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
