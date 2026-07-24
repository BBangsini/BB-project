type RegionPoint = { regionId: string; lat: number; lng: number };

const points: RegionPoint[] = [
  { regionId: "seoul-gangnam", lat: 37.5172, lng: 127.0473 },
  { regionId: "seoul-songpa", lat: 37.5145, lng: 127.106 },
  { regionId: "seoul-mapo", lat: 37.5663, lng: 126.901 },
  { regionId: "seoul-gangseo", lat: 37.5509, lng: 126.8495 },
  { regionId: "seoul-jongno", lat: 37.573, lng: 126.9794 },
  { regionId: "seoul-gangbuk", lat: 37.6396, lng: 127.0257 },
  { regionId: "busan-haeundae", lat: 35.1631, lng: 129.1635 },
  { regionId: "daegu-suseong", lat: 35.8584, lng: 128.6307 },
  { regionId: "incheon-yeonsu", lat: 37.4104, lng: 126.6783 },
  { regionId: "gwangju-buk", lat: 35.174, lng: 126.912 },
  { regionId: "daejeon-yuseong", lat: 36.3622, lng: 127.356 },
  { regionId: "ulsan-nam", lat: 35.5438, lng: 129.3302 },
  { regionId: "suwon-yeongtong", lat: 37.2597, lng: 127.046 },
  { regionId: "seongnam-bundang", lat: 37.3828, lng: 127.119 },
  { regionId: "yongin-suji", lat: 37.322, lng: 127.097 },
  { regionId: "goyang-ilsandong", lat: 37.658, lng: 126.776 },
  { regionId: "changwon-seongsan", lat: 35.198, lng: 128.701 },
  { regionId: "jeonju-wansan", lat: 35.805, lng: 127.121 },
  { regionId: "cheongju-heungdeok", lat: 36.642, lng: 127.427 },
  { regionId: "jeju-jeju", lat: 33.499, lng: 126.531 }
];

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/** 하버사인(Haversine) 공식을 이용한 두 좌표 간의 거리 계산 (단위: km) */
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** 입력된 좌표와 가장 가까운 지역을 반환 */
export function nearestSupportedRegion(lat: number, lng: number) {
  let nearestId = "";
  let minDistance = Infinity;

  for (const point of points) {
    const dist = getDistanceKm(lat, lng, point.lat, point.lng);
    
    if (dist < minDistance) {
      minDistance = dist;
      nearestId = point.regionId;
    }
  }

  return {
    regionId: nearestId,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}
