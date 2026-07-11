import points from "@/data/collection-points.json";
export async function GET(request: Request) { const regionId = new URL(request.url).searchParams.get("regionId"); return Response.json(points.filter((point) => !regionId || point.regionId === regionId)); }
