import { z } from "zod";

export const AnalysisSchema = z.object({
  detectedItems: z.array(z.object({
    name: z.string(), category: z.string(), material: z.array(z.string()), confidence: z.number().min(0).max(1),
    recyclableStatus: z.enum(["RECYCLABLE", "CONDITIONAL", "NON_RECYCLABLE", "SPECIAL_COLLECTION", "UNKNOWN"]),
    contamination: z.object({ status: z.enum(["NONE", "LOW", "HIGH", "UNKNOWN"]), description: z.string() }),
    components: z.array(z.object({ name: z.string(), material: z.string(), action: z.string() })), specialWaste: z.boolean(),
    evidence: z.array(z.string()), uncertainties: z.array(z.string())
  })).min(1),
  needsMoreInformation: z.boolean(), followUpQuestions: z.array(z.string()), warnings: z.array(z.string()), overallConfidence: z.number().min(0).max(1)
});
export type Analysis = z.infer<typeof AnalysisSchema>;

const recyclableStatuses = ["RECYCLABLE", "CONDITIONAL", "NON_RECYCLABLE", "SPECIAL_COLLECTION", "UNKNOWN"] as const;
const contaminationStatuses = ["NONE", "LOW", "HIGH", "UNKNOWN"] as const;
const asText = (value: unknown, fallback = "확인 필요") => typeof value === "string" && value.trim() ? value.trim() : fallback;
const asList = (value: unknown) => value == null ? [] : Array.isArray(value) ? value : [value];
const asTextList = (value: unknown) => asList(value).filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean);
const asNumber = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0;
};
const enumValue = <T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]) => typeof value === "string" && (allowed as readonly string[]).includes(value) ? value : fallback;

/** Converts harmless model formatting variations, then validates the final result at runtime. */
export function parseAIAnalysis(value: unknown): Analysis {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI 응답 형식을 읽지 못했습니다. 사진을 다시 촬영해 주세요.");
  const raw = value as Record<string, unknown>;
  const items = asList(raw.detectedItems).map((entry) => {
    const item = entry && typeof entry === "object" && !Array.isArray(entry) ? entry as Record<string, unknown> : {};
    const contamination = item.contamination && typeof item.contamination === "object" ? item.contamination as Record<string, unknown> : {};
    return {
      name: asText(item.name, "판별 불가 품목"), category: asText(item.category, "알 수 없음"), material: asTextList(item.material), confidence: asNumber(item.confidence),
      recyclableStatus: enumValue(item.recyclableStatus, recyclableStatuses, "UNKNOWN"),
      contamination: { status: enumValue(contamination.status, contaminationStatuses, "UNKNOWN"), description: asText(contamination.description, "사진만으로 확인할 수 없습니다.") },
      components: asList(item.components).map((part) => { const component = part && typeof part === "object" ? part as Record<string, unknown> : {}; return { name: asText(component.name), material: asText(component.material), action: asText(component.action) }; }),
      specialWaste: item.specialWaste === true || item.specialWaste === "true", evidence: asTextList(item.evidence), uncertainties: asTextList(item.uncertainties)
    };
  });
  const normalized = { detectedItems: items, needsMoreInformation: raw.needsMoreInformation === true || raw.needsMoreInformation === "true", followUpQuestions: asTextList(raw.followUpQuestions), warnings: asTextList(raw.warnings), overallConfidence: asNumber(raw.overallConfidence) };
  const parsed = AnalysisSchema.safeParse(normalized);
  if (!parsed.success) throw new Error("AI가 필요한 분석 정보를 모두 반환하지 못했습니다. 사진을 다시 촬영해 주세요.");
  return parsed.data;
}
