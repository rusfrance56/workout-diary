import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../domain';

interface ExerciseAutocompleteProps {
  exercises: Exercise[];
  valueId: string;
  onChange: (exercise: Exercise | null) => void;
  placeholder?: string;
}

export function ExerciseAutocomplete({
  exercises,
  valueId,
  onChange,
  placeholder = 'Начните вводить название',
}: ExerciseAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = exercises.find((item) => item.id === valueId) ?? null;
  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selected?.name ?? '');
  }, [selected?.id, selected?.name]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ru');
    if (!normalized) {
      return exercises.slice(0, 8);
    }
    return exercises
      .filter((item) => item.name.toLocaleLowerCase('ru').includes(normalized))
      .slice(0, 8);
  }, [exercises, query]);

  function pick(exercise: Exercise) {
    setQuery(exercise.name);
    onChange(exercise);
    setOpen(false);
  }

  function handleBlur() {
    const exact = exercises.find(
      (item) => item.name.toLocaleLowerCase('ru') === query.trim().toLocaleLowerCase('ru'),
    );
    if (exact) {
      onChange(exact);
      setQuery(exact.name);
      return;
    }
    if (selected) {
      setQuery(selected.name);
    } else {
      setQuery('');
      onChange(null);
    }
  }

  return (
    <div className="autocomplete" ref={rootRef}>
      <input
        type="text"
        className="form-control"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (valueId) {
            onChange(null);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
      />
      {open && suggestions.length > 0 && (
        <ul id={listId} className="autocomplete-list" role="listbox">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`autocomplete-option${item.id === valueId ? ' is-active' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(item)}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="autocomplete-empty">Ничего не найдено</div>
      )}
    </div>
  );
}
