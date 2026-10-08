import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HistoryIcon, PencilIcon, TrashIcon } from '../components/icons';
import type { CreateExerciseInput, Exercise, MuscleGroup } from '../domain';
import { formatMuscleGroups } from '../domain';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_SECTIONS } from '../domain/labels';
import { useExercises } from '../hooks/useExercises';
import { fileToCompressedDataUrl } from '../utils/image';

const EMPTY_FORM: CreateExerciseInput = {
  name: '',
  primaryMuscleGroups: ['chest'],
  secondaryMuscleGroups: [],
  notes: '',
  defaultIncrementKg: 2.5,
};

export function ExercisesPage() {
  const { exercises, loading, error, create, update, remove } = useExercises();
  const [form, setForm] = useState<CreateExerciseInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');

    return exercises.filter((exercise) => {
      const haystack = [
        exercise.name,
        ...exercise.primaryMuscleGroups.map((group) => MUSCLE_GROUP_LABELS[group]),
        ...exercise.secondaryMuscleGroups.map((group) => MUSCLE_GROUP_LABELS[group]),
      ]
        .join(' ')
        .toLocaleLowerCase('ru');

      return !(normalizedQuery && !haystack.includes(normalizedQuery));
    });
  }, [exercises, query]);

  const grouped = useMemo(() => {
    if (sectionFilter === 'all') {
      const buckets = new Map<string, Exercise[]>();
      for (const section of MUSCLE_GROUP_SECTIONS) {
        buckets.set(section.id, []);
      }

      for (const exercise of filtered) {
        const section =
          MUSCLE_GROUP_SECTIONS.find((item) =>
            exercise.primaryMuscleGroups.some((group) => item.groups.includes(group)),
          ) ?? MUSCLE_GROUP_SECTIONS[MUSCLE_GROUP_SECTIONS.length - 1];
        buckets.get(section!.id)?.push(exercise);
      }

      return MUSCLE_GROUP_SECTIONS.map((section) => ({
        id: section.id,
        title: section.title,
        items: buckets.get(section.id) ?? [],
      })).filter((group) => group.items.length > 0);
    }

    const section = MUSCLE_GROUP_SECTIONS.find((item) => item.id === sectionFilter);
    const sectionGroups = new Set(section?.groups ?? []);
    const primaryHits: Exercise[] = [];
    const secondaryHits: Exercise[] = [];

    for (const exercise of filtered) {
      const primaryMatch = exercise.primaryMuscleGroups.some((group) => sectionGroups.has(group));
      const secondaryMatch = exercise.secondaryMuscleGroups.some((group) =>
        sectionGroups.has(group),
      );

      if (primaryMatch) {
        primaryHits.push(exercise);
      } else if (secondaryMatch) {
        secondaryHits.push(exercise);
      }
    }

    return [
      { id: 'primary', title: 'Основные', items: primaryHits },
      { id: 'secondary', title: 'Вторичные', items: secondaryHits },
    ].filter((group) => group.items.length > 0);
  }, [filtered, sectionFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(exercise: Exercise) {
    setEditingId(exercise.id);
    setForm({
      name: exercise.name,
      primaryMuscleGroups: exercise.primaryMuscleGroups,
      secondaryMuscleGroups: exercise.secondaryMuscleGroups,
      notes: exercise.notes ?? '',
      imageDataUrl: exercise.imageDataUrl,
      defaultIncrementKg: exercise.defaultIncrementKg,
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await update(editingId, form);
      } else {
        await create(form);
      }
      closeForm();
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
    if (editingId === exercise.id) {
      closeForm();
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const imageDataUrl = await fileToCompressedDataUrl(file);
      setForm((current) => ({ ...current, imageDataUrl }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось загрузить фото');
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-end gap-2">
        <h1 className="page-title mb-0">Упражнения</h1>
        <button
          type="button"
          className="btn btn-primary touch-btn"
          onClick={() => (showForm ? closeForm() : openCreate())}
        >
          {showForm ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {!showForm && (
        <>
          <input
            type="search"
            className="form-control"
            placeholder="Поиск по названию или мышцам"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="filter-chip-row">
            <button
              type="button"
              className={`chip${sectionFilter === 'all' ? ' is-primary' : ''}`}
              onClick={() => setSectionFilter('all')}
            >
              Все
            </button>
            {MUSCLE_GROUP_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`chip${sectionFilter === section.id ? ' is-primary' : ''}`}
                onClick={() => setSectionFilter(section.id)}
              >
                {section.title}
              </button>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <form className="card border-0 shadow-sm" onSubmit={(event) => void handleSubmit(event)}>
          <div className="card-body d-flex flex-column gap-3">
            <div className="form-label mb-0">{editingId ? 'Редактирование' : 'Новое упражнение'}</div>
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

            <MuscleTabsPicker
              primary={form.primaryMuscleGroups}
              secondary={form.secondaryMuscleGroups}
              onChange={(primaryMuscleGroups, secondaryMuscleGroups) =>
                setForm({ ...form, primaryMuscleGroups, secondaryMuscleGroups })
              }
            />

            <div>
              <label className="form-label" htmlFor="exercise-image">
                Картинка (опционально)
              </label>
              {form.imageDataUrl ? (
                <div className="exercise-image-preview">
                  <img src={form.imageDataUrl} alt="Превью упражнения" />
                  <button
                    type="button"
                    className="btn-apple-danger"
                    onClick={() => setForm({ ...form, imageDataUrl: undefined })}
                  >
                    Убрать фото
                  </button>
                </div>
              ) : (
                <input
                  id="exercise-image"
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(event) => void handleImageChange(event)}
                />
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="exercise-notes">
                Техника и повторы
              </label>
              <textarea
                id="exercise-notes"
                className="form-control"
                rows={4}
                placeholder="Краткие подсказки по форме и диапазону повторов…"
                value={form.notes ?? ''}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>

            {formError && <div className="alert alert-danger mb-0 py-2">{formError}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg touch-btn"
              disabled={submitting || form.primaryMuscleGroups.length === 0}
            >
              {submitting ? 'Сохранение…' : editingId ? 'Сохранить изменения' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="text-secondary">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <p className="text-secondary">Ничего не найдено</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {grouped.map(({ id, title, items }) => (
            <section key={id}>
              <div className="section-label">{title}</div>
              <div className="apple-group">
                {items.map((exercise) => (
                  <div key={exercise.id} className="apple-row align-items-center">
                    {exercise.imageDataUrl && (
                      <img src={exercise.imageDataUrl} alt="" className="exercise-list-thumb" />
                    )}
                    <div className="flex-grow-1">
                      <div className="apple-row-title">{exercise.name}</div>
                      <div className="apple-row-meta">
                        <span className="muscle-primary">
                          {formatMuscleGroups(exercise.primaryMuscleGroups, MUSCLE_GROUP_LABELS)}
                        </span>
                        {exercise.secondaryMuscleGroups.length > 0 && (
                          <>
                            {' · '}
                            <span className="muscle-secondary">
                              {formatMuscleGroups(
                                exercise.secondaryMuscleGroups,
                                MUSCLE_GROUP_LABELS,
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="compact-row-actions">
                      <Link
                        to={`/exercises/${exercise.id}/history`}
                        className="icon-btn"
                        aria-label="История"
                        title="История"
                      >
                        <HistoryIcon size={17} />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Изменить"
                        onClick={() => openEdit(exercise)}
                      >
                        <PencilIcon size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        aria-label="Удалить"
                        onClick={() => void handleDelete(exercise)}
                      >
                        <TrashIcon size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MuscleTabsPicker({
  primary,
  secondary,
  onChange,
}: {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  onChange: (primary: MuscleGroup[], secondary: MuscleGroup[]) => void;
}) {
  const [tab, setTab] = useState<'primary' | 'secondary'>('primary');
  const selected = tab === 'primary' ? primary : secondary;
  const locked = tab === 'primary' ? secondary : primary;

  function toggle(group: MuscleGroup) {
    if (locked.includes(group)) {
      return;
    }

    if (tab === 'primary') {
      const nextPrimary = primary.includes(group)
        ? primary.filter((item) => item !== group)
        : [...primary, group];
      onChange(nextPrimary, secondary);
      return;
    }

    const nextSecondary = secondary.includes(group)
      ? secondary.filter((item) => item !== group)
      : [...secondary, group];
    onChange(primary, nextSecondary);
  }

  return (
    <div className="muscle-picker">
      <div className="form-label">Мышцы</div>
      <div className="segmented" role="tablist" aria-label="Тип мышц">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'primary'}
          className={`segmented-btn${tab === 'primary' ? ' is-active' : ''}`}
          onClick={() => setTab('primary')}
        >
          Основные
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'secondary'}
          className={`segmented-btn${tab === 'secondary' ? ' is-active' : ''}`}
          onClick={() => setTab('secondary')}
        >
          Вторичные
        </button>
      </div>
      <div className="muscle-sections">
        {MUSCLE_GROUP_SECTIONS.map((section) => (
          <div key={section.id} className="muscle-section">
            <div className="muscle-section-title">{section.title}</div>
            <div className="chip-row">
              {section.groups.map((group) => {
                const isSelected = selected.includes(group);
                const isLocked = locked.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    className={`chip${isSelected ? ' is-primary' : ''}${isLocked ? ' is-locked' : ''}`}
                    disabled={isLocked}
                    title={isLocked ? 'Уже выбрано на другой вкладке' : undefined}
                    onClick={() => toggle(group)}
                  >
                    {MUSCLE_GROUP_LABELS[group]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
