import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSettingsContext } from '../hooks/SettingsProvider';
import { MoonIcon, SunIcon } from './icons';

export function AppLayout() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/workout/');
  const { settings, toggleTheme, setWeightUnit } = useSettingsContext();
  const isDark = settings?.theme === 'dark';
  const weightUnit = settings?.weightUnit ?? 'kg';

  return (
    <div className={`app-shell${hideNav ? ' app-shell--no-nav' : ''}`}>
      <header className="app-header">
        <div className="container-fluid px-3 d-flex align-items-center justify-content-between gap-2">
          <NavLink to="/" className="app-brand text-decoration-none">
            Дневник
          </NavLink>
          <div className="header-actions">
            <button
              type="button"
              className="unit-toggle"
              onClick={() => void setWeightUnit(weightUnit === 'kg' ? 'lb' : 'kg')}
              aria-label={weightUnit === 'kg' ? 'Переключить на lb' : 'Переключить на кг'}
              title={weightUnit === 'kg' ? 'Сейчас кг' : 'Сейчас lb'}
            >
              {weightUnit === 'kg' ? 'кг' : 'lb'}
            </button>
            <button
              type="button"
              className="icon-btn theme-toggle"
              onClick={() => void toggleTheme()}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main container-fluid px-3 py-3">
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="app-nav app-nav--3" aria-label="Основная навигация">
          <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
            <span aria-hidden>⌂</span>
            Главная
          </NavLink>
          <NavLink to="/programs" className={({ isActive }) => navClass(isActive)}>
            <span aria-hidden>▦</span>
            Программы
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => navClass(isActive)}>
            <span aria-hidden>☰</span>
            Упражнения
          </NavLink>
        </nav>
      )}
    </div>
  );
}

function navClass(isActive: boolean): string {
  return `app-nav-link${isActive ? ' is-active' : ''}`;
}
