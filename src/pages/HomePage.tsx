import { Link } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';

export function HomePage() {
  const { exercises, loading } = useExercises();

  return (
    <div className="d-flex flex-column gap-3">
      <section>
        <h1 className="h3 mb-1">Сегодня</h1>
        <p className="text-secondary mb-0">Тренировка ещё не начата</p>
      </section>

      <button type="button" className="btn btn-primary btn-lg touch-btn" disabled>
        Начать тренировку
      </button>
      <p className="text-secondary small mb-0">Старт тренировок появится на следующем этапе</p>

      <section className="mt-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 mb-0">Упражнения</h2>
          <Link to="/exercises" className="btn btn-outline-secondary btn-sm">
            Все
          </Link>
        </div>
        {loading ? (
          <p className="text-secondary mb-0">Загрузка…</p>
        ) : (
          <p className="mb-0">
            В базе: <strong>{exercises.length}</strong>
          </p>
        )}
      </section>

      <section>
        <h2 className="h5">Последние тренировки</h2>
        <p className="text-secondary mb-0">Пока нет записей</p>
      </section>
    </div>
  );
}
