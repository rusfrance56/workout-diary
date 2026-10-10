import { useLocation, useNavigate } from 'react-router-dom';

interface PageBackProps {
  fallback?: string;
}

export function PageBack({ fallback = '/' }: PageBackProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    void navigate(fallback);
  }

  return (
    <button type="button" className="page-back" onClick={goBack}>
      ← Назад
    </button>
  );
}
