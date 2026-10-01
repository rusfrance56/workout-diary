import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-fluid px-3">
          <NavLink to="/" className="app-brand text-decoration-none">
            Дневник тренировок
          </NavLink>
        </div>
      </header>

      <main className="app-main container-fluid px-3 py-3">
        <Outlet />
      </main>

      <nav className="app-nav" aria-label="Основная навигация">
        <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
          Главная
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => navClass(isActive)}>
          Упражнения
        </NavLink>
      </nav>
    </div>
  );
}

function navClass(isActive: boolean): string {
  return `app-nav-link${isActive ? ' is-active' : ''}`;
}
