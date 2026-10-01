import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateExerciseInput, Equipment, Exercise, MuscleGroup } from '../domain';
import { EQUIPMENT_LABELS, EQUIPMENTS, MUSCLE_GROUP_LABELS, MUSCLE_GROUPS } from '../domain/labels';
import { useExercises } from '../hooks/useExercises';

const EMPTY_FORM: CreateExerciseInput = {
  name: '',
  muscleGroup: 'chest',
  equipment: 'barbell',
  notes: '',
  defaultIncrementKg: 2.5,
};

export function ExercisesPage() {
  const { exercises, loading, error, create, remove } = useExercises();
  const [form, setForm] = useState<CreateExerciseInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await create(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(exercise: Exercise) {
    const confirmed = window.confirm(`Удалить «${exercise.name}»?`);
    if (!confirmed) {
      return;
    }
    await remove(exercise.id);
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center gap-2">
        <h1 className="h3 mb-0">Упражнения</h1>
        <button
          type="button"
          className="btn btn-primary touch-btn"
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {showForm && (
        <form className="card border-0 shadow-sm" onSubmit={handleSubmit}>
          <div className="card-body d-flex flex-column gap-3">
            <div>
              <label className="form-label" htmlFor="exercise-name">
                Название
              </label>
              <input
                id="exercise-name"
                className="form-control form-control-lg"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Например, Жим лёжа"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="form-label" htmlFor="exercise-muscle">
                Группа мышц
              </label>
              <select
                id="exercise-muscle"
                className="form-select form-select-lg"
                value={form.muscleGroup}
                onChange={(event) =>
                  setForm({ ...form, muscleGroup: event.target.value as MuscleGroup })
                }
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {MUSCLE_GROUP_LABELS[group]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="exercise-equipment">
                Оборудование
              </label>
              <select
                id="exercise-equipment"
                className="form-select form-select-lg"
                value={form.equipment}
                onChange={(event) =>
                  setForm({ ...form, equipment: event.target.value as Equipment })
                }
              >
                {EQUIPMENTS.map((item) => (
                  <option key={item} value={item}>
                    {EQUIPMENT_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="exercise-increment">
                Шаг прогрессии, кг
              </label>
              <input
                id="exercise-increment"
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0.25"
                className="form-control form-control-lg"
                value={form.defaultIncrementKg}
                onChange={(event) =>
                  setForm({ ...form, defaultIncrementKg: Number(event.target.value) })
                }
              />
            </div>

            <div>
              <label className="form-label" htmlFor="exercise-notes">
                Заметки
              </label>
              <textarea
                id="exercise-notes"
                className="form-control"
                rows={2}
                value={form.notes ?? ''}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>

            {formError && <div className="alert alert-danger mb-0 py-2">{formError}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg touch-btn"
              disabled={submitting}
            >
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="text-secondary">Загрузка…</p>
      ) : exercises.length === 0 ? (
        <p className="text-secondary">Упражнений пока нет</p>
      ) : (
        <ul className="list-group list-group-flush exercise-list">
          {exercises.map((exercise) => (
            <li key={exercise.id} className="list-group-item px-0">
              <div className="d-flex justify-content-between gap-2 align-items-start">
                <div>
                  <div className="fw-semibold">{exercise.name}</div>
                  <div className="text-secondary small">
                    {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} ·{' '}
                    {EQUIPMENT_LABELS[exercise.equipment]} · +{exercise.defaultIncrementKg} кг
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm touch-btn-sm"
                  onClick={() => void handleDelete(exercise)}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
