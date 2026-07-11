import { z } from "zod";

export const AnalysisSchema = z.object({
  detectedItems: z.array(z.object({
    name: z.string(), category: z.string(), material: z.array(z.string()), confidence: z.number().min(0).max(1),
    recyclableStatus: z.enum(["RECYCLABLE", "CONDITIONAL", "NON_RECYCLABLE", "SPECIAL_COLLECTION", "UNKNOWN"]),
    contamination: z.object({ status: z.enum(["NONE", "LOW", "HIGH", "UNKNOWN"]), description: z.string() }),
    components: z.array(z.object({ name: z.string(), material: z.string(), action: z.string() })), specialWaste: z.boolean(),
    evidence: z.array(z.string()), uncertainties: z.array(z.string())
  })),
  needsMoreInformation: z.boolean(), followUpQuestions: z.array(z.string()), warnings: z.array(z.string()), overallConfidence: z.number().min(0).max(1)
});
export type Analysis = z.infer<typeof AnalysisSchema>;
