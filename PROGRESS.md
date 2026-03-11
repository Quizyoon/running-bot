# LINE 러닝 동호회 챗봇 - 진행 현황

## 1. Rule (프로젝트 규칙 및 구조)

### 기술 스택
| 레이어 | 기술 |
|--------|------|
| 런타임 | Node.js + TypeScript |
| 프레임워크 | Express |
| 챗봇 | LINE Messaging API (`@line/bot-sdk`) |
| OCR | Claude Vision API (`claude-haiku-4-5-20251001`) |
| DB | PostgreSQL (Supabase) |
| 스케줄러 | node-cron |
| 배포 | Render.com |
| 소스관리 | GitHub (`Quizyoon/running-bot`) |

### 프로젝트 구조
```
src/
├── index.ts                 # Express 서버 + LINE webhook 진입점
├── db/
│   ├── client.ts            # PostgreSQL 연결 + 스키마 초기화 (인라인 SQL)
│   └── schema.sql           # 스키마 참조용 (빌드에는 미포함)
├── ocr/
│   └── claude.ts            # Claude Vision API OCR
├── webhook/
│   ├── handler.ts           # 이벤트 라우터 (message/postback)
│   ├── image.ts             # 스크린샷 처리 → OCR → 확인카드
│   ├── message.ts           # 텍스트 명령어 처리 (10개)
│   ├── postback.ts          # ✅맞아요 / ❌틀려요 / 수정 처리
│   └── state.ts             # 대기 레코드 (Map, 5분 만료)
├── services/
│   ├── running.ts           # 이상치 검증, 중복 체크, 세션 저장
│   ├── attendance.ts        # 출석, 연속일, 배지, member_stats 갱신
│   ├── ranking.ts           # 월간 랭킹(거리60%+페이스40%), 일일 페이스 랭킹
│   └── event.ts             # 이벤트 A(주간개근) / B(하루랭킹) CRUD
├── scheduler/
│   └── cron.ts              # 5개 자동 스케줄
└── flex/
    ├── confirmCard.ts       # 확인 카드 + 수정 항목 선택
    ├── resultCard.ts        # 저장 완료 결과 카드
    ├── rankingCard.ts       # 월간 랭킹 Flex 카드
    └── eventCard.ts         # 이벤트 공지/결과/출석/개근 카드
```

### DB 테이블
| 테이블 | 용도 |
|--------|------|
| `running_sessions` | 러닝 기록 (거리, 시간, 페이스, 날짜, 앱) |
| `member_stats` | 멤버 통계 (월간 거리, 페이스, 연속출석, 배지) |
| `events` | 이벤트 (WEEKLY_ATTENDANCE / DAILY_RACE) |

### 환경변수
```
LINE_CHANNEL_ID=2009406503
LINE_CHANNEL_SECRET=0810a08ceac540cdb2a6aadc1627c27c
LINE_CHANNEL_ACCESS_TOKEN=<Render 환경변수에서 관리>
ANTHROPIC_API_KEY=<Render 환경변수에서 관리>
DATABASE_URL=postgresql://postgres.wsbzzpxropaacrnwtets:<PW>@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
PORT=3000
ADMIN_USER_IDS=<LINE User ID, 쉼표 구분>
```

### 배포 정보
- **Render URL**: `https://running-bot-bg1q.onrender.com`
- **Webhook URL**: `https://running-bot-bg1q.onrender.com/webhook`
- **GitHub**: `https://github.com/Quizyoon/running-bot`

---

## 2. Skill (구현된 기능)

### 핵심 기능

#### 스크린샷 인증 (OCR)
- 그룹챗에 러닝 앱 스크린샷 업로드
- Claude Vision API로 거리/시간/페이스/날짜/앱 자동 추출
- 지원 앱: Nike Run Club, Strava, Garmin, Apple Fitness, Samsung Health 등 8개
- 이상치 필터링: 거리 0.5~100km, 페이스 2~20min/km, 당일만 인정
- 동일 날짜 중복 등록 차단

#### 확인 플로우
- ✅ 맞아요 → DB 저장 + 출석 체크 + 결과 카드 발송
- ❌ 틀려요 → 항목 선택(거리/시간/페이스/날짜) → 직접 수정 → 재확인
- 5분 타임아웃 자동 만료

#### 출석 체크
- 스크린샷 인증 성공 = 당일 출석 자동 처리
- 1일 1회, 1.0km 이상만 인정

#### 배지 시스템
| 배지 | 조건 |
|------|------|
| 🔥 불꽃 런너 | 3일 연속 출석 |
| ⚡ 번개 런너 | 7일 연속 출석 |
| 🌟 스타 런너 | 30일 누적 출석 |
| 👑 왕관 런너 | 한 달 개근 |

#### 랭킹 시스템
- 종합 점수 = (정규화 거리 × 0.6) + (정규화 페이스 × 0.4)
- 월간 Top 20 Flex 카드

#### 이벤트 A — 주간 개근 챌린지
- 매주 월~일 7일 모두 인증 시 달성
- 매일 20시 주간 현황 자동 발송
- 매주 월요일 09시 달성자 발표

#### 이벤트 B — 하루 페이스 랭킹
- 관리자가 날짜 지정 (`/이벤트생성`)
- D-3, D-1, 당일 00시, 당일 18시(중간순위), 익일 09시(결과) 자동 공지
- 당일 최고 페이스 1위 우승

### 명령어

#### 일반
| 명령어 | 기능 |
|--------|------|
| 스크린샷 업로드 | 러닝 인증 + 출석 |
| `/내기록` | 개인 월간 통계 |
| `/랭킹` | 월간 전체 랭킹 카드 |
| `/출석` | 이번 주 출석 현황 |
| `/이벤트` | 진행 중인 이벤트 안내 |
| `/도움말` | 전체 명령어 안내 |

#### 관리자 전용
| 명령어 | 기능 |
|--------|------|
| `/이벤트생성 [날짜]` | 하루 랭킹 이벤트 생성 |
| `/이벤트취소` | 예약 이벤트 취소 |
| `/이벤트현황` | 당일 실시간 랭킹 |

### 자동 스케줄 (node-cron)
| 시간 | 동작 |
|------|------|
| 매일 20:00 | 주간 개근 현황 그룹챗 발송 |
| 매일 09:00 | 이벤트 공지 (D-3, D-1) + 전일 결과 발표 |
| 매일 00:00 | 당일 이벤트 공지 |
| 매일 18:00 | 이벤트 중간 순위 |
| 매주 월 09:00 | 주간 개근 달성자 발표 |

### Flex Message 카드
| 카드 | 파일 | 용도 |
|------|------|------|
| 확인 카드 | `confirmCard.ts` | OCR 결과 확인 (✅/❌) |
| 수정 선택 | `confirmCard.ts` | 틀린 항목 선택 프롬프트 |
| 결과 카드 | `resultCard.ts` | 저장 완료 알림 |
| 랭킹 카드 | `rankingCard.ts` | 월간 랭킹 Top 20 |
| 이벤트 공지 | `eventCard.ts` | 하루 이벤트 D-day 공지 |
| 이벤트 결과 | `eventCard.ts` | 이벤트 최종 결과 |
| 주간 출석 | `eventCard.ts` | 개근 현황표 |
| 개근 달성 | `eventCard.ts` | 7일 개근 축하 |

---

## 3. 트러블슈팅 이력

| 문제 | 원인 | 해결 |
|------|------|------|
| Render 빌드 실패 (TS2688) | `@types/node`가 devDependencies에만 있음 | dependencies로 이동 |
| 런타임 ENOENT schema.sql | `tsc`가 .sql 파일을 복사 안 함 | SQL을 코드에 인라인 |
| 401 Unauthorized | LINE Access Token 만료/불일치 | 새 토큰 발급 후 Render 환경변수 교체 |
| model not_found_error | API 키에서 claude-3 시리즈 미지원 | `claude-haiku-4-5-20251001`로 변경 |
| DB 인증 실패 | 비밀번호 특수문자(`*`) URL 인코딩 누락 | `*` → `%2A` |
| 일본어 자동응답 | LINE 자동 답변 메시지 ON | 자동 답변 OFF, Webhook ON |
