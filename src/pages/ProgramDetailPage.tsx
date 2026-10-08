import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
} from '../components/icons';
import { useProgramDetails } from '../hooks/useProgramsEditor';

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const { details, loading, error, rename, addDay, removeDay, moveDay } =
    useProgramDetails(programId);
  const [dayName, setDayName] = useState('');
  const [showDayForm, setShowDayForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  async function handleAddDay(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    try {
      await addDay({ name: dayName });
      setDayName('');
      setShowDayForm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось добавить день');
    }
  }

  async function handleRename() {
    setActionError(null);
    try {
      await rename(nameDraft);
      setEditingName(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось переименовать');
    }
  }

  if (loading) {
    return <p className="text-secondary">Загрузка…</p>;
  }

  if (error || !details) {
    return (
      <div className="d-flex flex-column gap-3">
        <p className="text-danger mb-0">{error ?? 'Программа не найдена'}</p>
        <Link to="/programs" className="btn btn-outline-secondary touch-btn">
          К программам
        </Link>
      </div>
    );
  }

  const { program, templates } = details;

  return (
    <div className="d-flex flex-column gap-3">
      <header className="page-header">
        <Link to="/programs" className="page-back">
          ← Программы
        </Link>
        {editingName ? (
          <form
            className="day-name-edit"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRename();
            }}
          >
            <input
              className="form-control day-name-input"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              autoFocus
            />
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary touch-btn-sm flex-grow-1">
                Сохранить
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary touch-btn-sm"
                onClick={() => setEditingName(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div className="day-name-view">
            <h1 className="page-title mb-0">{program.name}</h1>
            <button
              type="button"
              className="icon-btn"
              aria-label="Изменить название"
              onClick={() => {
                setNameDraft(program.name);
                setEditingName(true);
              }}
            >
              <PencilIcon />
            </button>
          </div>
        )}
        {program.description && <p className="page-subtitle mt-1 mb-0">{program.description}</p>}
      </header>

      <div className="d-flex justify-content-between align-items-center">
        <div className="section-label mb-0">Дни</div>
        <button
          type="button"
          className="btn btn-primary touch-btn-sm"
          onClick={() => setShowDayForm((value) => !value)}
        >
          {showDayForm ? 'Отмена' : 'Добавить день'}
        </button>
      </div>

      {showDayForm && (
        <form className="card border-0" onSubmit={(event) => void handleAddDay(event)}>
          <div className="card-body d-flex flex-column gap-2">
            <input
              className="form-control"
              value={dayName}
              onChange={(event) => setDayName(event.target.value)}
              placeholder="День A — жим"
              required
              autoFocus
            />
            <button type="submit" className="btn btn-primary touch-btn">
              Сохранить день
            </button>
          </div>
        </form>
      )}

      {actionError && <div className="alert alert-danger py-2 mb-0">{actionError}</div>}

      {templates.length === 0 ? (
        <p className="text-secondary">Добавьте первый день</p>
      ) : (
        <div className="apple-group">
          {templates.map(({ template, exercises }, index) => (
            <div key={template.id} className="apple-row align-items-start">
              <Link
                to={`/programs/${program.id}/days/${template.id}`}
                className="text-decoration-none text-dark flex-grow-1"
              >
                <div className="apple-row-title">{template.name}</div>
                <div className="apple-row-meta">{exercises.length} упр.</div>
              </Link>
              <div className="compact-row-actions">
                <button
                  type="button"
                  className="icon-btn"
                  disabled={index === 0}
                  onClick={() => void moveDay(template.id, -1)}
                  aria-label="Выше"
                >
                  <ChevronUpIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={index === templates.length - 1}
                  onClick={() => void moveDay(template.id, 1)}
                  aria-label="Ниже"
                >
                  <ChevronDownIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label="Удалить"
                  onClick={() => {
                    if (window.confirm(`Удалить «${template.name}»?`)) {
                      void removeDay(template.id);
                    }
                  }}
                >
                  <TrashIcon size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
