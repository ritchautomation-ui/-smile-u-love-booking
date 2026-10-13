create or replace function public.sul_reschedule_appointment(p_id uuid, p_date date, p_time text, p_expected_date date, p_expected_time text, p_expected_status text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare a public.appointments;
begin
  if p_date is null or p_time is null or p_time !~ '^(09|1[0-6]):(00|30)$'
     or p_date > (now() at time zone 'Asia/Manila')::date + 90
     or (p_date + p_time::time) at time zone 'Asia/Manila' <= now() then
    return jsonb_build_object('error','INVALID_SCHEDULE');
  end if;
  select * into a from public.appointments where id=p_id for update;
  if not found then return jsonb_build_object('error','NOT_FOUND'); end if;
  if a.status not in ('pending','confirmed') or a.status is distinct from p_expected_status
     or a.preferred_date is distinct from p_expected_date or a.preferred_time is distinct from p_expected_time then
    return jsonb_build_object('error','STALE');
  end if;
  if a.preferred_date=p_date and a.preferred_time=p_time then return jsonb_build_object('error','NO_CHANGE'); end if;
  perform pg_advisory_xact_lock(hashtextextended('sul:slot:' || p_date::text || ':' || p_time,0));
  if exists(select 1 from public.appointments where preferred_date=p_date and preferred_time=p_time and status='confirmed' and id<>p_id) then
    return jsonb_build_object('error','SLOT_TAKEN');
  end if;
  update public.appointments set preferred_date=p_date, preferred_time=p_time, status='confirmed', updated_at=clock_timestamp(), notified=false where id=p_id returning * into a;
  return jsonb_build_object('appointment',to_jsonb(a));
end;
$$;
revoke all on function public.sul_reschedule_appointment(uuid,date,text,date,text,text) from public,anon,authenticated;
grant execute on function public.sul_reschedule_appointment(uuid,date,text,date,text,text) to service_role;

create or replace function public.sul_review_appointment(p_id uuid,p_status text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare a public.appointments;
begin
  if p_status not in ('confirmed','declined') then return jsonb_build_object('error','INVALID_STATUS'); end if;
  select * into a from public.appointments where id=p_id for update;
  if not found then return jsonb_build_object('error','NOT_FOUND'); end if;
  if a.status<>'pending' then return jsonb_build_object('error','ALREADY_REVIEWED'); end if;
  perform pg_advisory_xact_lock(hashtextextended('sul:slot:' || a.preferred_date::text || ':' || a.preferred_time,0));
  if p_status='confirmed' and exists(select 1 from public.appointments where preferred_date=a.preferred_date and preferred_time=a.preferred_time and status='confirmed' and id<>p_id) then return jsonb_build_object('error','SLOT_TAKEN'); end if;
  update public.appointments set status=p_status,updated_at=clock_timestamp() where id=p_id returning * into a;
  return jsonb_build_object('appointment',to_jsonb(a));
end;
$$;
