import { Navigate, useParams } from 'react-router-dom';

/** Старый маршрут упражнения → единый экран тренировки с аккордеоном. */
export function WorkoutExercisePage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  if (!workoutId) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={`/workout/${workoutId}`} replace />;
}
