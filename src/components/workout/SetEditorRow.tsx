import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { WeightUnit, WorkoutSet } from '../../domain';
import { displayToKg, kgToDisplay, roundWeight } from '../../utils/weight';

interface SetEditorRowProps {
  set: WorkoutSet;
  disabled: boolean;
  busy: boolean;
  weightUnit: WeightUnit;
  onComplete: (set: WorkoutSet, weightKg: number, reps: number) => Promise<void>;
  onDraft: (set: WorkoutSet, weightKg: number, reps: number) => Promise<void>;
  onUncomplete: (setId: string) => Promise<void>;
}

export function SetEditorRow({
  set,
  disabled,
  busy,
  weightUnit,
  onComplete,
  onDraft,
  onUncomplete,
}: SetEditorRowProps) {
  const weightStep = weightUnit === 'lb' ? 5 : 2.5;
  const unitLabel = weightUnit === 'lb' ? 'lb' : 'кг';
  const [weight, setWeight] = useState(String(kgToDisplay(set.weightKg, weightUnit) || ''));
  const [reps, setReps] = useState(String(set.reps || ''));

  useEffect(() => {
    setWeight(String(kgToDisplay(set.weightKg, weightUnit) || ''));
    setReps(String(set.reps || ''));
  }, [set.id, set.weightKg, set.reps, set.completed, weightUnit]);

  const locked = disabled || set.completed;

  function parseValues(): { weightKg: number; repsValue: number } | null {
    const display = Number(weight.replace(',', '.'));
    const repsValue = Number(reps);
    if (!Number.isFinite(display) || !Number.isFinite(repsValue)) {
      return null;
    }
    return { weightKg: displayToKg(display, weightUnit), repsValue };
  }

  function nudgeWeight(delta: number) {
    const current = Number(weight.replace(',', '.'));
    const base = Number.isFinite(current) ? current : 0;
    const nextDisplay = roundWeight(Math.max(0, base + delta), weightUnit === 'lb' ? 0.5 : 0.25);
    setWeight(String(nextDisplay));
    void onDraft(
      set,
      displayToKg(nextDisplay, weightUnit),
      Math.max(0, Math.round(Number(reps) || 0)),
    );
  }

  function nudgeReps(delta: number) {
    const current = Number(reps);
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, Math.round(base + delta));
    setReps(String(next));
    const display = Number(weight.replace(',', '.'));
    void onDraft(
      set,
      displayToKg(Number.isFinite(display) ? display : 0, weightUnit),
      next,
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const values = parseValues();
    if (!values || values.repsValue <= 0) {
      return;
    }
    void onComplete(set, values.weightKg, values.repsValue);
  }

  function saveDraft() {
    const values = parseValues();
    if (!values) {
      return;
    }
    void onDraft(set, values.weightKg, values.repsValue);
  }

  return (
    <form className={`set-editor${set.completed ? ' is-done' : ''}`} onSubmit={submit}>
      <div className="set-editor-num">{set.setNumber}</div>

      <div className="set-stepper">
        <div className="input-with-suffix">
          <input
            type="number"
            inputMode="decimal"
            step={weightUnit === 'lb' ? '0.5' : '0.25'}
            min="0"
            className="form-control"
            aria-label={`Вес, ${unitLabel}`}
            value={weight}
            disabled={locked}
            onChange={(event) => setWeight(event.target.value)}
            onBlur={saveDraft}
          />
          <span className="input-suffix" aria-hidden>
            {unitLabel}
          </span>
        </div>
        <div className="set-stepper-btns">
          <button
            type="button"
            className="set-stepper-btn"
            disabled={locked || busy}
            onClick={() => nudgeWeight(weightStep)}
            aria-label="Увеличить вес"
          >
            +
          </button>
          <button
            type="button"
            className="set-stepper-btn"
            disabled={locked || busy}
            onClick={() => nudgeWeight(-weightStep)}
            aria-label="Уменьшить вес"
          >
            −
          </button>
        </div>
      </div>

      <div className="set-stepper">
        <div className="input-with-suffix">
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            className="form-control"
            aria-label="Повторы"
            value={reps}
            disabled={locked}
            onChange={(event) => setReps(event.target.value)}
            onBlur={saveDraft}
          />
          <span className="input-suffix input-suffix--reps" aria-hidden>
            п
          </span>
        </div>
        <div className="set-stepper-btns">
          <button
            type="button"
            className="set-stepper-btn"
            disabled={locked || busy}
            onClick={() => nudgeReps(1)}
            aria-label="Увеличить повторы"
          >
            +
          </button>
          <button
            type="button"
            className="set-stepper-btn"
            disabled={locked || busy}
            onClick={() => nudgeReps(-1)}
            aria-label="Уменьшить повторы"
          >
            −
          </button>
        </div>
      </div>

      {set.completed ? (
        <button
          type="button"
          className="btn set-editor-action is-done"
          disabled={disabled || busy}
          onClick={() => void onUncomplete(set.id)}
        >
          ✓
        </button>
      ) : (
        <button
          type="submit"
          className="btn btn-primary set-editor-action"
          disabled={disabled || busy}
          aria-label="Готово"
        >
          {busy ? '…' : 'OK'}
        </button>
      )}
    </form>
  );
}
