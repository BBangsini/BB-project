# 바로버려 — AI 분리배출 판별 MVP

사진 업로드/모바일 촬영, 데모 분석, 지역 규칙 결합, 피드백 API를 제공하는 Next.js MVP입니다. 사진은 서버에 영구 저장하지 않습니다.

## 실행

```bash
npm install
cp .env.example .env.local  # Windows에서는 Copy-Item .env.example .env.local
npm run dev
```

`http://localhost:3000`에서 열 수 있습니다. `npm test`, `npm run build`로 검증합니다.

## AI 연결과 데모 모드

`.env.local`에 `AI_API_KEY`와 이미지 입력을 지원하는 `AI_MODEL`을 넣으면 OpenAI 호환 Chat Completions API로 실제 분석을 요청합니다. API 키가 없거나 데모 항목을 고르면, 안전한 내장 샘플 응답을 사용합니다. AI가 지역 규칙을 만들지 않으며, `data/regions.json`의 시연용 규칙과 서버에서 결합합니다.

## 구현 범위 및 한계

- 구현: 이미지 MIME/크기 검증, 4개 데모 시나리오, 낮은 신뢰도 질문, 위험 폐건전지 경고, 지역 3곳, JSON 스키마 검증, JSONL 피드백 저장.
- 시연 규칙은 공식 규정이 아닙니다. 실제 배포 전 지자체 공식 출처·수거처 데이터로 교체해야 합니다.
- 외부 AI의 인식 정확도와 이미지 품질에 따라 결과가 달라질 수 있으며, 의료·폭발·유해 물질은 전문기관 확인이 우선입니다.
