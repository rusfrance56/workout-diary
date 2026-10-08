import type {
  Exercise,
  PlannedSet,
  WorkoutProgram,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '../domain';
import {
  deriveTargetsFromPlannedSets,
  ensurePlannedSets,
  normalizePlannedSets,
} from '../domain';
import { createId, nowIso } from '../utils/id';
import { exerciseRepository } from '../db/repositories/dexieExerciseRepository';
import {
  programRepository,
  type ProgramWithTemplates,
} from '../db/repositories/programRepository';

export interface CreateProgramInput {
  name: string;
  description?: string;
}

export interface CreateDayInput {
  name: string;
}

export interface AddDayExerciseInput {
  exerciseId: string;
  plannedSets: Array<{ weightKg: number; reps: number }>;
}

export interface UpdateDayExerciseInput {
  plannedSets: Array<{ weightKg: number; reps: number }>;
  /** Смена упражнения; подходы не сбрасываются */
  exerciseId?: string;
}

export class ProgramService {
  getAll(): Promise<ProgramWithTemplates[]> {
    return programRepository.getAllWithTemplates();
  }

  getById(id: string): Promise<ProgramWithTemplates | undefined> {
    return programRepository.getWithTemplates(id);
  }

  async getTemplateDetails(templateId: string): Promise<{
    template: WorkoutTemplate;
    program: WorkoutProgram;
    exercises: Array<WorkoutTemplateExercise & { exerciseName: string }>;
  } | null> {
    const template = await programRepository.getTemplateById(templateId);
    if (!template) {
      return null;
    }

    const program = await programRepository.getById(template.programId);
    if (!program) {
      return null;
    }

    const items = await programRepository.getTemplateExercises(templateId);
    const withNames = [];

    for (const item of items) {
      const exercise = await exerciseRepository.getById(item.exerciseId);
      const plannedSets = ensurePlannedSets(item);
      withNames.push({
        ...item,
        ...deriveTargetsFromPlannedSets(plannedSets),
        plannedSets,
        exerciseName: exercise?.name ?? 'Упражнение удалено',
      });
    }

    return { template, program, exercises: withNames };
  }

  async createProgram(input: CreateProgramInput): Promise<WorkoutProgram> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Укажите название программы');
    }

    const timestamp = nowIso();
    const program: WorkoutProgram = {
      id: createId(),
      name,
      description: input.description?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await programRepository.createProgram(program);
    return program;
  }

  async renameProgram(id: string, name: string): Promise<WorkoutProgram> {
    const current = await programRepository.getById(id);
    if (!current) {
      throw new Error('Программа не найдена');
    }

    const nextName = name.trim();
    if (!nextName) {
      throw new Error('Укажите название программы');
    }

    const updated: WorkoutProgram = {
      ...current,
      name: nextName,
      updatedAt: nowIso(),
    };
    await programRepository.updateProgram(updated);
    return updated;
  }

  async deleteProgram(id: string): Promise<void> {
    await programRepository.deleteProgram(id);
  }

  async addDay(programId: string, input: CreateDayInput): Promise<WorkoutTemplate> {
    const program = await programRepository.getById(programId);
    if (!program) {
      throw new Error('Программа не найдена');
    }

    const name = input.name.trim();
    if (!name) {
      throw new Error('Укажите название дня');
    }

    const existing = await programRepository.getWithTemplates(programId);
    const order = (existing?.templates.length ?? 0) + 1;
    const timestamp = nowIso();

    const template: WorkoutTemplate = {
      id: createId(),
      programId,
      name,
      order,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await programRepository.createTemplate(template);
    await programRepository.updateProgram({ ...program, updatedAt: timestamp });
    return template;
  }

  async renameDay(templateId: string, name: string): Promise<WorkoutTemplate> {
    const template = await programRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('День не найден');
    }

    const nextName = name.trim();
    if (!nextName) {
      throw new Error('Укажите название дня');
    }

    const updated: WorkoutTemplate = {
      ...template,
      name: nextName,
      updatedAt: nowIso(),
    };
    await programRepository.updateTemplate(updated);
    return updated;
  }

  async deleteDay(templateId: string): Promise<void> {
    const template = await programRepository.getTemplateById(templateId);
    if (!template) {
      return;
    }

    await programRepository.deleteTemplate(templateId);
    await this.reindexDays(template.programId);
  }

  async moveDay(templateId: string, direction: -1 | 1): Promise<void> {
    const template = await programRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('День не найден');
    }

    const details = await programRepository.getWithTemplates(template.programId);
    if (!details) {
      return;
    }

    const list = details.templates.map((item) => item.template);
    const index = list.findIndex((item) => item.id === templateId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= list.length) {
      return;
    }

    const a = list[index]!;
    const b = list[swapIndex]!;
    const timestamp = nowIso();
    const updated = list.map((item) => {
      if (item.id === a.id) {
        return { ...item, order: b.order, updatedAt: timestamp };
      }
      if (item.id === b.id) {
        return { ...item, order: a.order, updatedAt: timestamp };
      }
      return item;
    });

    await programRepository.replaceTemplateOrders(updated);
  }

  async addExercise(
    templateId: string,
    input: AddDayExerciseInput,
  ): Promise<WorkoutTemplateExercise> {
    const template = await programRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('День не найден');
    }

    const exercise = await exerciseRepository.getById(input.exerciseId);
    if (!exercise) {
      throw new Error('Упражнение не найдено');
    }

    const plannedSets = normalizePlannedSets(input.plannedSets);
    const targets = deriveTargetsFromPlannedSets(plannedSets);
    const existing = await programRepository.getTemplateExercises(templateId);
    if (existing.some((item) => item.exerciseId === input.exerciseId)) {
      throw new Error('Это упражнение уже есть в дне');
    }

    const timestamp = nowIso();
    const item: WorkoutTemplateExercise = {
      id: createId(),
      templateId,
      exerciseId: exercise.id,
      order: existing.length + 1,
      ...targets,
      plannedSets,
      progressionRule: {
        type: 'double_progression',
        incrementKg: resolveIncrement(undefined, exercise),
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await programRepository.createTemplateExercise(item);
    return item;
  }

  async updateExercise(
    templateExerciseId: string,
    input: UpdateDayExerciseInput,
  ): Promise<WorkoutTemplateExercise> {
    const details = await programRepository.getTemplateExerciseById(templateExerciseId);
    if (!details) {
      throw new Error('Упражнение дня не найдено');
    }

    let nextExerciseId = details.exerciseId;
    if (input.exerciseId && input.exerciseId !== details.exerciseId) {
      const siblings = await programRepository.getTemplateExercises(details.templateId);
      if (siblings.some((item) => item.exerciseId === input.exerciseId && item.id !== details.id)) {
        throw new Error('Это упражнение уже есть в дне');
      }
      const nextExercise = await exerciseRepository.getById(input.exerciseId);
      if (!nextExercise) {
        throw new Error('Упражнение не найдено');
      }
      nextExerciseId = nextExercise.id;
    }

    const exercise = await exerciseRepository.getById(nextExerciseId);
    const plannedSets = normalizePlannedSets(input.plannedSets);
    const targets = deriveTargetsFromPlannedSets(plannedSets);
    const updated: WorkoutTemplateExercise = {
      ...details,
      exerciseId: nextExerciseId,
      ...targets,
      plannedSets,
      progressionRule: {
        type: 'double_progression',
        incrementKg: resolveIncrement(
          details.progressionRule?.incrementKg,
          exercise ?? ({ defaultIncrementKg: 2.5 } as Exercise),
        ),
      },
      updatedAt: nowIso(),
    };

    await programRepository.updateTemplateExercise(updated);
    return updated;
  }

  async removeExercise(templateExerciseId: string): Promise<void> {
    const details = await programRepository.getTemplateExerciseById(templateExerciseId);
    if (!details) {
      return;
    }

    await programRepository.deleteTemplateExercise(templateExerciseId);
    await this.reindexExercises(details.templateId);
  }

  async moveExercise(templateExerciseId: string, direction: -1 | 1): Promise<void> {
    const details = await programRepository.getTemplateExerciseById(templateExerciseId);
    if (!details) {
      throw new Error('Упражнение дня не найдено');
    }

    const list = await programRepository.getTemplateExercises(details.templateId);
    const index = list.findIndex((item) => item.id === templateExerciseId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= list.length) {
      return;
    }

    const a = list[index]!;
    const b = list[swapIndex]!;
    const timestamp = nowIso();
    const updated = list.map((item) => {
      if (item.id === a.id) {
        return { ...item, order: b.order, updatedAt: timestamp };
      }
      if (item.id === b.id) {
        return { ...item, order: a.order, updatedAt: timestamp };
      }
      return item;
    });

    await programRepository.replaceTemplateExerciseOrders(updated);
  }

  async reorderExercises(templateId: string, orderedIds: string[]): Promise<void> {
    const list = await programRepository.getTemplateExercises(templateId);
    if (list.length === 0 || orderedIds.length === 0) {
      return;
    }

    const byId = new Map(list.map((item) => [item.id, item]));
    const timestamp = nowIso();
    const updated = orderedIds
      .map((id, index) => {
        const item = byId.get(id);
        if (!item) {
          return null;
        }
        return { ...item, order: index + 1, updatedAt: timestamp };
      })
      .filter((item): item is WorkoutTemplateExercise => item != null);

    if (updated.length === 0) {
      return;
    }

    await programRepository.replaceTemplateExerciseOrders(updated);
  }

  private async reindexDays(programId: string): Promise<void> {
    const details = await programRepository.getWithTemplates(programId);
    if (!details) {
      return;
    }

    const timestamp = nowIso();
    const updated = details.templates.map(({ template }, index) => ({
      ...template,
      order: index + 1,
      updatedAt: timestamp,
    }));
    await programRepository.replaceTemplateOrders(updated);
  }

  private async reindexExercises(templateId: string): Promise<void> {
    const items = await programRepository.getTemplateExercises(templateId);
    const timestamp = nowIso();
    const updated = items.map((item, index) => ({
      ...item,
      order: index + 1,
      updatedAt: timestamp,
    }));
    await programRepository.replaceTemplateExerciseOrders(updated);
  }
}

export const programService = new ProgramService();

function resolveIncrement(incrementKg: number | undefined, exercise: Exercise): number {
  if (incrementKg != null && incrementKg > 0) {
    return incrementKg;
  }
  return exercise.defaultIncrementKg > 0 ? exercise.defaultIncrementKg : 2.5;
}

export type { PlannedSet };
