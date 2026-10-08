import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrograms } from '../hooks/useWorkouts';
import { workoutService } from '../services/workoutService';

export function StartWorkoutPage() {
  const navigate = useNavigate();
  const { programs, loading, error } = usePrograms();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleStart(templateId: string) {
    setActionError(null);
    setStartingId(templateId);
    try {
      const workout = await workoutService.startFromTemplate(templateId);
      navigate(`/workout/${workout.id}`, { replace: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось начать');
      setStartingId(null);
    }
  }

  if (loading) {
    return <p className="text-secondary">Загрузка программ…</p>;
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <h1 className="page-title">Начать</h1>
        <p className="page-subtitle">Выберите день программы</p>
      </div>

      {(error || actionError) && (
        <div className="alert alert-danger mb-0">{error ?? actionError}</div>
      )}

      {programs.length === 0 ? (
        <p className="text-secondary">Нет программ. Перезапустите приложение после обновления.</p>
      ) : (
        programs.map(({ program, templates }) => (
          <section key={program.id}>
            <div className="section-label">{program.name}</div>
            {program.description && (
              <p className="page-subtitle px-1 mb-2">{program.description}</p>
            )}
            <div className="apple-group">
              {templates.map(({ template, exercises }) => (
                <button
                  key={template.id}
                  type="button"
                  className="template-card apple-row"
                  disabled={startingId !== null}
                  onClick={() => void handleStart(template.id)}
                >
                  <div>
                    <div className="apple-row-title">{template.name}</div>
                    <div className="apple-row-meta">
                      {exercises.length} упражнений
                      {startingId === template.id ? ' · запуск…' : ''}
                    </div>
                  </div>
                  <span className="apple-chevron" aria-hidden>
                    ›
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
