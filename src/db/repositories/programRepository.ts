import type {
  WorkoutProgram,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '../../domain';
import { db } from '../database';

export interface ProgramWithTemplates {
  program: WorkoutProgram;
  templates: Array<{
    template: WorkoutTemplate;
    exercises: WorkoutTemplateExercise[];
  }>;
}

export interface ProgramRepository {
  getAllWithTemplates(): Promise<ProgramWithTemplates[]>;
  getById(id: string): Promise<WorkoutProgram | undefined>;
  getWithTemplates(id: string): Promise<ProgramWithTemplates | undefined>;
  getTemplateById(id: string): Promise<WorkoutTemplate | undefined>;
  getTemplateExercises(templateId: string): Promise<WorkoutTemplateExercise[]>;
  getTemplateExercise(
    templateId: string,
    exerciseId: string,
  ): Promise<WorkoutTemplateExercise | undefined>;
  getTemplateExerciseById(id: string): Promise<WorkoutTemplateExercise | undefined>;
  createProgram(program: WorkoutProgram): Promise<void>;
  updateProgram(program: WorkoutProgram): Promise<void>;
  deleteProgram(id: string): Promise<void>;
  createTemplate(template: WorkoutTemplate): Promise<void>;
  updateTemplate(template: WorkoutTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  createTemplateExercise(item: WorkoutTemplateExercise): Promise<void>;
  updateTemplateExercise(item: WorkoutTemplateExercise): Promise<void>;
  deleteTemplateExercise(id: string): Promise<void>;
  replaceTemplateOrders(templates: WorkoutTemplate[]): Promise<void>;
  replaceTemplateExerciseOrders(items: WorkoutTemplateExercise[]): Promise<void>;
}

export class DexieProgramRepository implements ProgramRepository {
  async getAllWithTemplates(): Promise<ProgramWithTemplates[]> {
    const programs = await db.programs.orderBy('name').toArray();
    const result: ProgramWithTemplates[] = [];

    for (const program of programs) {
      const withTemplates = await this.getWithTemplates(program.id);
      if (withTemplates) {
        result.push(withTemplates);
      }
    }

    return result;
  }

  async getById(id: string): Promise<WorkoutProgram | undefined> {
    return db.programs.get(id);
  }

  async getWithTemplates(id: string): Promise<ProgramWithTemplates | undefined> {
    const program = await db.programs.get(id);
    if (!program) {
      return undefined;
    }

    const templates = await db.templates.where('programId').equals(program.id).sortBy('order');
    const withExercises = [];

    for (const template of templates) {
      const exercises = await db.templateExercises
        .where('templateId')
        .equals(template.id)
        .sortBy('order');
      withExercises.push({ template, exercises });
    }

    return { program, templates: withExercises };
  }

  async getTemplateById(id: string): Promise<WorkoutTemplate | undefined> {
    return db.templates.get(id);
  }

  async getTemplateExercises(templateId: string): Promise<WorkoutTemplateExercise[]> {
    return db.templateExercises.where('templateId').equals(templateId).sortBy('order');
  }

  async getTemplateExercise(
    templateId: string,
    exerciseId: string,
  ): Promise<WorkoutTemplateExercise | undefined> {
    return db.templateExercises
      .where('templateId')
      .equals(templateId)
      .filter((item) => item.exerciseId === exerciseId)
      .first();
  }

  async getTemplateExerciseById(id: string): Promise<WorkoutTemplateExercise | undefined> {
    return db.templateExercises.get(id);
  }

  async createProgram(program: WorkoutProgram): Promise<void> {
    await db.programs.add(program);
  }

  async updateProgram(program: WorkoutProgram): Promise<void> {
    await db.programs.put(program);
  }

  async deleteProgram(id: string): Promise<void> {
    const templates = await db.templates.where('programId').equals(id).toArray();
    await db.transaction('rw', db.programs, db.templates, db.templateExercises, async () => {
      for (const template of templates) {
        await db.templateExercises.where('templateId').equals(template.id).delete();
      }
      await db.templates.where('programId').equals(id).delete();
      await db.programs.delete(id);
    });
  }

  async createTemplate(template: WorkoutTemplate): Promise<void> {
    await db.templates.add(template);
  }

  async updateTemplate(template: WorkoutTemplate): Promise<void> {
    await db.templates.put(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.transaction('rw', db.templates, db.templateExercises, async () => {
      await db.templateExercises.where('templateId').equals(id).delete();
      await db.templates.delete(id);
    });
  }

  async createTemplateExercise(item: WorkoutTemplateExercise): Promise<void> {
    await db.templateExercises.add(item);
  }

  async updateTemplateExercise(item: WorkoutTemplateExercise): Promise<void> {
    await db.templateExercises.put(item);
  }

  async deleteTemplateExercise(id: string): Promise<void> {
    await db.templateExercises.delete(id);
  }

  async replaceTemplateOrders(templates: WorkoutTemplate[]): Promise<void> {
    await db.templates.bulkPut(templates);
  }

  async replaceTemplateExerciseOrders(items: WorkoutTemplateExercise[]): Promise<void> {
    await db.templateExercises.bulkPut(items);
  }
}

export const programRepository = new DexieProgramRepository();
