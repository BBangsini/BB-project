import { aiAnalysis, applyRegionalRules, demoAnalysis } from "@/lib/analysis";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const form = await request.formData(); const file = form.get("image"); const regionId = String(form.get("regionId") || "sample-seoul"); const sample = String(form.get("sample") || "");
    if (!(file instanceof File)) return Response.json({error:"이미지 파일을 선택해 주세요."},{status:400});
    const maxMb = Number(process.env.MAX_IMAGE_SIZE_MB || 10); if (!file.type.startsWith("image/")) return Response.json({error:"이미지 파일만 업로드할 수 있습니다."},{status:400});
    if (file.size > maxMb * 1024 * 1024) return Response.json({error:`이미지는 ${maxMb}MB 이하만 가능합니다.`},{status:400});
    const imageDataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const analysis = sample ? demoAnalysis(sample) : await aiAnalysis(imageDataUrl);
    return Response.json({analysisId:crypto.randomUUID(), mode:process.env.AI_API_KEY && !sample ? "ai" : "demo", ...applyRegionalRules(analysis, regionId)});
  } catch (error) { return Response.json({error:error instanceof Error ? error.message : "분석 중 문제가 발생했습니다. 다시 시도해 주세요."},{status:422}); }
}
