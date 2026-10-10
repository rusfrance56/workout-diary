import { TrashIcon } from '../icons';
import type { PlannedSet, WeightUnit } from '../../domain';
import { normalizePlannedSets } from '../../domain';
import { displayToKg, kgToDisplay } from '../../utils/weight';

interface PlannedSetsEditorProps {
  sets: PlannedSet[];
  onChange: (sets: PlannedSet[]) => void;
  weightUnit: WeightUnit;
}

export function PlannedSetsEditor({ sets, onChange, weightUnit }: PlannedSetsEditorProps) {
  const unitLabel = weightUnit === 'lb' ? 'lb' : 'кг';

  function updateSet(index: number, patch: Partial<PlannedSet>) {
    const next = sets.map((set, setIndex) =>
      setIndex === index ? { ...set, ...patch } : set,
    );
    onChange(normalizePlannedSets(next));
  }

  function removeSet(index: number) {
    if (sets.length <= 1) {
      return;
    }
    onChange(normalizePlannedSets(sets.filter((_, setIndex) => setIndex !== index)));
  }

  function addSet() {
    const last = sets[sets.length - 1];
    onChange(
      normalizePlannedSets([
        ...sets,
        { weightKg: last?.weightKg ?? 0, reps: last?.reps ?? 8 },
      ]),
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      <div className="form-label mb-0">Подходы</div>
      {sets.map((set, index) => (
        <div key={set.setNumber} className="planned-set-row">
          <div className="planned-set-num">{set.setNumber}</div>
          <div className="input-with-suffix">
            <input
              type="number"
              inputMode="decimal"
              step={weightUnit === 'lb' ? '0.5' : '0.25'}
              min="0"
              className="form-control"
              aria-label={`Вес, ${unitLabel}`}
              value={kgToDisplay(set.weightKg, weightUnit) || ''}
              onChange={(event) =>
                updateSet(index, {
                  weightKg: displayToKg(
                    Number(event.target.value.replace(',', '.')) || 0,
                    weightUnit,
                  ),
                })
              }
            />
            <span className="input-suffix" aria-hidden>
              {unitLabel}
            </span>
          </div>
          <div className="input-with-suffix">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              className="form-control"
              aria-label="Повторы"
              value={set.reps || ''}
              onChange={(event) => updateSet(index, { reps: Number(event.target.value) || 1 })}
            />
            <span className="input-suffix" aria-hidden>
              п
            </span>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            disabled={sets.length <= 1}
            aria-label="Убрать подход"
            title="Убрать"
            onClick={() => removeSet(index)}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-add-set" onClick={addSet}>
        + Подход
      </button>
    </div>
  );
}
