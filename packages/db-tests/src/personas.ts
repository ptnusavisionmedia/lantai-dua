export const PERSONAS = ['customer', 'customer2', 'operator', 'operatorInactive', 'owner'] as const;

export type Persona = (typeof PERSONAS)[number];
