import { z } from 'zod';

export const LicenseTypeSchema = z.enum(['CC-BY', 'CC0', 'PROPRIETARY', 'OPEN']);

export const ReportEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  checksum: z.string().min(1),
  path: z.string().optional(),
});

export const IntelEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  checksum: z.string().min(1),
  path: z.string().optional(),
});

export const AssetEntrySchema = z.object({
  filename: z.string().min(1),
  checksum: z.string().min(1),
  size: z.number().int().nonnegative(),
});

export const PackageManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  classification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']),
  createdAt: z.string().datetime(),
  author: z.string().min(1),
  license: LicenseTypeSchema,
  reports: z.array(ReportEntrySchema),
  intel: z.array(IntelEntrySchema),
  assets: z.array(AssetEntrySchema),
  metadata: z.record(z.unknown()),
});

export type PackageManifestInput = z.infer<typeof PackageManifestSchema>;

export function validateManifest(manifest: unknown): { valid: true } | { valid: false; errors: string[] } {
  const res = PackageManifestSchema.safeParse(manifest);
  if (res.success) return { valid: true };
  return { valid: false, errors: res.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) };
}
