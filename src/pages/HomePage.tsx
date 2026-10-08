import { Link } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { useHomeWorkoutSummary } from '../hooks/useWorkouts';
import { formatDateRu } from '../utils/date';

export function HomePage() {
  const { exercises, loading: exercisesLoading } = useExercises();
  const { active, recent, loading: workoutsLoading } = useHomeWorkoutSummary();

  return (
    <div className="d-flex flex-column gap-3">
      <section>
        <h1 className="page-title">Сегодня</h1>
        {workoutsLoading ? (
          <p className="page-subtitle">Загрузка…</p>
        ) : active ? (
          <p className="page-subtitle">
            Сейчас: <span className="fw-semibold text-dark">{active.name}</span>
          </p>
        ) : (
          <p className="page-subtitle">Готовы начать?</p>
        )}
      </section>

      {active ? (
        <Link to={`/workout/${active.id}`} className="btn btn-primary btn-lg touch-btn">
          Продолжить тренировку
        </Link>
      ) : (
        <Link to="/workouts/start" className="btn btn-primary btn-lg touch-btn">
          Начать тренировку
        </Link>
      )}

      <section>
        <div className="section-label">Библиотека</div>
        <div className="apple-group">
          <Link to="/programs" className="apple-row">
            <div>
              <div className="apple-row-title">Программы</div>
              <div className="apple-row-meta">Дни и упражнения</div>
            </div>
            <span className="apple-chevron" aria-hidden>
              ›
            </span>
          </Link>
          <Link to="/exercises" className="apple-row">
            <div>
              <div className="apple-row-title">Упражнения</div>
              <div className="apple-row-meta">
                {exercisesLoading ? '…' : `${exercises.length} в каталоге`}
              </div>
            </div>
            <span className="apple-chevron" aria-hidden>
              ›
            </span>
          </Link>
          <Link to="/backup" className="apple-row">
            <div>
              <div className="apple-row-title">Бэкап</div>
              <div className="apple-row-meta">JSON / CSV экспорт и импорт</div>
            </div>
            <span className="apple-chevron" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      </section>

      <section>
        <div className="section-label">Недавние</div>
        {workoutsLoading ? (
          <p className="text-secondary mb-0 px-1">Загрузка…</p>
        ) : recent.length === 0 ? (
          <p className="text-secondary mb-0 px-1">Пока нет записей</p>
        ) : (
          <div className="apple-group">
            {recent.map((workout) => (
              <Link key={workout.id} to={`/workout/${workout.id}`} className="apple-row">
                <div>
                  <div className="apple-row-title">{workout.name}</div>
                  <div className="apple-row-meta">
                    {formatDateRu(workout.startedAt)}
                    {workout.finishedAt ? '' : ' · не завершена'}
                  </div>
                </div>
                <span className="apple-chevron" aria-hidden>
                  ›
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
