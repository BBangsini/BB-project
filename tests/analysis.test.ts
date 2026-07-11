import { describe, expect, it } from "vitest";
import { applyRegionalRules, demoAnalysis } from "../lib/analysis";
import { AnalysisSchema } from "../lib/schema";
describe("분석 및 지역 규칙",()=>{ it("데모 응답은 스키마를 만족한다",()=>expect(AnalysisSchema.parse(demoAnalysis("pet")).overallConfidence).toBe(.92)); it("폐건전지는 별도 수거 안내를 받는다",()=>expect(applyRegionalRules(demoAnalysis("battery"),"sample-seoul").disposalGuides[0].collectionType).toContain("전용")); it("낮은 신뢰도는 추가 확인을 요청한다",()=>expect(demoAnalysis("unknown").needsMoreInformation).toBe(true)); });
