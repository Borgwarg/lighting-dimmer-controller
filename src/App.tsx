import { useEffect, useMemo, useRef, useState } from 'react'
import { clamp, defaultEffects, defaultGroups, initialFixtures, type EffectName, type Fixture, type Group, type ProgramStep, type SavedSequence } from './types'

const cycleTargets = (fixtures: Fixture[], selection: number[]) => {
  if (selection.length) {
    return selection
  }

  return fixtures.map((fixture) => fixture.id)
}

const createFixtureId = (fixtures: Fixture[]) => {
  const ids = fixtures.map((fixture) => fixture.id)
  return ids.length ? Math.max(...ids) + 1 : 1
}

function App() {
  const [fixtures, setFixtures] = useState<Fixture[]>(initialFixtures)
  const [groups, setGroups] = useState<Group[]>(defaultGroups)
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2, 3, 4, 5, 6])
  const [masterLevel, setMasterLevel] = useState<number>(100)
  const [bpm, setBpm] = useState<number>(120)
  const [effect, setEffect] = useState<EffectName | null>('chase')
  const [effectSettings, setEffectSettings] = useState({ width: 2, phase: 0 })
  const [flashOn, setFlashOn] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [fixtureName, setFixtureName] = useState('')
  const [customStepName, setCustomStepName] = useState('')
  const [programSteps, setProgramSteps] = useState<ProgramStep[]>([])
  const [savedSequences, setSavedSequences] = useState<SavedSequence[]>(defaultEffects)
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [isSequencePlaying, setIsSequencePlaying] = useState(false)
  const [beamTick, setBeamTick] = useState(0)
  const tapTimes = useRef<number[]>([])

  const selectedFixtures = useMemo(
    () => fixtures.filter((fixture) => selectedIds.includes(fixture.id)),
    [fixtures, selectedIds],
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBeamTick((value) => value + 1)
    }, 80)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!effect) {
      return
    }

    setFixtures((existing) => {
      const targetIds = cycleTargets(existing, selectedIds)
      const next = existing.map((fixture) => ({ ...fixture }))

      if (effect === 'flash' && flashOn) {
        return next.map((fixture) => {
          const selectedTarget = targetIds.includes(fixture.id)
          return {
            ...fixture,
            level: selectedTarget ? clamp(masterLevel * 1.2, 0, 100) : fixture.level * 0.8,
            on: selectedTarget ? true : fixture.on,
          }
        })
      }

      const width = clamp(effectSettings.width, 1, Math.max(1, targetIds.length))
      const phaseIndex = clamp(effectSettings.phase, 0, 100) / 100
      const phaseOffset = Math.floor(targetIds.length * phaseIndex)
      const cycleStep = Math.floor((beamTick * (bpm / 30)) % targetIds.length)
      const activeSet = new Set<number>()

      for (let index = 0; index < width; index += 1) {
        const targetIndex = (cycleStep + phaseOffset + index) % targetIds.length
        activeSet.add(targetIds[targetIndex])
      }

      switch (effect) {
        case 'chase': {
          return next.map((fixture) => {
            const isIn = activeSet.has(fixture.id)
            const level = isIn ? clamp(masterLevel * 0.9, 0, 100) : 0
            return { ...fixture, level, on: isIn }
          })
        }
        case 'fade': {
          return next.map((fixture) => {
            if (!targetIds.includes(fixture.id)) {
              return fixture
            }

            const pulse = 50 + Math.sin((beamTick / 8) + fixture.id) * 50
            return {
              ...fixture,
              level: clamp(pulse, 0, 100),
              on: true,
            }
          })
        }
        case 'random': {
          return next.map((fixture) => {
            if (!targetIds.includes(fixture.id)) {
              return fixture
            }
            const shouldOn = Math.random() > 0.55
            return {
              ...fixture,
              level: shouldOn ? clamp(masterLevel, 0, 100) : 0,
              on: shouldOn,
            }
          })
        }
        case 'sparkle': {
          return next.map((fixture) => {
            if (!targetIds.includes(fixture.id)) {
              return fixture
            }
            const sparkleChance = (Math.sin((beamTick + fixture.id * 18) / 4) + 1) / 2
            const shouldSpark = sparkleChance > 0.75
            return {
              ...fixture,
              level: shouldSpark ? clamp(masterLevel * 1.2, 0, 100) : 0,
              on: shouldSpark,
            }
          })
        }
        case 'strobe': {
          return next.map((fixture) => {
            if (!targetIds.includes(fixture.id)) {
              return fixture
            }
            const strobeState = Math.sin((beamTick * (bpm / 12)) / 4) > 0
            return {
              ...fixture,
              level: strobeState ? clamp(masterLevel, 0, 100) : 0,
              on: strobeState,
            }
          })
        }
        default:
          return next
      }
    })
  }, [effect, effectSettings, flashOn, bpm, masterLevel, selectedIds, beamTick])

  useEffect(() => {
    if (!isSequencePlaying || savedSequences.length === 0) {
      return
    }

    const sequence = savedSequences[0]
    const frameMs = (60000 / bpm) / 2
    const timer = window.setInterval(() => {
      setSequenceIndex((current) => {
        const nextIndex = current + 1
        if (nextIndex >= sequence.steps.length) {
          return 0
        }
        return nextIndex
      })
    }, frameMs)

    return () => window.clearInterval(timer)
  }, [bpm, isSequencePlaying, savedSequences])

  useEffect(() => {
    if (!isSequencePlaying || savedSequences.length === 0) {
      return
    }

    const activeSequence = savedSequences[0]
    const currentStep = activeSequence.steps[sequenceIndex]
    if (!currentStep) {
      return
    }

    setFixtures((existing) =>
      existing.map((fixture) => {
        const stepLevel = currentStep.levels[fixture.id] ?? fixture.level
        return {
          ...fixture,
          level: clamp(stepLevel, 0, 100),
          on: stepLevel > 0,
        }
      }),
    )
  }, [sequenceIndex, isSequencePlaying, savedSequences])

  const addFixture = () => {
    const trimmed = fixtureName.trim()
    if (!trimmed) {
      return
    }

    const nextId = createFixtureId(fixtures)
    const nextFixture: Fixture = {
      id: nextId,
      name: trimmed,
      channel: nextId,
      level: 50,
      on: true,
      x: 120 + (nextId % 5) * 110,
      y: 120 + (nextId % 3) * 90,
    }

    setFixtures((current) => [...current, nextFixture])
    setSelectedIds((current) => [...new Set([...current, nextId])])
    setFixtureName('')
  }

  const removeSelected = () => {
    if (!selectedIds.length) {
      return
    }

    setFixtures((current) => current.filter((fixture) => !selectedIds.includes(fixture.id)))
    setGroups((current) =>
      current.map((group) => (
        {
          ...group,
          fixtureIds: group.fixtureIds.filter((id) => !selectedIds.includes(id)),
        }
      )),
    )
    setSelectedIds([])
  }

  const addGroup = () => {
    const name = groupName.trim()
    if (!name || !selectedIds.length) {
      return
    }

    const nextId = Math.max(1, ...groups.map((group) => group.id)) + 1
    setGroups((current) => [...current, { id: nextId, name, fixtureIds: selectedIds }])
    setGroupName('')
  }

  const updateFixtureLevel = (id: number, nextLevel: number) => {
    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === id
          ? {
              ...fixture,
              level: clamp(nextLevel, 0, 100),
              on: nextLevel > 0,
            }
          : fixture,
      ),
    )
  }

  const recordProgramStep = () => {
    if (!selectedIds.length) {
      return
    }

    const levels: Record<number, number> = {}
    fixtures.forEach((fixture) => {
      if (selectedIds.includes(fixture.id)) {
        levels[fixture.id] = fixture.level
      }
    })

    const step: ProgramStep = {
      id: Date.now(),
      name: customStepName.trim() || `Step ${programSteps.length + 1}`,
      levels,
      waitBeats: 1,
    }

    setProgramSteps((current) => [...current, step])
    setCustomStepName('')
  }

  const saveCustomSequence = () => {
    if (!programSteps.length) {
      return
    }

    const name = customStepName.trim() || 'Custom Sequence'
    setSavedSequences((current) => [
      {
        id: Date.now(),
        name,
        steps: programSteps,
      },
      ...current,
    ])
    setProgramSteps([])
    setCustomStepName('')
  }

  const tapBpm = () => {
    const now = performance.now()
    tapTimes.current = [...tapTimes.current, now].slice(-8)
    
    if (tapTimes.current.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1])
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      if (avgInterval > 0) {
        const nextBpm = clamp(Math.round(60000 / avgInterval), 40, 220)
        setBpm(nextBpm)
      }
    }
  }

  const stopAllEffects = () => {
    setEffect(null)
    setFlashOn(false)
    setIsSequencePlaying(false)
    setFixtures((current) => current.map((fixture) => ({ ...fixture, level: 0, on: false })))
  }

  const activeBeamCount = fixtures.filter((fixture) => fixture.level > 25).length

  return (
    <div className="app-shell">
      <aside className="sidebar left-panel">
        <div className="panel-header">
          <h2>Fixtures</h2>
          <button onClick={removeSelected}>Remove</button>
        </div>

        <div className="input-row">
          <input
            value={fixtureName}
            onChange={(event) => setFixtureName(event.target.value)}
            placeholder="Fixture name"
          />
          <button onClick={addFixture}>Add</button>
        </div>

        <div className="fixture-list">
          {fixtures.map((fixture) => {
            const isSelected = selectedIds.includes(fixture.id)
            return (
              <div
                key={fixture.id}
                className={`fixture-item ${isSelected ? 'selected' : ''}`}
                onClick={() =>
                  setSelectedIds((current) =>
                    current.includes(fixture.id)
                      ? current.filter((id) => id !== fixture.id)
                      : [...current, fixture.id],
                  )
                }
              >
                <span>{fixture.name}</span>
                <span>{fixture.level.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>

        <div className="panel-header with-space">
          <h2>Groups</h2>
        </div>

        <div className="input-row">
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Group name"
          />
          <button onClick={addGroup}>Save</button>
        </div>

        <div className="group-list">
          {groups.map((group) => (
            <button
              key={group.id}
              className="group-button"
              onClick={() => setSelectedIds(group.fixtureIds)}
            >
              {group.name}
            </button>
          ))}
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Lighting Console</p>
            <h1>Laser Dimmer Control</h1>
          </div>

          <div className="master-wrap">
            <label>Master</label>
            <input
              type="range"
              min={0}
              max={100}
              value={masterLevel}
              onChange={(event) => setMasterLevel(Number(event.target.value))}
            />
            <span>{masterLevel}%</span>
          </div>
        </header>

        <section className="viewer-panel">
          <div className="viewer-header">
            <h3>Fixture View</h3>
            <span>{activeBeamCount} active fixtures</span>
          </div>
          <FixtureViewer 
            fixtures={fixtures} 
            selectedIds={selectedIds} 
            onSelectFixture={(id) => {
              setSelectedIds((current) =>
                current.includes(id)
                  ? current.filter((fid) => fid !== id)
                  : [...current, id],
              )
            }}
          />
        </section>

        <section className="effects-panel">
          <div className="effect-buttons">
            {(['chase', 'flash', 'fade', 'random', 'sparkle', 'strobe'] as EffectName[]).map((item) => (
              <button
                key={item}
                className={item === effect ? 'active' : ''}
                onClick={() => setEffect(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="controls-grid">
            <label>
              Width
              <input
                type="range"
                min={1}
                max={Math.max(1, selectedIds.length || fixtures.length)}
                value={effectSettings.width}
                onChange={(event) =>
                  setEffectSettings((current) => ({ ...current, width: Number(event.target.value) }))
                }
              />
              <span>{effectSettings.width}</span>
            </label>

            <label>
              Phase
              <input
                type="range"
                min={0}
                max={100}
                value={effectSettings.phase}
                onChange={(event) =>
                  setEffectSettings((current) => ({ ...current, phase: Number(event.target.value) }))
                }
              />
              <span>{effectSettings.phase}</span>
            </label>
          </div>

          <div className="bpm-bar">
            <div>
              <span className="label">BPM</span>
              <strong>{bpm}</strong>
            </div>
            <button onClick={tapBpm} className="tap-button">Tap BPM</button>
            <button 
              className="trigger" 
              onMouseDown={() => setFlashOn(true)} 
              onMouseUp={() => setFlashOn(false)} 
              onMouseLeave={() => setFlashOn(false)}
            >
              Flash Trigger
            </button>
            <button 
              className="stop-button"
              onClick={stopAllEffects}
            >
              Stop
            </button>
          </div>
        </section>

        <section className="programmer-panel">
          <div className="panel-header">
            <h2>Programmer</h2>
            <button onClick={recordProgramStep}>Save Step</button>
          </div>

          <div className="input-row narrow">
            <input
              value={customStepName}
              onChange={(event) => setCustomStepName(event.target.value)}
              placeholder="Step name"
            />
            <button onClick={saveCustomSequence}>Save FX</button>
          </div>

          <div className="sequence-list">
            {programSteps.map((step) => (
              <div key={step.id} className="sequence-item">
                <span>{step.name}</span>
                <small>{Object.keys(step.levels).length} fixtures</small>
              </div>
            ))}
          </div>

          <div className="sequence-control">
            <button onClick={() => setIsSequencePlaying((current) => !current)}>
              {isSequencePlaying ? 'Stop' : 'Play'}
            </button>
          </div>
        </section>
      </main>

      <aside className="sidebar right-panel">
        <div className="panel-header">
          <h2>Faders</h2>
        </div>

        <div className="fader-list">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="fader-item">
              <div className="fader-label-row">
                <span>{fixture.name}</span>
                <span>{fixture.level.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={fixture.level}
                onChange={(event) => updateFixtureLevel(fixture.id, Number(event.target.value))}
              />
            </div>
          ))}
        </div>

        <div className="saved-fx-panel">
          <div className="panel-header">
            <h2>Saved FX</h2>
          </div>
          <div className="saved-fx-list">
            {savedSequences.map((sequence) => (
              <button
                key={sequence.id}
                className="fx-button"
                onClick={() => {
                  if (sequence.steps.length) {
                    setSequenceIndex(0)
                    setIsSequencePlaying(true)
                  }
                }}
              >
                {sequence.name}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function FixtureViewer({ 
  fixtures, 
  selectedIds, 
  onSelectFixture 
}: { 
  fixtures: Fixture[]
  selectedIds: number[]
  onSelectFixture: (id: number) => void
}) {
  const fixturesPerRow = 12
  const dotSize = 40
  const gap = 20
  const padding = 20

  const computedWidth = Math.min(fixtures.length, fixturesPerRow) * (dotSize + gap) + padding * 2
  const rows = Math.ceil(fixtures.length / fixturesPerRow)
  const computedHeight = rows * (dotSize + gap) + padding * 2

  const getColorForLevel = (level: number): string => {
    if (level === 0) {
      return '#2a2a2a'
    }
    // Map 0-100 to different red intensities
    // 0% = dark gray, 100% = full red (#ff0000)
    const hue = 0
    const saturation = 100
    const lightness = (level / 100) * 50 // 0-50% lightness
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  return (
    <svg 
      viewBox={`0 0 ${computedWidth} ${computedHeight}`}
      className="fixture-viewer"
      style={{ width: '100%', height: 'auto' }}
    >
      <rect 
        x={0} 
        y={0} 
        width={computedWidth} 
        height={computedHeight} 
        fill="#1a1a1a"
        rx={8}
      />

      {fixtures.map((fixture, index) => {
        const row = Math.floor(index / fixturesPerRow)
        const col = index % fixturesPerRow
        const cx = padding + col * (dotSize + gap) + dotSize / 2
        const cy = padding + row * (dotSize + gap) + dotSize / 2
        const isSelected = selectedIds.includes(fixture.id)
        const color = getColorForLevel(fixture.level)
        const outlineColor = isSelected ? '#b8956a' : 'rgba(255, 255, 255, 0.15)'
        const outlineWidth = isSelected ? 3 : 2

        return (
          <g key={fixture.id}>
            <circle
              cx={cx}
              cy={cy}
              r={dotSize / 2}
              fill={color}
              stroke={outlineColor}
              strokeWidth={outlineWidth}
              cursor="pointer"
              onClick={() => onSelectFixture(fixture.id)}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={fixture.level > 50 ? '#000' : '#aaa'}
              cursor="pointer"
              pointerEvents="none"
              fontWeight="bold"
            >
              {fixture.level.toFixed(0)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default App
