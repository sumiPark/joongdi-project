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

-- ============================================================
-- 관리자 수동 설정 (필요시)
-- 아래 쿼리에서 이메일을 본인 관리자 이메일로 변경 후 실행:
-- UPDATE public.profiles SET status = 'approved', is_admin = true WHERE email = 'admin@yourdomain.com';
-- ============================================================
