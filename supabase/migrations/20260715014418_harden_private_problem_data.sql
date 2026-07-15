create index problems_created_by_idx on public.problems(created_by);

create policy "private solutions are not publicly readable"
  on public.problem_solutions
  for select
  to anon, authenticated
  using (false);

create policy "private feedback configs are not publicly readable"
  on public.problem_feedback_configs
  for select
  to anon, authenticated
  using (false);
