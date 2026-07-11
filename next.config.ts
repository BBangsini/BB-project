import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 중 같은 Wi-Fi의 모바일 기기에서 HMR 자산을 요청할 수 있게 합니다.
  allowedDevOrigins: ["192.168.1.123"],
};
export default nextConfig;
