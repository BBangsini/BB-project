import { parseAIAnalysis, type Analysis } from "./schema";
import regions from "../data/regions.json";
import disposalRuleData from "../data/disposal-rules.json";
import officialSources from "../data/official-rule-sources.json";

const questions = ["제품에 PET, PP, PE, PS 등의 표시가 있습니까?", "내용물을 물로 씻어낼 수 있습니까?", "재활용 마크를 가까이 촬영해 주시겠습니까?", "본체와 뚜껑을 분리해 촬영해 주시겠습니까?"];
const samples: Record<string, Analysis> = {
  pet: { detectedItems: [{ name:"투명 페트병", category:"플라스틱", material:["PET"], confidence:.92, recyclableStatus:"CONDITIONAL", contamination:{status:"LOW",description:"소량의 내용물이 남아 있는 것으로 보입니다."}, components:[{name:"본체",material:"PET",action:"내용물을 비우고 세척합니다."},{name:"라벨",material:"비닐 또는 플라스틱 추정",action:"본체에서 제거합니다."},{name:"뚜껑",material:"PP 또는 PE 추정",action:"분리해 지역 규칙을 확인합니다."}], specialWaste:false, evidence:["투명한 병 형태","PET 재활용 표시(데모)"], uncertainties:["뚜껑 재질은 사진만으로 확정할 수 없습니다."] }], needsMoreInformation:false, followUpQuestions:[], warnings:[], overallConfidence:.92 },
  container: { detectedItems: [{ name:"음식물에 오염된 배달용기", category:"플라스틱", material:["PP 또는 PET 추정"], confidence:.68, recyclableStatus:"CONDITIONAL", contamination:{status:"HIGH",description:"음식물 오염이 보여 세척 가능 여부 확인이 필요합니다."}, components:[{name:"용기",material:"플라스틱 추정",action:"음식물을 제거하고 세척 가능한 경우에만 배출합니다."}], specialWaste:false, evidence:["배달 용기 형태","음식물 흔적(데모)"], uncertainties:["정확한 재질 표시를 확인하지 못했습니다."] }], needsMoreInformation:true, followUpQuestions:questions.slice(0,2), warnings:["오염이 제거되지 않으면 일반 종량제 봉투 배출 여부를 지역 안내로 확인하세요."], overallConfidence:.68 },
  battery: { detectedItems: [{ name:"폐건전지", category:"특수폐기물", material:["금속·전해질"], confidence:.96, recyclableStatus:"SPECIAL_COLLECTION", contamination:{status:"NONE",description:"오염 여부를 판단할 필요가 없습니다."}, components:[], specialWaste:true, evidence:["원통형 건전지 형태와 단자(데모)"], uncertainties:[] }], needsMoreInformation:false, followUpQuestions:[], warnings:["위험 가능성이 있으므로 일반쓰레기나 재활용품 수거함에 넣지 마세요."], overallConfidence:.96 },
  unknown: { detectedItems: [{ name:"판별 불가 품목", category:"알 수 없음", material:[], confidence:.32, recyclableStatus:"UNKNOWN", contamination:{status:"UNKNOWN",description:"사진만으로 확인할 수 없습니다."}, components:[], specialWaste:false, evidence:[], uncertainties:["물체 전체와 재질 표시가 보이지 않습니다."] }], needsMoreInformation:true, followUpQuestions:questions, warnings:["결과를 확정하지 않았습니다. 재질 표시와 전체 형태가 보이게 다시 촬영해 주세요."], overallConfidence:.32 }
};
export function demoAnalysis(sample = "pet") { return samples[sample] ?? samples.pet; }
export function ruleKey(name: string) {
  if (name.includes("투명 페트")) return "transparent_pet";
  if (name.includes("유색 페트")) return "colored_pet";
  if (name.includes("배달") || name.includes("오염된 용기")) return "contaminated_container";
  if (name.includes("플라스틱")) return "plastic_container";
  if (name.includes("비닐")) return "vinyl";
  if (name.includes("스티로폼")) return "styrofoam";
  if (name.includes("알루미늄")) return "aluminum_can";
  if (name.includes("철 캔") || name.includes("철캔")) return "steel_can";
  if (name.includes("유리")) return "glass_bottle";
  if (name.includes("종이상자")) return "paper_box";
  if (name.includes("종이컵")) return "paper_cup";
  if (name.includes("우유팩") || name.includes("종이팩")) return "milk_carton";
  if (name.includes("건전지")) return "battery";
  if (name.includes("형광등")) return "fluorescent";
  if (name.includes("복합")) return "composite";
  return "";
}
export function applyRegionalRules(analysis: Analysis, regionId: string) {
  const region = regions.find(r => r.regionId === regionId) ?? regions[0];
  const citySources = officialSources.regions as Record<string, typeof officialSources.national & { localSteps?: string[] }>;
  const regionalSource = citySources[region.regionId] ?? (region.regionId.startsWith("seoul-") ? officialSources.seoul : officialSources.national);
  return { ...analysis, region: { regionId: region.regionId, regionName: region.regionName, isDemo: false, lastUpdated: regionalSource.verifiedAt, sourceName: regionalSource.sourceName, sourceUrl: regionalSource.sourceUrl, regionalRuleVerified: regionalSource.status.startsWith("VERIFIED_"), regionalRuleStatus: regionalSource.limitations, effectiveFrom: "effectiveFrom" in regionalSource ? regionalSource.effectiveFrom : null }, disposalGuides: analysis.detectedItems.map(item => {
    const key = ruleKey(item.name); const rule = key ? (disposalRuleData.rules as Record<string, {collectionType:string;steps:string[]}>)[key] : undefined;
    const localSteps = key === "transparent_pet" ? (regionalSource.localSteps ?? []) : [];
    return { itemName:item.name, collectionType: rule?.collectionType ?? "공식 규칙 확인 필요", steps: rule ? [...rule.steps, ...localSteps, regionalSource.limitations] : ["품목별 공식 분리배출 지침을 확인하지 못했습니다.", regionalSource.limitations], source: rule ? { ...disposalRuleData.metadata, regionalSource } : null };
  }) };
}
export async function aiAnalysis(imageDataUrl: string, context?: { residenceType?: string; previousSummary?: string }): Promise<Analysis> {
  const key = process.env.AI_API_KEY; if (!key) return demoAnalysis("pet");
  const model = process.env.AI_MODEL || "gpt-4.1-mini";
  const prompt = "당신은 대한민국 분리배출 보조 AI입니다. 사진에서 실제로 확인되는 모든 서로 다른 물체를 하나도 빠뜨리지 말고 분리해 분석하세요. 먼저 형태·용도·재질표시·재활용 마크·인쇄 글자(OCR)·색상·투명도·오염·부속품을 교차 확인한 뒤 응답하세요. 투명 PET, 유색 PET, PP·PE·PS 용기, 비닐, 스티로폼, 알루미늄·철 캔, 유리병, 종이상자·종이컵·종이팩, 복합 포장재, 폐건전지, 형광등, 전자부품·가스용기 등 위험/별도 수거 물질을 특히 구분하세요. 지우개·고무·실리콘·문구류처럼 재질 표시가 없고 사진만으로 재활용 여부를 판단하기 어려운 물체는 절대로 특정 재질이나 배출 방법을 단정하지 말고 recyclableStatus를 UNKNOWN으로 두고 가까운 재질 표시·전체 형태·크기 비교 사진을 요청하세요. 이전 사진 분석 요약이 제공되면 이번 사진의 새 근거와 함께 비교하되, 이전 추정을 근거 없이 확정하지 마세요. 본체·라벨·뚜껑·펌프·빨대·금속 스프링·배터리처럼 재질이 다른 부속품은 components에 각각 기록하세요. 사진에 보이지 않는 재질·오염·지역 규칙은 추측하거나 확정하지 마세요. 신뢰도 0.8 미만이면 uncertainties와 followUpQuestions로 필요한 추가 사진 또는 표시 확인을 요청하세요. 위험하거나 별도 수거가 필요한 물체는 confidence와 무관하게 warnings에 안전 경고를 넣으세요. 반드시 JSON만 반환하고 다음 스키마를 지키세요: detectedItems[{name,category,material:string[],confidence:0..1,recyclableStatus:RECYCLABLE|CONDITIONAL|NON_RECYCLABLE|SPECIAL_COLLECTION|UNKNOWN,contamination:{status:NONE|LOW|HIGH|UNKNOWN,description},components:[{name,material,action}],specialWaste,evidence:string[],uncertainties:string[]}], needsMoreInformation,followUpQuestions:string[],warnings:string[],overallConfidence. 배열 필드는 항목이 하나여도 반드시 배열로 반환하고, confidence와 overallConfidence는 숫자로 반환하세요. enum 상태값을 제외한 모든 사용자 노출 문자열은 쉬운 한국어로 작성하세요. 지역별 배출 규칙은 만들거나 언급하지 마세요." + (context?.previousSummary ? ` 이전 분석 요약: ${context.previousSummary}` : "") + (context?.residenceType ? ` 주거 형태: ${context.residenceType}` : "");
  const res = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`}, body:JSON.stringify({model, response_format:{type:"json_object"}, messages:[{role:"system",content:"사용자 안전을 우선하며, 보이는 증거가 없는 내용은 추측하지 않는 엄격한 분리배출 이미지 분석가입니다."},{role:"user",content:[{type:"text",text:prompt},{type:"image_url",image_url:{url:imageDataUrl,detail:"high"}}]}]}) });
  if (!res.ok) throw new Error("AI 분석 서비스를 사용할 수 없습니다.");
  const body = await res.json(); const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
  try { return parseAIAnalysis(JSON.parse(content)); } catch (error) { if (error instanceof SyntaxError) throw new Error("AI 응답을 읽지 못했습니다. 사진을 다시 촬영해 주세요."); throw error; }
}
