import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ExerciseAutocomplete } from '../components/ExerciseAutocomplete';
import { PencilIcon, TrashIcon } from '../components/icons';
import { PageBack } from '../components/PageBack';
import { PlannedSetsEditor } from '../components/workout/PlannedSetsEditor';
import type { PlannedSet } from '../domain';
import { ensurePlannedSets, normalizePlannedSets } from '../domain';
import { useExercises } from '../hooks/useExercises';
import { usePointerReorder } from '../hooks/usePointerReorder';
import { useTemplateEditor } from '../hooks/useProgramsEditor';
import { useSettingsContext } from '../hooks/SettingsProvider';
import { formatSetsCompact } from '../utils/weight';

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

  const baselineIds = useMemo(
    () => data?.exercises.map((item) => item.id) ?? [],
    [data?.exercises],
  );

  const onReorder = useCallback(
    (orderedIds: string[]) => {
      void reorderExercises(orderedIds);
    },
    [reorderExercises],
  );

  const { dragId, orderedIds, handleProps, itemAttr } = usePointerReorder(baselineIds, onReorder);

  const listExercises = useMemo(() => {
    const list = data?.exercises ?? [];
    const byId = new Map(list.map((item) => [item.id, item]));
    return orderedIds.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
  }, [data?.exercises, orderedIds]);

  const backFallback = programId ? `/programs/${programId}` : '/programs';

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3">
        <PageBack fallback={backFallback} />
        <p className="text-secondary">Загрузка…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="d-flex flex-column gap-3">
        <PageBack fallback={backFallback} />
        <p className="text-danger mb-0">{error ?? 'День не найден'}</p>
      </div>
    );
  }

  const { template, program, exercises } = data;

  return (
    <div className="d-flex flex-column gap-3">
      <header className="page-header">
        <PageBack fallback={`/programs/${program.id}`} />
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
              className="btn btn-primary touch-btn-sm w-100"
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
          {listExercises.map((item) => {
            const sets = ensurePlannedSets(item);
            const isEditing = editId === item.id;
            return (
              <section
                key={item.id}
                className={`exercise-panel exercise-panel--compact${isEditing ? ' is-open' : ''}${dragId === item.id ? ' is-dragging' : ''}`}
                {...itemAttr(item.id)}
              >
                <div className="compact-row compact-row--flush">
                  <div
                    className="drag-handle"
                    title="Перетащите для порядка"
                    aria-label="Перетащить"
                    role="button"
                    tabIndex={isEditing ? -1 : 0}
                    onPointerDown={(event) => {
                      if (isEditing) {
                        return;
                      }
                      handleProps.onPointerDown(item.id, event);
                    }}
                    onPointerMove={handleProps.onPointerMove}
                    onPointerUp={handleProps.end}
                    onPointerCancel={handleProps.end}
                  >
                    ⋮⋮
                  </div>
                  <button
                    type="button"
                    className="exercise-row-main compact-row-main"
                    onClick={() => (isEditing ? setEditId(null) : startEdit(item))}
                  >
                    <div className="flex-grow-1 min-w-0 text-start">
                      <div className="exercise-panel-title">{item.exerciseName}</div>
                      {!isEditing && (
                        <div className="exercise-panel-meta">
                          {formatSetsCompact(sets, weightUnit)}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="btn-group exercise-row-actions" role="group" aria-label="Действия">
                    <button
                      type="button"
                      className="btn btn-danger exercise-action-btn"
                      aria-label="Удалить"
                      title="Удалить"
                      onClick={() => {
                        if (window.confirm(`Убрать «${item.exerciseName}»?`)) {
                          void removeExercise(item.id);
                        }
                      }}
                    >
                      <TrashIcon size={20} />
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
                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary touch-btn-sm flex-grow-1">
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary touch-btn-sm"
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
