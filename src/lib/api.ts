import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiError = { error: { code: string; message: string; details?: unknown } };

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(code: string, message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json({ error: { code, message, details } } satisfies ApiError, { status });
}

/** Normalise les erreurs (Zod, Prisma, génériques) en réponse standard. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return fail('VALIDATION', 'Données invalides', 422, e.flatten());
  }
  if (e instanceof Error) {
    // eslint-disable-next-line no-console
    console.error(e);
    // En production, ne pas divulguer les détails internes au client.
    const message = process.env.NODE_ENV === 'production' ? 'Erreur interne' : e.message || 'Erreur interne';
    return fail('INTERNAL', message, 500);
  }
  return fail('INTERNAL', 'Erreur interne', 500);
}
