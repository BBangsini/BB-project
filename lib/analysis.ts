import { AnalysisSchema, type Analysis } from "./schema";
import regions from "../data/regions.json";

const questions = ["제품에 PET, PP, PE, PS 등의 표시가 있습니까?", "내용물을 물로 씻어낼 수 있습니까?", "재활용 마크를 가까이 촬영해 주시겠습니까?", "본체와 뚜껑을 분리해 촬영해 주시겠습니까?"];
const samples: Record<string, Analysis> = {
  pet: { detectedItems: [{ name:"투명 페트병", category:"플라스틱", material:["PET"], confidence:.92, recyclableStatus:"CONDITIONAL", contamination:{status:"LOW",description:"소량의 내용물이 남아 있는 것으로 보입니다."}, components:[{name:"본체",material:"PET",action:"내용물을 비우고 세척합니다."},{name:"라벨",material:"비닐 또는 플라스틱 추정",action:"본체에서 제거합니다."},{name:"뚜껑",material:"PP 또는 PE 추정",action:"분리해 지역 규칙을 확인합니다."}], specialWaste:false, evidence:["투명한 병 형태","PET 재활용 표시(데모)"], uncertainties:["뚜껑 재질은 사진만으로 확정할 수 없습니다."] }], needsMoreInformation:false, followUpQuestions:[], warnings:[], overallConfidence:.92 },
  container: { detectedItems: [{ name:"음식물에 오염된 배달용기", category:"플라스틱", material:["PP 또는 PET 추정"], confidence:.68, recyclableStatus:"CONDITIONAL", contamination:{status:"HIGH",description:"음식물 오염이 보여 세척 가능 여부 확인이 필요합니다."}, components:[{name:"용기",material:"플라스틱 추정",action:"음식물을 제거하고 세척 가능한 경우에만 배출합니다."}], specialWaste:false, evidence:["배달 용기 형태","음식물 흔적(데모)"], uncertainties:["정확한 재질 표시를 확인하지 못했습니다."] }], needsMoreInformation:true, followUpQuestions:questions.slice(0,2), warnings:["오염이 제거되지 않으면 일반 종량제 봉투 배출 여부를 지역 안내로 확인하세요."], overallConfidence:.68 },
  battery: { detectedItems: [{ name:"폐건전지", category:"특수폐기물", material:["금속·전해질"], confidence:.96, recyclableStatus:"SPECIAL_COLLECTION", contamination:{status:"NONE",description:"오염 여부를 판단할 필요가 없습니다."}, components:[], specialWaste:true, evidence:["원통형 건전지 형태와 단자(데모)"], uncertainties:[] }], needsMoreInformation:false, followUpQuestions:[], warnings:["위험 가능성이 있으므로 일반쓰레기나 재활용품 수거함에 넣지 마세요."], overallConfidence:.96 },
  unknown: { detectedItems: [{ name:"판별 불가 품목", category:"알 수 없음", material:[], confidence:.32, recyclableStatus:"UNKNOWN", contamination:{status:"UNKNOWN",description:"사진만으로 확인할 수 없습니다."}, components:[], specialWaste:false, evidence:[], uncertainties:["물체 전체와 재질 표시가 보이지 않습니다."] }], needsMoreInformation:true, followUpQuestions:questions, warnings:["결과를 확정하지 않았습니다. 재질 표시와 전체 형태가 보이게 다시 촬영해 주세요."], overallConfidence:.32 }
};
export function demoAnalysis(sample = "pet") { return samples[sample] ?? samples.pet; }
export function ruleKey(name: string) { return name.includes("페트") ? "transparent_pet" : name.includes("건전지") ? "battery" : ""; }
export function applyRegionalRules(analysis: Analysis, regionId: string) {
  const region = regions.find(r => r.regionId === regionId) ?? regions[0];
  return { ...analysis, region: { regionId: region.regionId, regionName: region.regionName, isDemo: region.isDemo, lastUpdated: region.lastUpdated, sourceName: region.sourceName }, disposalGuides: analysis.detectedItems.map(item => {
    const key = ruleKey(item.name); const rule = key ? (region.rules as Record<string, {collectionType:string;steps:string[]}>)[key] : undefined;
    return { itemName:item.name, collectionType: rule?.collectionType ?? "지역별 규칙 없음", steps: rule?.steps ?? ["사진만으로 지역 규정을 확인할 수 없습니다.", "관할 지자체 또는 관리사무소에 확인해 주세요."] };
  }) };
}
export async function aiAnalysis(imageDataUrl: string): Promise<Analysis> {
  const key = process.env.AI_API_KEY; if (!key) return demoAnalysis("pet");
  const model = process.env.AI_MODEL || "gpt-4.1-mini";
  const prompt = "Analyze only visible waste information. Return JSON only matching this schema: detectedItems[{name,category,material:string[],confidence:0..1,recyclableStatus:RECYCLABLE|CONDITIONAL|NON_RECYCLABLE|SPECIAL_COLLECTION|UNKNOWN,contamination:{status:NONE|LOW|HIGH|UNKNOWN,description},components:[{name,material,action}],specialWaste,evidence:string[],uncertainties:string[]}], needsMoreInformation,followUpQuestions:string[],warnings:string[],overallConfidence. Do not invent local disposal rules.";
  const res = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`}, body:JSON.stringify({model, response_format:{type:"json_object"}, messages:[{role:"user",content:[{type:"text",text:prompt},{type:"image_url",image_url:{url:imageDataUrl}}]}]}) });
  if (!res.ok) throw new Error("AI 분석 서비스를 사용할 수 없습니다.");
  const body = await res.json(); const content = body.choices?.[0]?.message?.content;
  return AnalysisSchema.parse(JSON.parse(content));
}
