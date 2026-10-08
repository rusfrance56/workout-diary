import type { MuscleGroup } from '../domain';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  lats: 'Широчайшие',
  upperBack: 'Верх спины',
  lowerBack: 'Низ спины',
  frontShoulders: 'Передние дельты',
  sideShoulders: 'Средние дельты',
  rearShoulders: 'Задние дельты',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  abs: 'Пресс',
  obliques: 'Косые',
  quads: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  adductors: 'Приводящие',
  abductors: 'Отводящие',
  hipFlexors: 'Сгибатели бедра',
  neck: 'Шея',
  other: 'Другое',
};

export interface MuscleGroupSection {
  id: string;
  title: string;
  groups: MuscleGroup[];
}

/** Подгруппы как в Intrvl / Hevy: родитель → мышцы. */
export const MUSCLE_GROUP_SECTIONS: MuscleGroupSection[] = [
  {
    id: 'chest',
    title: 'Грудь',
    groups: ['chest'],
  },
  {
    id: 'back',
    title: 'Спина',
    groups: ['lats', 'upperBack', 'lowerBack'],
  },
  {
    id: 'shoulders',
    title: 'Плечи',
    groups: ['frontShoulders', 'sideShoulders', 'rearShoulders'],
  },
  {
    id: 'arms',
    title: 'Руки',
    groups: ['biceps', 'triceps', 'forearms'],
  },
  {
    id: 'core',
    title: 'Кор',
    groups: ['abs', 'obliques'],
  },
  {
    id: 'legs',
    title: 'Ноги',
    groups: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors', 'hipFlexors'],
  },
  {
    id: 'other',
    title: 'Другое',
    groups: ['neck', 'other'],
  },
];

export const MUSCLE_GROUPS: MuscleGroup[] = MUSCLE_GROUP_SECTIONS.flatMap(
  (section) => section.groups,
);
