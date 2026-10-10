import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageBack } from '../components/PageBack';
import { ExercisePanel } from '../components/workout/ExercisePanel';
import { useWorkoutDetails } from '../hooks/useWorkouts';
import { workoutService } from '../services/workoutService';
import { formatDateRu } from '../utils/date';

export function ActiveWorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { details, loading, error, refresh } = useWorkoutDetails(workoutId);
  const [openId, setOpenId] = useState<string | null>(null);

  async function handleFinish() {
    if (!details) {
      return;
    }

    if (workoutService.hasIncompleteSets(details)) {
      const sure = window.confirm(
        'Есть незавершённые подходы. Вы уверены, что хотите завершить тренировку?',
      );
      if (!sure) {
        return;
      }
    } else {
      const confirmed = window.confirm('Завершить тренировку?');
      if (!confirmed) {
        return;
      }
    }

    await workoutService.finishWorkout(details.workout.id);
    navigate('/', { replace: true });
  }

  async function handleDelete() {
    if (!details) {
      return;
    }
    const confirmed = window.confirm(
      `Удалить тренировку «${details.workout.name}»? Это действие нельзя отменить.`,
    );
    if (!confirmed) {
      return;
    }
    await workoutService.deleteWorkout(details.workout.id);
    navigate('/', { replace: true });
  }

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3">
        <PageBack />
        <p className="text-secondary">Загрузка…</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="d-flex flex-column gap-3">
        <PageBack />
        <p className="text-danger mb-0">{error ?? 'Тренировка не найдена'}</p>
      </div>
    );
  }

  const { workout, exercises } = details;
  const finished = Boolean(workout.finishedAt);
  const activeExercises = exercises.filter(({ exercise }) => !exercise.skipped);
  const completedSets = activeExercises.reduce(
    (sum, item) => sum + item.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = activeExercises.reduce((sum, item) => sum + item.sets.length, 0);

  return (
    <div className="workout-session">
      <header className="page-header">
        <PageBack />
        <h1 className="page-title">{workout.name}</h1>
        <p className="page-subtitle">
          {formatDateRu(workout.startedAt)} · {completedSets}/{totalSets} подходов
        </p>
        {finished && <span className="status-pill">Завершена</span>}
      </header>

      <div className="workout-accordion">
        {exercises.map(({ exercise, sets }) => (
          <ExercisePanel
            key={exercise.id}
            exerciseId={exercise.exerciseId}
            workoutExerciseId={exercise.id}
            name={exercise.exerciseNameSnapshot}
            startedAt={workout.startedAt}
            sets={sets}
            open={openId === exercise.id}
            finished={finished}
            skipped={exercise.skipped}
            replacedFromName={exercise.replacedFromName}
            notes={exercise.notes}
            onToggle={() =>
              setOpenId((current) => (current === exercise.id ? null : exercise.id))
            }
            onChanged={refresh}
          />
        ))}
      </div>

      <WorkoutNotesField
        key={workout.id}
        workoutId={workout.id}
        initialNotes={workout.notes ?? ''}
        disabled={finished}
        onSaved={refresh}
      />

      <div className="workout-footer">
        {!finished && (
          <button
            type="button"
            className="btn btn-primary btn-lg touch-btn"
            onClick={() => void handleFinish()}
          >
            Завершить тренировку
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline-danger touch-btn"
          onClick={() => void handleDelete()}
        >
          Удалить тренировку
        </button>
      </div>
    </div>
  );
}

function WorkoutNotesField({
  workoutId,
  initialNotes,
  disabled,
  onSaved,
}: {
  workoutId: string;
  initialNotes: string;
  disabled: boolean;
  onSaved: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(initialNotes);

  async function handleBlur() {
    if (notes.trim() === initialNotes.trim()) {
      return;
    }
    await workoutService.updateNotes(workoutId, notes);
    await onSaved();
  }

  return (
    <label className="workout-notes">
      <span className="section-label">Заметки</span>
      <textarea
        className="form-control"
        rows={2}
        placeholder="Как прошло, самочувствие…"
        value={notes}
        disabled={disabled}
        onChange={(event) => setNotes(event.target.value)}
        onBlur={() => void handleBlur()}
      />
    </label>
  );
}
