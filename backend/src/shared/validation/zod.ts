import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

export const validateInput = <T>(schema: ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.') || 'body';
        fieldErrors[path] = err.message;
      });
      throw new ValidationError('Input validation failed', fieldErrors);
    }
    throw new ValidationError('Invalid input format');
  }
};
