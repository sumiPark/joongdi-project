# joongdi Content OS

데이터 기반 블로그 콘텐츠 자동 생성 플랫폼 (애드센스/애드포스트 최적화)

## 주요 기능

- **글 생성**: 키워드 + 문체/목적/길이 설정으로 완성형 블로그 글 자동 생성
- **대량 생성**: 30/50/100개의 서로 다른 구조의 글을 한 번에 생성
- **회원 관리**: 가입 후 관리자 승인 시스템
- **생성 기록**: 이전 생성 글 저장 및 복사

---

## 배포 설정

### 1. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **SQL Editor**에서 `schema.sql` 파일 내용을 실행
3. Project Settings > API에서 다음 값을 복사:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key)

### 2. Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 에서 API 키 발급
2. `ANTHROPIC_API_KEY` 값으로 사용

### 3. Render 배포

1. [render.com](https://render.com) 에 GitHub 저장소 연결
2. **New > Web Service** 선택
3. 환경변수 설정 (아래 참조)
4. 배포 완료 후 URL을 `NEXT_PUBLIC_APP_URL`로 설정

### 환경변수 목록

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_EMAIL=admin@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

### 4. 관리자 계정 설정

배포 후 첫 관리자 계정을 수동으로 설정해야 합니다:

1. 앱에서 관리자로 사용할 이메일로 회원가입
2. Supabase SQL Editor에서 실행:

```sql
UPDATE public.profiles
SET status = 'approved', is_admin = true
WHERE email = 'admin@yourdomain.com';
```

---

## 로컬 개발

```bash
# 의존성 설치
npm install

# .env.local 파일 생성 (.env.example 참고)
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## 기술 스택

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Anthropic Claude API (claude-sonnet-4-6)
- **Styling**: Tailwind CSS
- **Deployment**: Render
