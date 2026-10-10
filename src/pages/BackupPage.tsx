import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { PageBack } from '../components/PageBack';
import { backupService, downloadTextFile } from '../services/backupService';

export function BackupPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function exportJson() {
    setBusy(true);
    setError(null);
    try {
      const content = await backupService.exportJson();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`workout-diary-${stamp}.json`, content, 'application/json');
      setMessage('JSON экспортирован');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setBusy(true);
    setError(null);
    try {
      const content = await backupService.exportCsv();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`workout-diary-${stamp}.csv`, content, 'text/csv');
      setMessage('CSV экспортирован');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      'Импорт заменит все локальные данные. Сделать это только после экспорта бэкапа. Продолжить?',
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const raw = await file.text();
      await backupService.importJson(raw);
      setMessage('Импорт завершён. Обновите страницу.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      <header className="page-header">
        <PageBack />
        <h1 className="page-title">Бэкап</h1>
        <p className="page-subtitle">Резервная копия и выгрузка для таблиц</p>
      </header>

      <section>
        <div className="section-label">Резервная копия</div>
        <p className="page-subtitle px-1 mb-2">
          Сохраняет всё: упражнения, программы, дни, тренировки и настройки.
        </p>
        <div className="apple-group">
          <button
            type="button"
            className="apple-row apple-row-button"
            disabled={busy}
            onClick={() => void exportJson()}
          >
            <div>
              <div className="apple-row-title">Экспорт JSON</div>
              <div className="apple-row-meta">Сохранить всё для переноса или восстановления</div>
            </div>
          </button>
          <button
            type="button"
            className="apple-row apple-row-button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <div>
              <div className="apple-row-title">Импорт JSON</div>
              <div className="apple-row-meta">Заменит все локальные данные текущим файлом</div>
            </div>
          </button>
        </div>
      </section>

      <section>
        <div className="section-label">Для Excel / Sheets</div>
        <p className="page-subtitle px-1 mb-2">
          Таблица с подходами для Excel или Google Sheets.
        </p>
        <div className="apple-group">
          <button
            type="button"
            className="apple-row apple-row-button"
            disabled={busy}
            onClick={() => void exportCsv()}
          >
            <div>
              <div className="apple-row-title">Экспорт CSV</div>
              <div className="apple-row-meta">Только подходы: вес, повторы, даты</div>
            </div>
          </button>
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="d-none"
        onChange={(event) => void handleImport(event)}
      />

      {message && <div className="alert alert-success mb-0">{message}</div>}
      {error && <div className="alert alert-danger mb-0">{error}</div>}
    </div>
  );
}
