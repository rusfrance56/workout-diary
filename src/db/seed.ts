import type { CreateExerciseInput, Exercise, WorkoutTemplateExercise } from '../domain';
import { normalizeExercise, normalizePlannedSets } from '../domain';
import { createId, nowIso } from '../utils/id';
import type { WorkoutDiaryDB } from './database';
import { db } from './database';

/** Демо-кадры из free-exercise-db (Unlicense), лежат в public/exercises. */
const SEED_IMAGES: Record<string, string> = {
  'Жим лёжа': '/exercises/bench-press.jpg',
  'Жим гантелей лёжа': '/exercises/dumbbell-bench.jpg',
  'Отжимания': '/exercises/push-up.jpg',
  'Разведения гантелей лёжа': '/exercises/dumbbell-fly.jpg',
  'Подтягивания': '/exercises/pull-up.jpg',
  'Тяга верхнего блока': '/exercises/lat-pulldown.jpg',
  'Тяга штанги в наклоне': '/exercises/barbell-row.jpg',
  'Тяга гантели в наклоне': '/exercises/dumbbell-row.jpg',
  'Шраги': '/exercises/shrug.jpg',
  'Гиперэкстензия': '/exercises/hyperextension.jpg',
  'Жим стоя': '/exercises/ohp.jpg',
  'Махи гантелями в стороны': '/exercises/lateral-raise.jpg',
  'Разведения в наклоне': '/exercises/reverse-fly.jpg',
  'Сгибания на бицепс': '/exercises/bicep-curl.jpg',
  'Молотковые сгибания': '/exercises/hammer-curl.jpg',
  'Разгибания на трицепс': '/exercises/tricep-ext.jpg',
  'Отжимания на брусьях': '/exercises/dips.jpg',
  'Скручивания': '/exercises/crunch.jpg',
  'Планка': '/exercises/plank.jpg',
  'Приседания': '/exercises/squat.jpg',
  'Становая тяга': '/exercises/deadlift.jpg',
  'Жим ногами': '/exercises/leg-press.jpg',
  'Выпады': '/exercises/lunge.jpg',
  'Сгибания ног': '/exercises/leg-curl.jpg',
  'Разгибания ног': '/exercises/leg-extension.jpg',
  'Ягодичный мост': '/exercises/hip-thrust.jpg',
  'Подъёмы на носки': '/exercises/calf-raise.jpg',
  'Сведения ног': '/exercises/adductor.jpg',
  'Разведения ног': '/exercises/abductor.jpg',
};

function resolveSeedImage(name: string, current?: string): string | undefined {
  const fromSeed = SEED_IMAGES[name];
  if (!fromSeed) {
    return current;
  }
  if (!current || current.startsWith('/exercises/')) {
    return fromSeed;
  }
  return current;
}

const SEED_EXERCISES: CreateExerciseInput[] = [
  {
    name: 'Жим лёжа',
    primaryMuscleGroups: ['chest'],
    secondaryMuscleGroups: ['frontShoulders', 'triceps'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: лопатки сведены и вниз, стопы в пол, гриф к нижней части груди, лёгкая дуга вверх к плечам.\nПовторы: сила 3–5, масса 6–12. 3–5 подходов.',
  },
  {
    name: 'Жим гантелей лёжа',
    primaryMuscleGroups: ['chest'],
    secondaryMuscleGroups: ['frontShoulders', 'triceps'],
    defaultIncrementKg: 2,
    notes:
      'Техника: глубже растяжение, чем со штангой; не стучите гантели вверху, контролируйте низ.\nПовторы: 8–12 (масса), 6–8 тяжелее. 3–4 подхода.',
  },
  {
    name: 'Отжимания',
    primaryMuscleGroups: ['chest'],
    secondaryMuscleGroups: ['triceps', 'frontShoulders', 'abs'],
    defaultIncrementKg: 1.25,
    notes:
      'Техника: корпус в линию, локти ~45°, грудь почти к полу. Усложнение — возвышение ног / вес на спине.\nПовторы: 8–20 до сильного напряжения. 3–4 подхода.',
  },
  {
    name: 'Разведения гантелей лёжа',
    primaryMuscleGroups: ['chest'],
    secondaryMuscleGroups: ['frontShoulders'],
    defaultIncrementKg: 1,
    notes:
      'Техника: мягкий локоть, широкая дуга, растяжение внизу без «лома» плеча; не выпрямляйте руки полностью.\nПовторы: 10–15, вес умеренный. 3 подхода.',
  },
  {
    name: 'Подтягивания',
    primaryMuscleGroups: ['lats'],
    secondaryMuscleGroups: ['biceps', 'upperBack'],
    defaultIncrementKg: 1.25,
    notes:
      'Техника: старт с «мертвого виса», тяните локти вниз-назад, подбородок выше перекладины, без раскачки.\nПовторы: 5–10 (сила/масса), с резинкой или негативами если мало повторов. 3–5 подходов.',
  },
  {
    name: 'Тяга верхнего блока',
    primaryMuscleGroups: ['lats'],
    secondaryMuscleGroups: ['biceps', 'upperBack'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: хват ~1.5 ширины плеч, лёгкий наклон назад, тяните к верху груди локтями вниз-назад (не за голову).\nПовторы: сила 4–6, масса 8–12. 3–4 подхода.',
  },
  {
    name: 'Тяга штанги в наклоне',
    primaryMuscleGroups: ['lats', 'upperBack'],
    secondaryMuscleGroups: ['biceps', 'rearShoulders'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: наклон ~30–45°, нейтральная спина, тяга к низу груди/животу локтями, контроль опускания.\nПовторы: 5–8 сила, 8–12 масса. 3–5 подходов.',
  },
  {
    name: 'Тяга гантели в наклоне',
    primaryMuscleGroups: ['lats', 'upperBack'],
    secondaryMuscleGroups: ['biceps', 'rearShoulders'],
    defaultIncrementKg: 2,
    notes:
      'Техника: опора на скамью, спина ровная, локоть вдоль корпуса, вверху сжатие лопатки, без вращения корпуса.\nПовторы: 8–12. 3–4 подхода на сторону.',
  },
  {
    name: 'Шраги',
    primaryMuscleGroups: ['upperBack'],
    secondaryMuscleGroups: ['forearms'],
    defaultIncrementKg: 5,
    notes:
      'Техника: плечи вверх к ушам (или слегка назад), без кругов, пауза вверху, медленно вниз.\nПовторы: 8–15. 3–4 подхода.',
  },
  {
    name: 'Гиперэкстензия',
    primaryMuscleGroups: ['lowerBack', 'glutes'],
    secondaryMuscleGroups: ['hamstrings'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: сгибание в тазобедренных, не «переломы» в пояснице; вверху корпус в линию, без гиперэкстензии.\nПовторы: 10–15, вес только при чистой технике. 3 подхода.',
  },
  {
    name: 'Жим стоя',
    primaryMuscleGroups: ['frontShoulders', 'sideShoulders'],
    secondaryMuscleGroups: ['triceps'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: ягодицы и пресс напряжены, без сильного прогиба; жмите вверх мимо лица, голова «в окно» после грифа.\nПовторы: сила 3–6, масса 6–10. 3–5 подходов.',
  },
  {
    name: 'Махи гантелями в стороны',
    primaryMuscleGroups: ['sideShoulders'],
    secondaryMuscleGroups: ['frontShoulders', 'rearShoulders'],
    defaultIncrementKg: 1,
    notes:
      'Техника: лёгкий сгиб локтя, ведите локтями, до уровня плеч, без шрагов и раскачки корпуса.\nПовторы: 10–15 (часто 12–20 лёгким весом). 3–4 подхода.',
  },
  {
    name: 'Разведения в наклоне',
    primaryMuscleGroups: ['rearShoulders'],
    secondaryMuscleGroups: ['upperBack'],
    defaultIncrementKg: 1,
    notes:
      'Техника: наклон, тяните локти в стороны/назад, без рывка; мягкие локти, контроль.\nПовторы: 12–20. 3 подхода.',
  },
  {
    name: 'Сгибания на бицепс',
    primaryMuscleGroups: ['biceps'],
    secondaryMuscleGroups: ['forearms'],
    defaultIncrementKg: 1,
    notes:
      'Техника: локти у корпуса, без раскачки, полная амплитуда; можно супинация вверху.\nПовторы: 8–12. 3–4 подхода.',
  },
  {
    name: 'Молотковые сгибания',
    primaryMuscleGroups: ['biceps', 'forearms'],
    secondaryMuscleGroups: [],
    defaultIncrementKg: 1,
    notes:
      'Техника: нейтральный хват (молот), локти стабильны, акцент на брахиалис/предплечье.\nПовторы: 8–12. 3 подхода.',
  },
  {
    name: 'Разгибания на трицепс',
    primaryMuscleGroups: ['triceps'],
    secondaryMuscleGroups: [],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: локти фиксированы у корпуса (блок/гантель), разгибание до полного выпрямления без разведения локтей.\nПовторы: 10–15. 3–4 подхода.',
  },
  {
    name: 'Отжимания на брусьях',
    primaryMuscleGroups: ['triceps', 'chest'],
    secondaryMuscleGroups: ['frontShoulders'],
    defaultIncrementKg: 1.25,
    notes:
      'Техника: корпус чуть вперёд — больше грудь; вертикально — больше трицепс. Не уходите слишком глубоко при дискомфорте в плечах.\nПовторы: 6–12. 3–4 подхода.',
  },
  {
    name: 'Скручивания',
    primaryMuscleGroups: ['abs'],
    secondaryMuscleGroups: ['obliques'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: скручивайте грудную клетку к тазу, поясница может оставаться на полу; без рывка головой.\nПовторы: 12–20. 3 подхода.',
  },
  {
    name: 'Планка',
    primaryMuscleGroups: ['abs'],
    secondaryMuscleGroups: ['obliques', 'frontShoulders'],
    defaultIncrementKg: 1,
    notes:
      'Техника: тело в линию, таз не провисает и не задирается, дышите ровно.\nОбъём: 20–60+ сек × 2–4 подхода (вместо повторов).',
  },
  {
    name: 'Приседания',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'abs'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: упор корпуса, сгибание в тазе и коленях вместе, грудь вверх, до параллели или ниже при комфорте коленей; через середину стопы.\nПовторы: сила 3–5, масса 6–12. 3–5 подходов.',
  },
  {
    name: 'Становая тяга',
    primaryMuscleGroups: ['hamstrings', 'glutes', 'lowerBack'],
    secondaryMuscleGroups: ['lats', 'upperBack', 'forearms', 'abs'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: гриф над серединой стопы, спина нейтральна, снимите «слабину», бёдра и плечи поднимаются вместе, гриф близко к ногам.\nПовторы: сила 1–5, объём 5–8; не до отказа часто. 1–3 тяжёлых подхода.',
  },
  {
    name: 'Жим ногами',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings'],
    defaultIncrementKg: 5,
    notes:
      'Техника: поясница прижата к сиденью, не отрывайте таз; контролируемая глубина без округления низа спины.\nПовторы: 8–15. 3–4 подхода.',
  },
  {
    name: 'Выпады',
    primaryMuscleGroups: ['quads', 'glutes'],
    secondaryMuscleGroups: ['hamstrings'],
    defaultIncrementKg: 2,
    notes:
      'Техника: шаг, колено над стопой (не сильно внутрь), корпус почти вертикален, заднее колено к полу.\nПовторы: 8–12 на ногу. 3 подхода.',
  },
  {
    name: 'Сгибания ног',
    primaryMuscleGroups: ['hamstrings'],
    secondaryMuscleGroups: ['calves'],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: таз стабилен, пятки к ягодицам, без отрыва бёдер; медленный негатив.\nПовторы: 10–15. 3–4 подхода.',
  },
  {
    name: 'Разгибания ног',
    primaryMuscleGroups: ['quads'],
    secondaryMuscleGroups: [],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: полный разгиб без удара замком; контроль вниз. При дискомфорте в коленях — укоротите амплитуду.\nПовторы: 10–15. 3 подхода.',
  },
  {
    name: 'Ягодичный мост',
    primaryMuscleGroups: ['glutes'],
    secondaryMuscleGroups: ['hamstrings'],
    defaultIncrementKg: 5,
    notes:
      'Техника: верх спины на скамье, рёбра вниз (не переразгибайте поясницу), разгиб бёдер до полного сжатия ягодиц.\nПовторы: 8–12. 3–4 подхода.',
  },
  {
    name: 'Подъёмы на носки',
    primaryMuscleGroups: ['calves'],
    secondaryMuscleGroups: [],
    defaultIncrementKg: 5,
    notes:
      'Техника: полная амплитуда — растяжение внизу и подъём на носок; короткая пауза вверху.\nПовторы: стоя 8–15, сидя часто 12–20+. 3–5 подходов.',
  },
  {
    name: 'Сведения ног',
    primaryMuscleGroups: ['adductors'],
    secondaryMuscleGroups: [],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: медленное сведение, контроль разведения; без рывков тазом.\nПовторы: 12–20. 3 подхода.',
  },
  {
    name: 'Разведения ног',
    primaryMuscleGroups: ['abductors', 'glutes'],
    secondaryMuscleGroups: [],
    defaultIncrementKg: 2.5,
    notes:
      'Техника: разведение наружу с контролем, лёгкий наклон корпуса вперёд усиливает ягодицы; без раскачки.\nПовторы: 12–20. 3 подхода.',
  },
];

type TemplateSeed = {
  name: string;
  order: number;
  exercises: Array<{
    exerciseName: string;
    order: number;
    targetSets: number;
    minReps: number;
    maxReps: number;
  }>;
};

const PROGRAM_TEMPLATES: TemplateSeed[] = [
  {
    name: 'День A — жим',
    order: 1,
    exercises: [
      { exerciseName: 'Жим лёжа', order: 1, targetSets: 3, minReps: 8, maxReps: 12 },
      { exerciseName: 'Жим стоя', order: 2, targetSets: 3, minReps: 8, maxReps: 12 },
      { exerciseName: 'Разгибания на трицепс', order: 3, targetSets: 3, minReps: 10, maxReps: 15 },
      { exerciseName: 'Сгибания на бицепс', order: 4, targetSets: 3, minReps: 10, maxReps: 15 },
    ],
  },
  {
    name: 'День B — тяга',
    order: 2,
    exercises: [
      { exerciseName: 'Становая тяга', order: 1, targetSets: 3, minReps: 5, maxReps: 8 },
      { exerciseName: 'Тяга штанги в наклоне', order: 2, targetSets: 3, minReps: 8, maxReps: 12 },
      { exerciseName: 'Тяга верхнего блока', order: 3, targetSets: 3, minReps: 8, maxReps: 12 },
      { exerciseName: 'Тяга гантели в наклоне', order: 4, targetSets: 3, minReps: 8, maxReps: 12 },
    ],
  },
  {
    name: 'День C — ноги',
    order: 3,
    exercises: [
      { exerciseName: 'Приседания', order: 1, targetSets: 3, minReps: 6, maxReps: 10 },
      { exerciseName: 'Жим ногами', order: 2, targetSets: 3, minReps: 8, maxReps: 12 },
      { exerciseName: 'Сгибания ног', order: 3, targetSets: 3, minReps: 10, maxReps: 15 },
      { exerciseName: 'Разгибания ног', order: 4, targetSets: 3, minReps: 10, maxReps: 15 },
    ],
  },
];

type DemoSet = { weightKg: number; reps: number };
type DemoSession = {
  templateName: string;
  daysAgo: number;
  results: Record<string, DemoSet[]>;
};

/** Две недели: прогрессия жима 60→62.5 (последний A на 12/12/12). */
const DEMO_SESSIONS: DemoSession[] = [
  {
    templateName: 'День A — жим',
    daysAgo: 13,
    results: {
      'Жим лёжа': [
        { weightKg: 60, reps: 10 },
        { weightKg: 60, reps: 9 },
        { weightKg: 60, reps: 8 },
      ],
      'Жим стоя': [
        { weightKg: 40, reps: 10 },
        { weightKg: 40, reps: 9 },
        { weightKg: 40, reps: 8 },
      ],
      'Разгибания на трицепс': [
        { weightKg: 25, reps: 12 },
        { weightKg: 25, reps: 12 },
        { weightKg: 25, reps: 11 },
      ],
      'Сгибания на бицепс': [
        { weightKg: 12, reps: 12 },
        { weightKg: 12, reps: 11 },
        { weightKg: 12, reps: 10 },
      ],
    },
  },
  {
    templateName: 'День B — тяга',
    daysAgo: 11,
    results: {
      'Становая тяга': [
        { weightKg: 100, reps: 6 },
        { weightKg: 100, reps: 6 },
        { weightKg: 100, reps: 5 },
      ],
      'Тяга штанги в наклоне': [
        { weightKg: 55, reps: 10 },
        { weightKg: 55, reps: 9 },
        { weightKg: 55, reps: 8 },
      ],
      'Тяга верхнего блока': [
        { weightKg: 50, reps: 11 },
        { weightKg: 50, reps: 10 },
        { weightKg: 50, reps: 10 },
      ],
      'Тяга гантели в наклоне': [
        { weightKg: 24, reps: 10 },
        { weightKg: 24, reps: 10 },
        { weightKg: 24, reps: 9 },
      ],
    },
  },
  {
    templateName: 'День C — ноги',
    daysAgo: 9,
    results: {
      'Приседания': [
        { weightKg: 70, reps: 8 },
        { weightKg: 70, reps: 7 },
        { weightKg: 70, reps: 6 },
      ],
      'Жим ногами': [
        { weightKg: 120, reps: 12 },
        { weightKg: 120, reps: 11 },
        { weightKg: 120, reps: 10 },
      ],
      'Сгибания ног': [
        { weightKg: 35, reps: 12 },
        { weightKg: 35, reps: 12 },
        { weightKg: 35, reps: 11 },
      ],
      'Разгибания ног': [
        { weightKg: 40, reps: 12 },
        { weightKg: 40, reps: 11 },
        { weightKg: 40, reps: 10 },
      ],
    },
  },
  {
    templateName: 'День A — жим',
    daysAgo: 6,
    results: {
      'Жим лёжа': [
        { weightKg: 60, reps: 12 },
        { weightKg: 60, reps: 11 },
        { weightKg: 60, reps: 10 },
      ],
      'Жим стоя': [
        { weightKg: 40, reps: 11 },
        { weightKg: 40, reps: 10 },
        { weightKg: 40, reps: 9 },
      ],
      'Разгибания на трицепс': [
        { weightKg: 25, reps: 15 },
        { weightKg: 25, reps: 14 },
        { weightKg: 25, reps: 13 },
      ],
      'Сгибания на бицепс': [
        { weightKg: 12, reps: 14 },
        { weightKg: 12, reps: 13 },
        { weightKg: 12, reps: 12 },
      ],
    },
  },
  {
    templateName: 'День B — тяга',
    daysAgo: 4,
    results: {
      'Становая тяга': [
        { weightKg: 100, reps: 8 },
        { weightKg: 100, reps: 7 },
        { weightKg: 100, reps: 6 },
      ],
      'Тяга штанги в наклоне': [
        { weightKg: 55, reps: 12 },
        { weightKg: 55, reps: 11 },
        { weightKg: 55, reps: 10 },
      ],
      'Тяга верхнего блока': [
        { weightKg: 50, reps: 12 },
        { weightKg: 50, reps: 12 },
        { weightKg: 50, reps: 11 },
      ],
      'Тяга гантели в наклоне': [
        { weightKg: 24, reps: 12 },
        { weightKg: 24, reps: 11 },
        { weightKg: 24, reps: 10 },
      ],
    },
  },
  {
    templateName: 'День C — ноги',
    daysAgo: 2,
    results: {
      'Приседания': [
        { weightKg: 70, reps: 10 },
        { weightKg: 70, reps: 9 },
        { weightKg: 70, reps: 8 },
      ],
      'Жим ногами': [
        { weightKg: 120, reps: 12 },
        { weightKg: 120, reps: 12 },
        { weightKg: 120, reps: 12 },
      ],
      'Сгибания ног': [
        { weightKg: 35, reps: 15 },
        { weightKg: 35, reps: 14 },
        { weightKg: 35, reps: 13 },
      ],
      'Разгибания ног': [
        { weightKg: 40, reps: 15 },
        { weightKg: 40, reps: 14 },
        { weightKg: 40, reps: 12 },
      ],
    },
  },
  {
    templateName: 'День A — жим',
    daysAgo: 1,
    results: {
      'Жим лёжа': [
        { weightKg: 60, reps: 12 },
        { weightKg: 60, reps: 12 },
        { weightKg: 60, reps: 12 },
      ],
      'Жим стоя': [
        { weightKg: 40, reps: 12 },
        { weightKg: 40, reps: 12 },
        { weightKg: 40, reps: 11 },
      ],
      'Разгибания на трицепс': [
        { weightKg: 25, reps: 15 },
        { weightKg: 25, reps: 15 },
        { weightKg: 25, reps: 15 },
      ],
      'Сгибания на бицепс': [
        { weightKg: 12, reps: 15 },
        { weightKg: 12, reps: 15 },
        { weightKg: 12, reps: 14 },
      ],
    },
  },
];

type SeededTemplate = {
  templateId: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
};

export async function seedDatabase(database: WorkoutDiaryDB): Promise<void> {
  const timestamp = nowIso();

  const exercises = SEED_EXERCISES.map((exercise) => ({
    ...exercise,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  await database.exercises.bulkAdd(exercises);
  const templates = await seedProgram(database, exercises, timestamp);
  await seedDemoHistory(database, exercises, templates);

  await database.settings.add({
    id: 'default',
    weightUnit: 'kg',
    theme: 'light',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

/** Миграция каталога + досев программ/истории. */
export async function ensureProgramSeed(): Promise<void> {
  await ensureExercisesFormat();

  const exercises = await db.exercises.toArray();
  if (exercises.length === 0) {
    return;
  }

  let templates: SeededTemplate[] = [];

  const programsCount = await db.programs.count();
  if (programsCount === 0) {
    templates = await seedProgram(db, exercises, nowIso());
  } else {
    templates = await loadSeededTemplates(db);
  }

  const workoutsCount = await db.workouts.count();
  if (workoutsCount === 0 && templates.length > 0) {
    await seedDemoHistory(db, exercises, templates);
  }
}

/** Переписывает упражнения в новый формат и досеивает недостающие из каталога. */
export async function ensureExercisesFormat(): Promise<void> {
  const existing = await db.exercises.toArray();
  const byName = new Map(existing.map((item) => [item.name, item]));
  const timestamp = nowIso();
  const seedByName = new Map(SEED_EXERCISES.map((item) => [item.name, item]));

  for (const exercise of existing) {
    const seed = seedByName.get(exercise.name);
    const normalized = normalizeExercise({
      ...exercise,
      primaryMuscleGroups:
        seed?.primaryMuscleGroups ?? exercise.primaryMuscleGroups ?? [],
      secondaryMuscleGroups:
        seed?.secondaryMuscleGroups ?? exercise.secondaryMuscleGroups ?? [],
      defaultIncrementKg:
        seed?.defaultIncrementKg ?? exercise.defaultIncrementKg ?? 2.5,
      notes: seed?.notes ?? exercise.notes,
      imageDataUrl: resolveSeedImage(exercise.name, exercise.imageDataUrl),
      muscleGroup: undefined,
      equipment: undefined,
    });

    await db.exercises.put({
      ...normalized,
      updatedAt: timestamp,
    });
  }

  for (const seed of SEED_EXERCISES) {
    if (byName.has(seed.name)) {
      continue;
    }
    await db.exercises.add(
      normalizeExercise({
        ...seed,
        imageDataUrl: resolveSeedImage(seed.name, seed.imageDataUrl),
        id: createId(),
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }
}

async function seedProgram(
  database: WorkoutDiaryDB,
  exercises: Exercise[],
  timestamp: string,
): Promise<SeededTemplate[]> {
  const byName = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  const seeded: SeededTemplate[] = [];

  const programId = createId();
  await database.programs.add({
    id: programId,
    name: 'Базовая программа',
    description: 'Три дня: жим / тяга / ноги',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  for (const templateSeed of PROGRAM_TEMPLATES) {
    const templateId = createId();
    await database.templates.add({
      id: templateId,
      programId,
      name: templateSeed.name,
      order: templateSeed.order,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const templateExercises: WorkoutTemplateExercise[] = [];

    for (const item of templateSeed.exercises) {
      const exercise = byName.get(item.exerciseName);
      if (!exercise) {
        continue;
      }

      const plannedSets = normalizePlannedSets(
        Array.from({ length: item.targetSets }, () => ({
          weightKg: 0,
          reps: item.minReps,
        })),
      );

      const templateExercise: WorkoutTemplateExercise = {
        id: createId(),
        templateId,
        exerciseId: exercise.id,
        order: item.order,
        targetSets: item.targetSets,
        minReps: item.minReps,
        maxReps: item.maxReps,
        plannedSets,
        progressionRule: {
          type: 'double_progression',
          incrementKg: exercise.defaultIncrementKg,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await database.templateExercises.add(templateExercise);
      templateExercises.push(templateExercise);
    }

    seeded.push({ templateId, name: templateSeed.name, exercises: templateExercises });
  }

  return seeded;
}

async function loadSeededTemplates(database: WorkoutDiaryDB): Promise<SeededTemplate[]> {
  const templates = await database.templates.orderBy('order').toArray();
  const result: SeededTemplate[] = [];

  for (const template of templates) {
    const exercises = await database.templateExercises
      .where('templateId')
      .equals(template.id)
      .sortBy('order');
    result.push({ templateId: template.id, name: template.name, exercises });
  }

  return result;
}

async function seedDemoHistory(
  database: WorkoutDiaryDB,
  exercises: Exercise[],
  templates: SeededTemplate[],
): Promise<void> {
  const byExerciseId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const byTemplateName = new Map(templates.map((item) => [item.name, item]));

  for (const session of DEMO_SESSIONS) {
    const template = byTemplateName.get(session.templateName);
    if (!template) {
      continue;
    }

    const startedAt = daysAgoIso(session.daysAgo, 18, 30);
    const finishedAt = daysAgoIso(session.daysAgo, 19, 45);
    const workoutId = createId();

    await database.workouts.add({
      id: workoutId,
      templateId: template.templateId,
      name: template.name,
      startedAt,
      finishedAt,
      createdAt: startedAt,
      updatedAt: finishedAt,
    });

    for (const templateExercise of template.exercises) {
      const exercise = byExerciseId.get(templateExercise.exerciseId);
      if (!exercise) {
        continue;
      }

      const demoSets = session.results[exercise.name];
      if (!demoSets || demoSets.length === 0) {
        continue;
      }

      const workoutExerciseId = createId();
      await database.workoutExercises.add({
        id: workoutExerciseId,
        workoutId,
        exerciseId: exercise.id,
        order: templateExercise.order,
        exerciseNameSnapshot: exercise.name,
        createdAt: startedAt,
        updatedAt: finishedAt,
      });

      for (let index = 0; index < demoSets.length; index += 1) {
        const demoSet = demoSets[index]!;
        const setAt = daysAgoIso(session.daysAgo, 18, 35 + index * 4);
        await database.workoutSets.add({
          id: createId(),
          workoutExerciseId,
          setNumber: index + 1,
          weightKg: demoSet.weightKg,
          reps: demoSet.reps,
          completed: true,
          createdAt: setAt,
          updatedAt: setAt,
        });
      }
    }
  }
}

function daysAgoIso(daysAgo: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}
