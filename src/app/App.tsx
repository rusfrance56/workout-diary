import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { SettingsProvider } from '../hooks/SettingsProvider';
import { ActiveWorkoutPage } from '../pages/ActiveWorkoutPage';
import { BackupPage } from '../pages/BackupPage';
import { ExerciseHistoryPage } from '../pages/ExerciseHistoryPage';
import { ExercisesPage } from '../pages/ExercisesPage';
import { HomePage } from '../pages/HomePage';
import { ProgramDetailPage } from '../pages/ProgramDetailPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import { StartWorkoutPage } from '../pages/StartWorkoutPage';
import { TemplateDetailPage } from '../pages/TemplateDetailPage';
import { WorkoutExercisePage } from '../pages/WorkoutExercisePage';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export function App() {
  return (
    <SettingsProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="exercises/:exerciseId/history" element={<ExerciseHistoryPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:programId" element={<ProgramDetailPage />} />
            <Route path="programs/:programId/days/:templateId" element={<TemplateDetailPage />} />
            <Route path="workouts/start" element={<StartWorkoutPage />} />
            <Route path="workout/:workoutId" element={<ActiveWorkoutPage />} />
            <Route
              path="workout/:workoutId/exercise/:workoutExerciseId"
              element={<WorkoutExercisePage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
