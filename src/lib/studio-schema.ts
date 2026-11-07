import { z } from 'zod';
export const layerSchema = z.object({
  text: z.string().max(20000).optional(),
  src: z.string().regex(/^\/(?!\/)[^<>]*$/).max(1000).optional(),
  x: z.number().min(-3000).max(3000).optional(), y: z.number().min(-3000).max(3000).optional(),
  width: z.number().min(20).max(3000).optional(), fontSize: z.number().min(8).max(240).optional(),
  rotation: z.number().min(-180).max(180).optional(), hidden: z.boolean().optional(),
  kind: z.enum(['text', 'image']).optional(), after: z.string().max(100).optional(),
});
export const documentSchema = z.record(z.string().regex(/^(e\d+-\d+|new-[a-zA-Z0-9-]+)$/), layerSchema);
export type StudioLayer = z.infer<typeof layerSchema>;
export type StudioDocument = z.infer<typeof documentSchema>;
