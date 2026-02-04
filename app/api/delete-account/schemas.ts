import { z } from 'zod';

export const deleteAccountSuccessSchema = z.object({
  success: z.literal(true),
});

export const deleteAccountErrorSchema = z.object({
  error: z.string(),
});

export type DeleteAccountSuccess = z.infer<typeof deleteAccountSuccessSchema>;
export type DeleteAccountError = z.infer<typeof deleteAccountErrorSchema>;
