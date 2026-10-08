import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise, WorkoutSet } from '../../domain';
import type { PreviousSetSuggestion } from '../../db/repositories/workoutRepository';
import { useSettingsContext } from '../../hooks/SettingsProvider';
import { exerciseService } from '../../services/exerciseService';
import { workoutService } from '../../services/workoutService';
import { formatWeight, roundWeight } from '../../utils/weight';
import { ExerciseAutocomplete } from '../ExerciseAutocomplete';
import { SetEditorRow } from './SetEditorRow';

interface ExercisePanelProps {
  exerciseId: string;
  workoutExerciseId: string;
  name: string;
  startedAt: string;
  sets: WorkoutSet[];
  open: boolean;
  finished: boolean;
  skipped?: boolean;
  replacedFromName?: string;
  notes?: string;
  onToggle: () => void;
  onChanged: () => Promise<void>;
}

export function ExercisePanel({
  exerciseId,
  workoutExerciseId,
  name,
  startedAt,
  sets,
  open,
  finished,
  skipped = false,
  replacedFromName,
  notes: initialNotes = '',
  onToggle,
  onChanged,
}: ExercisePanelProps) {
  const { settings } = useSettingsContext();
  const weightUnit = settings?.weightUnit ?? 'kg';
  const [previous, setPrevious] = useState<PreviousSetSuggestion[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [replaceId, setReplaceId] = useState('');
  const [notes, setNotes] = useState(initialNotes);
  const [catalogNotes, setCatalogNotes] = useState('');
  const [catalogImage, setCatalogImage] = useState<string | undefined>();

  const done = sets.filter((set) => set.completed).length;
  const allDone = !skipped && done === sets.length && sets.length > 0;
  const hasNotes = Boolean((initialNotes || notes).trim());

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes, workoutExerciseId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const [prev, exercise] = await Promise.all([
        skipped
          ? Promise.resolve([] as PreviousSetSuggestion[])
          : workoutService.getPreviousForExercise(exerciseId, startedAt),
        exerciseService.getById(exerciseId),
      ]);
      if (cancelled) {
        return;
      }
      setPrevious(prev);
      setCatalogNotes(exercise?.notes ?? '');
      setCatalogImage(exercise?.imageDataUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, exerciseId, startedAt, skipped]);

  useEffect(() => {
    if (!replacing) {
      return;
    }
    let cancelled = false;
    void exerciseService.getAll().then((items) => {
      if (!cancelled) {
        setCatalog(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [replacing]);

  async function handleComplete(set: WorkoutSet, weightKg: number, reps: number) {
    setActionError(null);
    setSavingId(set.id);
    try {
      await workoutService.completeSet(set.id, {
        weightKg: roundWeight(weightKg, 0.25),
        reps: Math.max(0, Math.round(reps)),
      });
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDraft(set: WorkoutSet, weightKg: number, reps: number) {
    try {
      await workoutService.updateSetDraft(set.id, {
        weightKg: roundWeight(weightKg, 0.25),
        reps: Math.max(0, Math.round(reps)),
      });
    } catch {
      // silent draft save
    }
  }

  async function handleUncomplete(setId: string) {
    await workoutService.uncompleteSet(setId);
    await onChanged();
  }

  async function handleAddSet() {
    setSavingId('add');
    try {
      await workoutService.addSet(workoutExerciseId);
      await onChanged();
    } finally {
      setSavingId(null);
    }
  }

  async function handleNotesBlur() {
    const trimmed = notes.trim();
    if (trimmed === (initialNotes ?? '').trim()) {
      return;
    }
    try {
      await workoutService.updateExerciseNotes(workoutExerciseId, trimmed);
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить комментарий');
    }
  }

  async function handleSkip() {
    const confirmed = window.confirm(`Пропустить «${name}»?`);
    if (!confirmed) {
      return;
    }
    await workoutService.skipExercise(workoutExerciseId);
    await onChanged();
  }

  async function handleUnskip() {
    await workoutService.unskipExercise(workoutExerciseId);
    await onChanged();
  }

  async function handleReplace() {
    if (!replaceId || replaceId === exerciseId) {
      setReplacing(false);
      return;
    }
    const next = catalog.find((item) => item.id === replaceId);
    const confirmed = window.confirm(
      `Заменить «${name}» на «${next?.name ?? 'другое'}»? Подходы будут пересобраны.`,
    );
    if (!confirmed) {
      return;
    }
    setSavingId('replace');
    try {
      await workoutService.replaceExercise(workoutExerciseId, replaceId);
      setReplacing(false);
      setReplaceId('');
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось заменить');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className={`exercise-panel${open ? ' is-open' : ''}${skipped ? ' is-skipped' : ''}`}>
      <button type="button" className="exercise-panel-header" onClick={onToggle}>
        <div>
          <div className="exercise-panel-title">
            {name}
            {skipped && <span className="exercise-skipped-tag">пропущено</span>}
          </div>
          <div className="exercise-panel-meta">
            {replacedFromName
              ? `вместо ${replacedFromName}`
              : hasNotes
                ? 'Есть комментарий · подходы'
                : 'Подходы'}
          </div>
        </div>
        <div className={`exercise-panel-badge${allDone ? ' is-done' : ''}`}>
          {skipped ? '—' : `${done}/${sets.length}`}
        </div>
        <span className={`apple-chevron${open ? ' is-open' : ''}`} aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div className="exercise-panel-body">
          <div className="exercise-panel-actions">
            <Link to={`/exercises/${exerciseId}/history`} className="btn btn-sm btn-outline-secondary">
              История
            </Link>
            {!finished &&
              (skipped ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => void handleUnskip()}
                >
                  Вернуть
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => void handleSkip()}
                  >
                    Пропустить
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setReplacing((value) => !value)}
                  >
                    Заменить
                  </button>
                </>
              ))}
          </div>

          {replacing && !finished && (
            <div className="replace-box">
              <ExerciseAutocomplete
                exercises={catalog.filter((item) => item.id !== exerciseId)}
                valueId={replaceId}
                onChange={(exercise) => setReplaceId(exercise?.id ?? '')}
                placeholder="Альтернатива…"
              />
              <button
                type="button"
                className="btn btn-primary touch-btn w-100 mt-2"
                disabled={!replaceId || savingId !== null}
                onClick={() => void handleReplace()}
              >
                Подтвердить замену
              </button>
            </div>
          )}

          {(catalogImage || catalogNotes) && (
            <div className="technique-card" aria-label="Техника из каталога">
              {catalogImage && (
                <img src={catalogImage} alt="" className="technique-card-image" />
              )}
              {catalogNotes && <div className="technique-card-text">{catalogNotes}</div>}
            </div>
          )}

          {!skipped && previous.length > 0 && (
            <div className="previous-strip" aria-label="Прошлый раз">
              {previous.map((set) => (
                <span key={set.setNumber} className="previous-chip">
                  {formatWeight(set.weightKg, weightUnit)} × {set.reps}
                </span>
              ))}
            </div>
          )}

          {actionError && <div className="alert alert-danger py-2">{actionError}</div>}

          {skipped ? (
            <p className="text-secondary mb-0 mt-2">Упражнение пропущено</p>
          ) : (
            <>
              {sets.map((set) => (
                <SetEditorRow
                  key={`${set.id}-${set.completed}-${set.weightKg}-${set.reps}`}
                  set={set}
                  disabled={finished}
                  busy={savingId === set.id}
                  weightUnit={weightUnit}
                  onComplete={handleComplete}
                  onDraft={handleDraft}
                  onUncomplete={handleUncomplete}
                />
              ))}

              {!finished && (
                <button
                  type="button"
                  className="btn btn-outline-secondary touch-btn w-100 mt-2"
                  disabled={savingId !== null}
                  onClick={() => void handleAddSet()}
                >
                  Добавить подход
                </button>
              )}
            </>
          )}

          <label className="exercise-notes">
            <span>Комментарий к упражнению</span>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Личное: как прошло сегодня…"
              value={notes}
              disabled={finished}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => void handleNotesBlur()}
            />
          </label>
        </div>
      )}
    </section>
  );
}
