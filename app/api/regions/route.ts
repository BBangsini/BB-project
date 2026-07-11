import regions from "@/data/regions.json";
export async function GET() { return Response.json(regions.map(({regionId,regionName,isDemo,lastUpdated,sourceName}) => ({regionId,regionName,isDemo,lastUpdated,sourceName}))); }
