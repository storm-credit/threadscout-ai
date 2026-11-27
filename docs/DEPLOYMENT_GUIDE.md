# ThreadScout AI 실전 배포 및 표면 분리 가이드 (`Option B`)

외부 API 키(Threads / 쿠팡 Open API / 유료 LLM)나 월 고정 서버 비용 없이도 **수동 제휴 링크(네이버 쇼핑커넥트·쿠팡 파트너스) + 단일 포스트 본문 복사 + `/showcase` 공개 검증 아카이브**를 안전하게 외부에 공개할 수 있는 두 가지 표준 배포 구성을 안내합니다.

---

## 1. 표면 모드(`THREADSCOUT_SURFACE_MODE`) 3단계 요약

| 모드 | 허용 경로 | 쓰기 / DB 권한 | 용도 |
|---|---|---|---|
| `local_dev` | 전체 운영 스튜디오 + `/showcase` | 읽기·쓰기 (`127.0.0.1` 루프백 전용, DNS 리바인딩 차단) | 내 PC 단독 로컬 작업 |
| `public_showcase` | `/showcase`, `/showcase/:cardNumber`, `/api/showcase*`, `/api/health` (`/`는 `/showcase`로 `302` 이동) | **완전 읽기 전용 (`query_only = ON`)** — 운영자 HTML/JS 및 `/api/commands`·`/api/today` 물리적 비활성화(`404`) | **가장 안전한 외부 소비자 전용 공개 포트/컨테이너** |
| `combined` | 공개 `/showcase` + 토큰·세션 인증 보호된 운영자 스튜디오(`/`) | 운영자 인증 통과 시에만 읽기·쓰기 (`THREADSCOUT_OPERATOR_TOKEN` 16자 이상 필수, 미설정 시 `503` Fail-Closed) | 단일 도메인에서 외출 중 모바일 승인 + 소비자 쇼케이스 동시 운영 |

---

## 2. 추천 방식 A — 비용 `₩0` 듀얼 프로세스 분리 (내 PC 스튜디오 + 읽기 전용 공개 포트)

운영자 스튜디오는 내 PC(`127.0.0.1:4173`)에만 열어두고, 같은 SQLite WAL DB를 **읽기 전용(`public_showcase`)**으로 읽는 `4174`번 포트만 외부 터널(Cloudflare Tunnel 등)로 연결하는 가장 안전한 구조입니다.

```powershell
# 터미널 1 — 비공개 운영자 스튜디오 (내 PC 127.0.0.1:4173 전용)
npm start

# 터미널 2 — 외부 공개용 읽기 전용 쇼케이스 (포트 4174, 모든 운영자 API/파일 차단됨)
$env:PORT="4174"; npm run start:showcase
```

- 운영자 스튜디오에서 후보를 `승인`하는 즉시 SQLite WAL을 통해 `http://127.0.0.1:4174/showcase`에 `#001` 카드가 실시간 반영됩니다.
- 외부 터널(`cloudflared tunnel --url http://127.0.0.1:4174`)을 연결해도 외부 방문자는 `/api/commands`나 운영자 화면에 접근 자체가 불가능합니다(`404`).

---

## 3. 추천 방식 B — 단일 Docker 컨테이너 배포 (`public_showcase` 또는 `combined`)

### 3.1 안전한 난수 운영자 토큰 생성 (16자 이상 필수)

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

### 3.2 컨테이너 빌드 및 실행 (`combined` 모드 예시)

```bash
docker build -t threadscout-ai .

docker run -d \
  --name threadscout \
  -p 4173:4173 \
  -v threadscout_data:/data \
  -e THREADSCOUT_SURFACE_MODE=combined \
  -e THREADSCOUT_OPERATOR_TOKEN="<위에서_생성한_24바이트_난수_토큰>" \
  -e THREADSCOUT_TRUST_PROXY=true \
  threadscout-ai
```

- 소비자는 로그인 없이 `https://your-domain.example/showcase` 및 `#001` 카드를 열람합니다.
- 운영자가 `https://your-domain.example/`에 접속하면 **운영자 스튜디오 잠금 해제 시트**가 뜨며, 토큰 입력 시 `HttpOnly; SameSite=Strict; Secure` 서명 쿠키 세션(기본 12시간)이 발급됩니다.
- 긴급 상황 시 `-e THREADSCOUT_GLOBAL_KILL_SWITCH=true`로 재시작하면 모든 변경 명령이 `503`으로 정지되고 `/showcase` 노출 카드가 즉시 비워집니다.
