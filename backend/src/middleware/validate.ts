// ─────────────────────────────────────────────────────────────────────────────
// Request validation middleware using Zod
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

/**
 * Validates req.body or req.query against a Zod schema.
 * Passes ZodError to next() for centralized handling.
 */
export function validate(schema: ZodTypeAny, target: 'body' | 'query' = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (target === 'query') {
        req.query = await schema.parseAsync(req.query);
      } else {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(err);
      }
    }
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery(schema: ZodTypeAny) {
  return validate(schema, 'query');
}
