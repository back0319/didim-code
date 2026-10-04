-- Next.js 런타임은 읽기 전용 role(didim_app)로 접속합니다.
-- 로그인 비밀번호는 저장소에 두지 않고 소유자 연결에서 `alter role didim_app with login password '...'`로 설정합니다.

do $$
begin
  if not exists (select from pg_roles where rolname = 'didim_app') then
    create role didim_app nologin;
  end if;
end
$$;

revoke all on all tables in schema public from didim_app;
grant usage on schema public to didim_app;
grant select on public.problems, public.problem_test_cases, public.problem_feedback_configs to didim_app;
