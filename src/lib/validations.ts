import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["TRIP", "APARTMENT", "COUPLE", "EVENT", "OTHER"]).default("OTHER"),
  memberEmails: z.array(z.string().email()).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

const splitInputSchema = z.object({
  userId: z.string().min(1),
  amount: z.string().optional(),
  percentage: z.string().optional(),
  shares: z.number().int().min(1).optional(),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(200),
  amount: z.string().refine(
    (val) => {
      const n = parseFloat(val);
      return !isNaN(n) && n > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  currency: z.string().default("USD"),
  date: z.string().optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]).default("EQUAL"),
  groupId: z.string().optional(),
  paidById: z.string().min(1),
  payers: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: z.string(),
      })
    )
    .optional(),
  splits: z.array(splitInputSchema).min(1, "At least one participant is required"),
});

export const createSettlementSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const n = parseFloat(val);
      return !isNaN(n) && n > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  currency: z.string().default("USD"),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  groupId: z.string().optional(),
  notes: z.string().max(500).optional(),
  date: z.string().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
