import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Documentation OpenAPI de l'API d'interopérabilité v1 (T2.4, exig. 36). */
export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'API PMO NARSA — Interopérabilité',
      version: '1.0.0',
      description: "API d'échange sécurisée pour les systèmes tiers (ERP/GED/outils budgétaires).",
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: "Jeton d'API émis dans Paramètres → Interopérabilité." },
      },
      schemas: {
        Action: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', nullable: true },
            titre: { type: 'string' },
            statut: { type: 'string', enum: ['A_LANCER', 'EN_COURS', 'TERMINE', 'BLOQUE'] },
            avancement: { type: 'integer' },
            niveau: { type: 'integer' },
            planId: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/actions': {
        get: {
          summary: 'Lister les actions',
          parameters: [{ name: 'planId', in: 'query', required: false, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Liste des actions', content: { 'application/json': { schema: { type: 'object', properties: { version: { type: 'string' }, data: { type: 'array', items: { $ref: '#/components/schemas/Action' } } } } } } },
            '401': { description: 'Jeton invalide ou révoqué' },
          },
        },
        post: {
          summary: 'Créer une action (jeton read_write)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Action' } } } },
          responses: {
            '201': { description: 'Action créée' },
            '401': { description: 'Jeton invalide' },
            '403': { description: 'Jeton en lecture seule' },
          },
        },
      },
    },
  };
  return NextResponse.json(spec);
}
