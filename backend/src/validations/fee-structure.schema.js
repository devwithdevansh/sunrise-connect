import { z } from 'zod';

export const updateFeeStructureSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    annualFee: z.number().nonnegative().optional(),
    educationPartCount: z.number().int().positive().optional(),
    termPartCount: z.number().int().nonnegative().optional(),
    termFee: z.number().nonnegative().optional(),
    admissionFee: z.number().nonnegative().optional(),
    bagKitFee: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const updateTransportFeeStructureSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    amount: z.number().nonnegative().optional(),
    frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    isActive: z.boolean().optional(),
  }),
};
