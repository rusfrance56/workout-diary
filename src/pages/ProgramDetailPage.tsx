import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '../components/icons';
import { PageBack } from '../components/PageBack';
import { usePointerReorder } from '../hooks/usePointerReorder';
import { useProgramDetails } from '../hooks/useProgramsEditor';

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const { details, loading, error, rename, addDay, removeDay, reorderDays } =
    useProgramDetails(programId);
  const [dayName, setDayName] = useState('');
  const [showDayForm, setShowDayForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const baselineIds = useMemo(
    () => details?.templates.map(({ template }) => template.id) ?? [],
    [details?.templates],
  );

  const onReorder = useCallback(
    (orderedIds: string[]) => {
      void reorderDays(orderedIds);
    },
    [reorderDays],
  );

  const { dragId, orderedIds, handleProps, itemAttr } = usePointerReorder(baselineIds, onReorder);

  const orderedTemplates = useMemo(() => {
    if (!details) {
      return [];
    }
    const byId = new Map(details.templates.map((item) => [item.template.id, item]));
    return orderedIds.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
  }, [details, orderedIds]);

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
    return (
      <div className="d-flex flex-column gap-3">
        <PageBack fallback="/programs" />
        <p className="text-secondary">Загрузка…</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="d-flex flex-column gap-3">
        <PageBack fallback="/programs" />
        <p className="text-danger mb-0">{error ?? 'Программа не найдена'}</p>
      </div>
    );
  }

  const { program } = details;

  return (
    <div className="d-flex flex-column gap-3">
      <header className="page-header">
        <PageBack fallback="/programs" />
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

      {orderedTemplates.length === 0 ? (
        <p className="text-secondary">Добавьте первый день</p>
      ) : (
        <div className="apple-group">
          {orderedTemplates.map(({ template, exercises }) => (
            <div
              key={template.id}
              className={`apple-row apple-row--exercise${dragId === template.id ? ' is-dragging' : ''}`}
              {...itemAttr(template.id)}
            >
              <div
                className="drag-handle"
                title="Перетащите для порядка"
                aria-label="Перетащить"
                role="button"
                tabIndex={0}
                onPointerDown={(event) => handleProps.onPointerDown(template.id, event)}
                onPointerMove={handleProps.onPointerMove}
                onPointerUp={handleProps.end}
                onPointerCancel={handleProps.end}
              >
                ⋮⋮
              </div>
              <Link
                to={`/programs/${program.id}/days/${template.id}`}
                className="exercise-row-main text-decoration-none text-dark"
              >
                <div className="flex-grow-1 min-w-0 text-start">
                  <div className="apple-row-title">{template.name}</div>
                  <div className="apple-row-meta">{exercises.length} упр.</div>
                </div>
              </Link>
              <div className="btn-group exercise-row-actions" role="group" aria-label="Действия">
                <button
                  type="button"
                  className="btn btn-danger exercise-action-btn"
                  aria-label="Удалить"
                  title="Удалить"
                  onClick={() => {
                    if (window.confirm(`Удалить «${template.name}»?`)) {
                      void removeDay(template.id);
                    }
                  }}
                >
                  <TrashIcon size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
