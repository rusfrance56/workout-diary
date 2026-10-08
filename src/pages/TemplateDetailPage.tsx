import { useMemo, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExerciseAutocomplete } from '../components/ExerciseAutocomplete';
import { PencilIcon, TrashIcon } from '../components/icons';
import type { PlannedSet } from '../domain';
import { ensurePlannedSets, normalizePlannedSets } from '../domain';
import { useExercises } from '../hooks/useExercises';
import { useTemplateEditor } from '../hooks/useProgramsEditor';
import { useSettingsContext } from '../hooks/SettingsProvider';
import { displayToKg, formatSetsCompact, kgToDisplay } from '../utils/weight';

const DEFAULT_SETS: PlannedSet[] = normalizePlannedSets([
  { weightKg: 0, reps: 8 },
  { weightKg: 0, reps: 8 },
  { weightKg: 0, reps: 8 },
]);

export function TemplateDetailPage() {
  const { programId, templateId } = useParams<{ programId: string; templateId: string }>();
  const {
    data,
    loading,
    error,
    rename,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
  } = useTemplateEditor(templateId);
  const { exercises: catalog } = useExercises();
  const { settings } = useSettingsContext();
  const weightUnit = settings?.weightUnit ?? 'kg';

  const [showAdd, setShowAdd] = useState(false);
  const [exerciseId, setExerciseId] = useState('');
  const [plannedSets, setPlannedSets] = useState<PlannedSet[]>(DEFAULT_SETS);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const availableExercises = useMemo(() => {
    const used = new Set(data?.exercises.map((item) => item.exerciseId) ?? []);
    return catalog.filter((item) => !used.has(item.id));
  }, [catalog, data]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    if (!exerciseId) {
      setActionError('Выберите упражнение из списка');
      return;
    }
    try {
      await addExercise({
        exerciseId,
        plannedSets,
      });
      setShowAdd(false);
      setExerciseId('');
      setPlannedSets(DEFAULT_SETS);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось добавить');
    }
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editId) {
      return;
    }
    if (!exerciseId) {
      setActionError('Выберите упражнение из списка');
      return;
    }
    setActionError(null);
    try {
      await updateExercise(editId, { plannedSets, exerciseId });
      setEditId(null);
      setExerciseId('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить');
    }
  }

  function startEdit(item: {
    id: string;
    exerciseId: string;
    plannedSets?: PlannedSet[];
    targetSets: number;
    minReps: number;
    maxReps: number;
  }) {
    setEditId(item.id);
    setExerciseId(item.exerciseId);
    setPlannedSets(ensurePlannedSets(item));
    setShowAdd(false);
  }

  const editChoices = useMemo(() => {
    if (!editId || !data) {
      return availableExercises;
    }
    const current = data.exercises.find((item) => item.id === editId);
    if (!current) {
      return availableExercises;
    }
    const currentExercise = catalog.find((item) => item.id === current.exerciseId);
    if (!currentExercise) {
      return availableExercises;
    }
    if (availableExercises.some((item) => item.id === currentExercise.id)) {
      return availableExercises;
    }
    return [currentExercise, ...availableExercises];
  }, [availableExercises, catalog, data, editId]);

  if (loading) {
    return <p className="text-secondary">Загрузка…</p>;
  }

  if (error || !data) {
    return (
      <div className="d-flex flex-column gap-3">
        <p className="text-danger mb-0">{error ?? 'День не найден'}</p>
        <Link
          to={programId ? `/programs/${programId}` : '/programs'}
          className="btn btn-outline-secondary touch-btn"
        >
          Назад
        </Link>
      </div>
    );
  }

  const { template, program, exercises } = data;

  return (
    <div className="d-flex flex-column gap-3">
      <header className="page-header">
        <Link to={`/programs/${program.id}`} className="page-back">
          ← {program.name}
        </Link>
        {editingName ? (
          <form
            className="day-name-edit"
            onSubmit={(event) => {
              event.preventDefault();
              void (async () => {
                try {
                  await rename(nameDraft);
                  setEditingName(false);
                  setActionError(null);
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Не удалось переименовать');
                }
              })();
            }}
          >
            <input
              className="form-control day-name-input"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              placeholder="Название дня"
              autoFocus
              aria-label="Название дня"
            />
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary touch-btn-sm flex-grow-1">
                Сохранить
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary touch-btn-sm"
                onClick={() => {
                  setEditingName(false);
                  setNameDraft(template.name);
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div className="day-name-view">
            <h1 className="page-title mb-0">{template.name}</h1>
            <button
              type="button"
              className="icon-btn"
              aria-label="Изменить название дня"
              title="Изменить название"
              onClick={() => {
                setNameDraft(template.name);
                setEditingName(true);
              }}
            >
              <PencilIcon />
            </button>
          </div>
        )}
      </header>

      <div className="d-flex justify-content-between align-items-center">
        <div className="section-label mb-0">Упражнения</div>
        <button
          type="button"
          className="btn btn-primary touch-btn-sm"
          onClick={() => {
            setShowAdd((value) => !value);
            setEditId(null);
            setExerciseId('');
            setPlannedSets(DEFAULT_SETS);
          }}
        >
          {showAdd ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {showAdd && (
        <form className="card border-0" onSubmit={(event) => void handleAdd(event)}>
          <div className="card-body d-flex flex-column gap-3">
            <div>
              <label className="form-label">Упражнение</label>
              <ExerciseAutocomplete
                exercises={availableExercises}
                valueId={exerciseId}
                onChange={(exercise) => setExerciseId(exercise?.id ?? '')}
              />
            </div>
            <PlannedSetsEditor
              sets={plannedSets}
              onChange={setPlannedSets}
              weightUnit={weightUnit}
            />
            <button
              type="submit"
              className="btn btn-primary touch-btn"
              disabled={!exerciseId || availableExercises.length === 0}
            >
              Добавить в день
            </button>
          </div>
        </form>
      )}

      {actionError && <div className="alert alert-danger py-2 mb-0">{actionError}</div>}

      {exercises.length === 0 ? (
        <p className="text-secondary">Пока пусто — добавьте упражнения</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {exercises.map((item) => {
            const sets = ensurePlannedSets(item);
            const isEditing = editId === item.id;
            return (
              <section
                key={item.id}
                className={`exercise-panel exercise-panel--compact${isEditing ? ' is-open' : ''}${dragId === item.id ? ' is-dragging' : ''}`}
                draggable={!isEditing}
                onDragStart={() => setDragId(item.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event: DragEvent) => event.preventDefault()}
                onDrop={() => {
                  if (!dragId || dragId === item.id) {
                    setDragId(null);
                    return;
                  }
                  const ids = exercises.map((entry) => entry.id);
                  const from = ids.indexOf(dragId);
                  const to = ids.indexOf(item.id);
                  if (from < 0 || to < 0) {
                    setDragId(null);
                    return;
                  }
                  const next = [...ids];
                  next.splice(from, 1);
                  next.splice(to, 0, dragId);
                  setDragId(null);
                  void reorderExercises(next);
                }}
              >
                <div className="compact-row">
                  <div className="drag-handle" title="Перетащите для порядка" aria-hidden>
                    ⋮⋮
                  </div>
                  <div className="compact-row-main">
                    <div className="exercise-panel-title">{item.exerciseName}</div>
                    {!isEditing && (
                      <div className="exercise-panel-meta">
                        {formatSetsCompact(sets, weightUnit)}
                      </div>
                    )}
                  </div>
                  <div className="compact-row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Изменить"
                      title="Изменить"
                      onClick={() => (isEditing ? setEditId(null) : startEdit(item))}
                    >
                      <PencilIcon size={17} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label="Удалить"
                      title="Удалить"
                      onClick={() => {
                        if (window.confirm(`Убрать «${item.exerciseName}»?`)) {
                          void removeExercise(item.id);
                        }
                      }}
                    >
                      <TrashIcon size={17} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="exercise-panel-body">
                    <form
                      className="d-flex flex-column gap-3"
                      onSubmit={(event) => void handleSaveEdit(event)}
                    >
                      <div>
                        <label className="form-label">Упражнение</label>
                        <ExerciseAutocomplete
                          exercises={editChoices}
                          valueId={exerciseId}
                          onChange={(exercise) => setExerciseId(exercise?.id ?? '')}
                        />
                      </div>
                      <PlannedSetsEditor
                        sets={plannedSets}
                        onChange={setPlannedSets}
                        weightUnit={weightUnit}
                      />
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary touch-btn flex-grow-1">
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary touch-btn"
                          onClick={() => {
                            setEditId(null);
                            setExerciseId('');
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlannedSetsEditor({
  sets,
  onChange,
  weightUnit,
}: {
  sets: PlannedSet[];
  onChange: (sets: PlannedSet[]) => void;
  weightUnit: 'kg' | 'lb';
}) {
  const unitLabel = weightUnit === 'lb' ? 'lb' : 'кг';

  function updateSet(index: number, patch: Partial<PlannedSet>) {
    const next = sets.map((set, setIndex) =>
      setIndex === index ? { ...set, ...patch } : set,
    );
    onChange(normalizePlannedSets(next));
  }

  function removeSet(index: number) {
    if (sets.length <= 1) {
      return;
    }
    onChange(normalizePlannedSets(sets.filter((_, setIndex) => setIndex !== index)));
  }

  function addSet() {
    const last = sets[sets.length - 1];
    onChange(
      normalizePlannedSets([
        ...sets,
        { weightKg: last?.weightKg ?? 0, reps: last?.reps ?? 8 },
      ]),
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      <div className="form-label mb-0">Подходы</div>
      {sets.map((set, index) => (
        <div key={set.setNumber} className="planned-set-row">
          <div className="planned-set-num">{set.setNumber}</div>
          <div className="input-with-suffix">
            <input
              type="number"
              inputMode="decimal"
              step={weightUnit === 'lb' ? '0.5' : '0.25'}
              min="0"
              className="form-control"
              aria-label={`Вес, ${unitLabel}`}
              value={kgToDisplay(set.weightKg, weightUnit) || ''}
              onChange={(event) =>
                updateSet(index, {
                  weightKg: displayToKg(
                    Number(event.target.value.replace(',', '.')) || 0,
                    weightUnit,
                  ),
                })
              }
            />
            <span className="input-suffix" aria-hidden>
              {unitLabel}
            </span>
          </div>
          <div className="input-with-suffix">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              className="form-control"
              aria-label="Повторы"
              value={set.reps || ''}
              onChange={(event) => updateSet(index, { reps: Number(event.target.value) || 1 })}
            />
            <span className="input-suffix" aria-hidden>
              повт
            </span>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            disabled={sets.length <= 1}
            aria-label="Убрать подход"
            onClick={() => removeSet(index)}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-outline-secondary touch-btn w-100" onClick={addSet}>
        Добавить подход
      </button>
    </div>
  );
}
