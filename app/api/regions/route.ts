import regions from "@/data/regions.json";
export async function GET() { return Response.json(regions.map(({regionId,regionName,group,isDemo,lastUpdated,sourceName}) => ({regionId,regionName,group,isDemo,lastUpdated,sourceName}))); }
