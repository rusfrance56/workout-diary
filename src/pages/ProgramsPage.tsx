import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon } from '../components/icons';
import { useProgramsList } from '../hooks/useProgramsEditor';

export function ProgramsPage() {
  const { programs, loading, error, create, remove } = useProgramsList();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await create({ name, description });
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось создать');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, programName: string) {
    const confirmed = window.confirm(`Удалить программу «${programName}»?`);
    if (!confirmed) {
      return;
    }
    await remove(id);
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-end gap-2">
        <div>
          <h1 className="page-title mb-1">Программы</h1>
          <p className="page-subtitle mb-0">Дни и упражнения</p>
        </div>
        <button
          type="button"
          className="btn btn-primary touch-btn"
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? 'Отмена' : 'Создать'}
        </button>
      </div>

      {showForm && (
        <form className="card border-0" onSubmit={(event) => void handleCreate(event)}>
          <div className="card-body d-flex flex-column gap-3">
            <div>
              <label className="form-label" htmlFor="program-name">
                Название
              </label>
              <input
                id="program-name"
                className="form-control"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Например, Верх / Низ"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label" htmlFor="program-desc">
                Описание
              </label>
              <input
                id="program-desc"
                className="form-control"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Необязательно"
              />
            </div>
            {formError && <div className="alert alert-danger py-2 mb-0">{formError}</div>}
            <button type="submit" className="btn btn-primary touch-btn" disabled={submitting}>
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger mb-0">{error}</div>}

      {loading ? (
        <p className="text-secondary">Загрузка…</p>
      ) : programs.length === 0 ? (
        <p className="text-secondary">Пока нет программ</p>
      ) : (
        <div className="apple-group">
          {programs.map(({ program, templates }) => (
            <div key={program.id} className="apple-row">
              <Link to={`/programs/${program.id}`} className="text-decoration-none text-dark flex-grow-1">
                <div className="apple-row-title">{program.name}</div>
                <div className="apple-row-meta">
                  {templates.length} дн.
                  {program.description ? ` · ${program.description}` : ''}
                </div>
              </Link>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label="Удалить"
                onClick={() => void handleDelete(program.id, program.name)}
              >
                <TrashIcon size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
