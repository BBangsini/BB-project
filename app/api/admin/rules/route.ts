import { appendFile, mkdir } from "fs/promises";
import path from "path";
import sources from "@/data/official-rule-sources.json";
export async function GET() { return Response.json(sources); }
export async function POST(request: Request) { try { const token=process.env.ADMIN_TOKEN; if(!token||request.headers.get("x-admin-token")!==token) return Response.json({error:"관리자 인증이 필요합니다."},{status:401}); const body=await request.json(); if(!body.regionId||!body.sourceUrl||!body.note) return Response.json({error:"지역, 공식 출처 URL, 검토 메모를 입력하세요."},{status:400}); const dir=path.join(process.cwd(),"data"); await mkdir(dir,{recursive:true}); await appendFile(path.join(dir,"rule-review-requests.jsonl"),JSON.stringify({regionId:body.regionId,sourceUrl:body.sourceUrl,note:body.note,createdAt:new Date().toISOString()})+"\n"); return Response.json({ok:true}); } catch { return Response.json({error:"검토 기록을 저장하지 못했습니다."},{status:400}); } }
