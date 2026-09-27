import { useEffect, useMemo, useRef, useState } from 'react'
import { clamp, defaultEffects, defaultGroups, initialFixtures, type EffectName, type Fixture, type Group, type ProgramStep, type SavedSequence } from './types'

const totalStageWidth = 760
const totalStageHeight = 400

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
  const [effect, setEffect] = useState<EffectName>('chase')
  const [effectSettings, setEffectSettings] = useState({ width: 2, phase: 0, speed: 1 })
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
      const cycleStep = Math.floor((beamTick * (bpm / 30) * effectSettings.speed) % targetIds.length)
      const activeSet = new Set<number>()

      for (let index = 0; index < width; index += 1) {
        const targetIndex = (cycleStep + phaseOffset + index) % targetIds.length
        activeSet.add(targetIds[targetIndex])
      }

      switch (effect) {
        case 'chase': {
          return next.map((fixture) => {
            const isIn = activeSet.has(fixture.id)
            const level = isIn ? clamp(masterLevel * 0.9, 0, 100) : clamp(fixture.level * 0.82, 0, 100)
            return { ...fixture, level, on: isIn || fixture.on }
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
              level: shouldSpark ? clamp(masterLevel * 1.2, 0, 100) : clamp(fixture.level * 0.62, 0, 100),
              on: shouldSpark || fixture.on,
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
      current.map((group) => ({
        ...group,
        fixtureIds: group.fixtureIds.filter((id) => !selectedIds.includes(id)),
      })),
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
    tapTimes.current = [...tapTimes.current, now].slice(-4)
    if (tapTimes.current.length >= 2) {
      const diff = tapTimes.current[tapTimes.current.length - 1] - tapTimes.current[0]
      if (diff > 0) {
        const nextBpm = clamp(Math.round((60000 * (tapTimes.current.length - 1)) / diff), 40, 220)
        setBpm(nextBpm)
      }
    }
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
            <h3>Beam Viewer</h3>
            <span>{activeBeamCount} active beams</span>
          </div>
          <BeamViewer fixtures={fixtures} selectedIds={selectedIds} tick={beamTick} />
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

            <label>
              Speed
              <input
                type="range"
                min={1}
                max={10}
                step={0.1}
                value={effectSettings.speed}
                onChange={(event) =>
                  setEffectSettings((current) => ({ ...current, speed: Number(event.target.value) }))
                }
              />
              <span>{effectSettings.speed.toFixed(1)}x</span>
            </label>
          </div>

          <div className="bpm-bar">
            <div>
              <span className="label">BPM</span>
              <strong>{bpm}</strong>
            </div>
            <button onClick={tapBpm}>Tap BPM</button>
            <button className="trigger" onMouseDown={() => setFlashOn(true)} onMouseUp={() => setFlashOn(false)} onMouseLeave={() => setFlashOn(false)}>
              Flash Trigger
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
            <button onClick={() => setIsSequencePlaying((current) => !current)}>{isSequencePlaying ? 'Stop' : 'Play'}</button>
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

function BeamViewer({ fixtures, selectedIds, tick }: { fixtures: Fixture[]; selectedIds: number[]; tick: number }) {
  return (
    <svg viewBox={`0 0 ${totalStageWidth} ${totalStageHeight}`} className="beam-viewer">
      <defs>
        <linearGradient id="beamGlow" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255, 110, 110, 0.15)" />
          <stop offset="50%" stopColor="rgba(255, 80, 80, 0.8)" />
          <stop offset="100%" stopColor="rgba(255, 40, 40, 0.2)" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={totalStageWidth} height={totalStageHeight} rx={20} fill="#101420" />

      {Array.from({ length: 10 }).map((_, index) => (
        <line
          key={`grid-${index}`}
          x1={index * 80}
          y1={0}
          x2={index * 80}
          y2={totalStageHeight}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {Array.from({ length: 7 }).map((_, index) => (
        <line
          key={`grid-h-${index}`}
          x1={0}
          y1={index * 60}
          x2={totalStageWidth}
          y2={index * 60}
          stroke="rgba(255,255,255,0.05)"
        />
      ))}

      {fixtures.map((fixture) => {
        const isSelected = selectedIds.includes(fixture.id)
        const angle = ((fixture.id * 57 + tick * 2.6) % 360) * (Math.PI / 180)
        const beamLength = 120 + fixture.level * 2.2
        const endX = fixture.x + Math.cos(angle) * beamLength
        const endY = fixture.y + Math.sin(angle) * beamLength

        return (
          <g key={fixture.id}>
            <circle cx={fixture.x} cy={fixture.y} r={8 + fixture.level / 18} fill={isSelected ? '#ff6b6b' : '#ffb5b5'} opacity={0.75} />
            <line
              x1={fixture.x}
              y1={fixture.y}
              x2={endX}
              y2={endY}
              stroke="url(#beamGlow)"
              strokeWidth={1 + fixture.level / 35}
              opacity={0.55 + fixture.level / 120}
            />
            <circle cx={endX} cy={endY} r={2 + fixture.level / 28} fill="#ff5252" opacity={0.9} />
          </g>
        )
      })}
    </svg>
  )
}

export default App
