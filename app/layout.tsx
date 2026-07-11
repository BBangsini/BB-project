import "./globals.css";
export const metadata = { title: "바로버려", description: "AI 분리배출 판별 서비스" };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f7faf8" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}</body></html>; }
