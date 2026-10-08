import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SparklineChart } from '../components/SparklineChart';
import type { ExerciseStats, HistorySession, WeightUnit } from '../domain';
import { useSettingsContext } from '../hooks/SettingsProvider';
import { exerciseService } from '../services/exerciseService';
import { workoutService } from '../services/workoutService';
import { formatDateRu } from '../utils/date';
import { formatWeight, kgToDisplay } from '../utils/weight';

function formatDelta(value: number, unit: string): string {
  if (value === 0) {
    return `= прошлый`;
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value} ${unit}`;
}

function unitLabel(unit: WeightUnit): string {
  return unit === 'lb' ? 'lb' : 'кг';
}

export function ExerciseHistoryPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const { settings } = useSettingsContext();
  const weightUnit = settings?.weightUnit ?? 'kg';
  const [name, setName] = useState('');
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) {
      setLoading(false);
      setError('Упражнение не найдено');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [exercise, history] = await Promise.all([
          exerciseService.getById(exerciseId),
          workoutService.getExerciseHistory(exerciseId),
        ]);
        if (cancelled) {
          return;
        }
        if (!exercise) {
          setError('Упражнение не найдено');
          return;
        }
        setName(exercise.name);
        setSessions(history.sessions);
        setStats(history.stats);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  if (loading) {
    return <p className="text-secondary">Загрузка…</p>;
  }

  if (error) {
    return (
      <div className="d-flex flex-column gap-3">
        <p className="text-danger mb-0">{error}</p>
        <Link to="/exercises" className="btn btn-outline-secondary touch-btn">
          К упражнениям
        </Link>
      </div>
    );
  }

  const chronological = [...sessions].reverse();
  const weightSeries = chronological.map((item) => kgToDisplay(item.maxWeightKg, weightUnit));
  const volumeSeries = chronological.map((item) => kgToDisplay(item.volumeKg, weightUnit));
  const e1rmSeries = chronological.map((item) => kgToDisplay(item.bestE1rmKg, weightUnit));
  const dateLabels = chronological.map((item) => formatDateRu(item.startedAt));
  const label = unitLabel(weightUnit);

  return (
    <div className="d-flex flex-column gap-3">
      <header className="page-header">
        <Link to="/exercises" className="page-back">
          ← Упражнения
        </Link>
        <h1 className="page-title">{name}</h1>
        <p className="page-subtitle">История и статистика</p>
      </header>

      {stats && (
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Сессий</div>
            <div className="stat-value">{stats.sessionsCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Объём</div>
            <div className="stat-value">
              {Math.round(kgToDisplay(stats.totalVolumeKg, weightUnit))} {label}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Max вес</div>
            <div className="stat-value">{formatWeight(stats.maxWeightKg, weightUnit)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Лучший e1RM</div>
            <div className="stat-value">{formatWeight(stats.bestE1rmKg, weightUnit)}</div>
          </div>
        </section>
      )}

      {chronological.length > 1 && (
        <section className="charts-stack">
          <div className="chart-block">
            <div className="section-label">Рабочий вес</div>
            <SparklineChart values={weightSeries} labels={dateLabels} />
          </div>
          <div className="chart-block">
            <div className="section-label">Объём сессии</div>
            <SparklineChart values={volumeSeries} labels={dateLabels} />
          </div>
          <div className="chart-block">
            <div className="section-label">e1RM</div>
            <SparklineChart values={e1rmSeries} labels={dateLabels} />
          </div>
        </section>
      )}

      <section>
        <div className="section-label">Сессии</div>
        {sessions.length === 0 ? (
          <p className="text-secondary mb-0 px-1">Пока нет завершённых подходов</p>
        ) : (
          <div className="apple-group">
            {sessions.map((session, index) => {
              const comparison = workoutService.compareWithPrevious(sessions, index);
              return (
                <div key={`${session.workoutId}-${session.startedAt}`} className="history-row">
                  <div className="history-row-head">
                    <div>
                      <div className="apple-row-title">{formatDateRu(session.startedAt)}</div>
                      <div className="apple-row-meta">{session.workoutName}</div>
                    </div>
                    <div className="history-row-stats">
                      <span>{formatWeight(session.maxWeightKg, weightUnit)}</span>
                      <span>e1RM {formatWeight(session.bestE1rmKg, weightUnit)}</span>
                    </div>
                  </div>
                  <div className="previous-strip">
                    {session.sets.map((set) => (
                      <span key={set.setNumber} className="previous-chip">
                        {formatWeight(set.weightKg, weightUnit)} × {set.reps}
                      </span>
                    ))}
                  </div>
                  {comparison && (
                    <div className="history-compare">
                      vs прошлый: объём{' '}
                      {formatDelta(kgToDisplay(comparison.volumeDeltaKg, weightUnit), label)} · max{' '}
                      {formatDelta(kgToDisplay(comparison.maxWeightDeltaKg, weightUnit), label)} ·
                      e1RM{' '}
                      {formatDelta(kgToDisplay(comparison.e1rmDeltaKg, weightUnit), label)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
