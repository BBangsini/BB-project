import { z } from "zod";

// 1. 유틸리티 스키마
const lenientString = (fallback: string = "확인 필요") =>
  z.string().trim().min(1).catch(fallback);

const lenientStringList = z.preprocess(
  (val) => {
    const arr = Array.isArray(val) ? val : val == null ? [] : [val];
    return arr.filter((v) => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
  },
  z.array(z.string())
).catch([]);

const clampNumber = z.coerce.number()
  .transform((n) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0))
  .catch(0);

const lenientBoolean = z.preprocess(
  (val) => val === true || val === "true",
  z.boolean().catch(false)
);

// 2. 메인 스키마 정의 (데이터 정제와 검증을 동시에 처리)
export const AnalysisSchema = z.object({
  detectedItems: z.array(
    z.object({
      name: lenientString("판별 불가 품목"),
      category: lenientString("알 수 없음"),
      material: lenientStringList,
      confidence: clampNumber,
      recyclableStatus: z.enum(["RECYCLABLE", "CONDITIONAL", "NON_RECYCLABLE", "SPECIAL_COLLECTION", "UNKNOWN"]).catch("UNKNOWN"),
      
      contamination: z.preprocess(
        (val) => (typeof val === "object" && val !== null ? val : {}),
        z.object({
          status: z.enum(["NONE", "LOW", "HIGH", "UNKNOWN"]).catch("UNKNOWN"),
          description: lenientString("사진만으로 확인할 수 없습니다."),
        })
      ).catch({ status: "UNKNOWN", description: "사진만으로 확인할 수 없습니다." }),
      
      components: z.preprocess(
        (val) => (Array.isArray(val) ? val : val == null ? [] : [val]),
        z.array(
          z.preprocess(
            (val) => (typeof val === "object" && val !== null ? val : {}),
            z.object({
              name: lenientString(),
              material: lenientString(),
              action: lenientString(),
            })
          )
        )
      ).catch([]),
      
      specialWaste: lenientBoolean,
      evidence: lenientStringList,
      uncertainties: lenientStringList,
    })
  ).min(1),
  needsMoreInformation: lenientBoolean,
  followUpQuestions: lenientStringList,
  warnings: lenientStringList,
  overallConfidence: clampNumber,
});


export type Analysis = z.infer<typeof AnalysisSchema>;

export function parseAIAnalysis(value: unknown): Analysis {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI 응답 형식을 읽지 못했습니다. 사진을 다시 촬영해 주세요.");
  }

  const parsed = AnalysisSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("AI가 필요한 분석 정보를 모두 반환하지 못했습니다. 사진을 다시 촬영해 주세요.");
  }

  return parsed.data;
}
