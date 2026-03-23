-- ============================================================
-- joongdi Content OS - Supabase Schema
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================================

-- 1. profiles 테이블 (유저 프로필 + 승인 상태)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_admin boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. generated_content 테이블 (생성된 글 히스토리)
create table if not exists public.generated_content (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  keyword text not null,
  style text not null,
  purpose text not null,
  length_option text not null,
  product_name text,
  product_features text,
  product_review_points text,
  target_customers text,
  title text,
  content jsonb not null,
  is_bulk boolean default false,
  bulk_count integer,
  bulk_session_id uuid,
  bulk_index integer,
  is_top_pick boolean default false,
  created_at timestamptz default now()
);

-- 3. RLS 활성화
alter table public.profiles enable row level security;
alter table public.generated_content enable row level security;

-- 4. profiles RLS 정책
-- 본인 프로필 조회
create policy "users_view_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 관리자는 모든 프로필 조회
create policy "admins_view_all_profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- 관리자는 프로필 수정 (승인/거절)
create policy "admins_update_profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- 5. generated_content RLS 정책
-- 본인 글만 조회
create policy "users_view_own_content"
  on public.generated_content for select
  using (auth.uid() = user_id);

-- 본인 글 생성
create policy "users_insert_own_content"
  on public.generated_content for insert
  with check (auth.uid() = user_id);

-- 본인 글 삭제
create policy "users_delete_own_content"
  on public.generated_content for delete
  using (auth.uid() = user_id);

-- 6. 신규 유저 가입 시 자동으로 profiles 생성하는 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, status, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case
      when new.email = current_setting('app.admin_email', true) then 'approved'
      else 'pending'
    end,
    case
      when new.email = current_setting('app.admin_email', true) then true
      else false
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. updated_at 자동 갱신 함수
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- 8. RLS 헬퍼 함수 (security definer로 profiles 재귀 방지)
create or replace function public.is_approved()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
$$ language sql security definer stable;

create or replace function public.is_admin_user()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
$$ language sql security definer stable;

-- 9. feature_settings 테이블 (기능 on/off)
create table if not exists public.feature_settings (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  updated_at timestamptz default now()
);

-- 기본 기능 데이터 삽입
insert into public.feature_settings (key, label, enabled) values
  ('generate', '콘텐츠 생성', true),
  ('bulk', '대량 생성', true),
  ('title_test', '제목 A/B 테스트', true),
  ('series', '시리즈 글 생성', true)
on conflict (key) do nothing;

alter table public.feature_settings enable row level security;

-- 모든 인증 유저가 읽을 수 있음
create policy "anyone_read_feature_settings"
  on public.feature_settings for select
  using (auth.role() = 'authenticated');

-- 관리자만 수정 가능
create policy "admins_update_feature_settings"
  on public.feature_settings for update
  using (public.is_admin_user());

-- 10. board_posts 테이블 (게시판 글)
create table if not exists public.board_posts (
  id uuid default gen_random_uuid() primary key,
  board_type text not null check (board_type in ('notice', 'free', 'qna')),
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.board_posts enable row level security;

create trigger board_posts_updated_at
  before update on public.board_posts
  for each row execute procedure public.update_updated_at();

-- 승인된 유저는 모두 읽기 가능
create policy "approved_users_read_posts"
  on public.board_posts for select
  using (public.is_approved());

-- 승인된 유저는 free/qna 글 작성 가능 (notice는 관리자만)
create policy "users_insert_posts"
  on public.board_posts for insert
  with check (
    auth.uid() = author_id
    and public.is_approved()
    and (board_type in ('free', 'qna') or public.is_admin_user())
  );

-- 작성자 또는 관리자만 수정/삭제
create policy "author_or_admin_update_posts"
  on public.board_posts for update
  using (author_id = auth.uid() or public.is_admin_user());

create policy "author_or_admin_delete_posts"
  on public.board_posts for delete
  using (author_id = auth.uid() or public.is_admin_user());

-- 10. board_comments 테이블 (자유 게시판 댓글)
create table if not exists public.board_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.board_posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.board_comments enable row level security;

create policy "approved_users_read_comments"
  on public.board_comments for select
  using (public.is_approved());

create policy "users_insert_comments"
  on public.board_comments for insert
  with check (auth.uid() = author_id and public.is_approved());

create policy "author_or_admin_delete_comments"
  on public.board_comments for delete
  using (author_id = auth.uid() or public.is_admin_user());

-- 11. qna_replies 테이블 (QnA 관리자 답변)
create table if not exists public.qna_replies (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.board_posts(id) on delete cascade not null unique,
  admin_id uuid references public.profiles(id) on delete cascade not null,
  admin_name text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.qna_replies enable row level security;

create trigger qna_replies_updated_at
  before update on public.qna_replies
  for each row execute procedure public.update_updated_at();

create policy "approved_users_read_replies"
  on public.qna_replies for select
  using (public.is_approved());

create policy "admins_insert_replies"
  on public.qna_replies for insert
  with check (public.is_admin_user());

create policy "admins_update_replies"
  on public.qna_replies for update
  using (public.is_admin_user());

-- ============================================================
-- 관리자 수동 설정 (필요시)
-- 아래 쿼리에서 이메일을 본인 관리자 이메일로 변경 후 실행:
-- UPDATE public.profiles SET status = 'approved', is_admin = true WHERE email = 'admin@yourdomain.com';
-- ============================================================
