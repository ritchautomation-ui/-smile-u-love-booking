-- Compatible with the existing Smile U Love v5 table. No records are deleted.
begin;
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(), reference text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80), phone text not null, email text not null,
  service text not null, preferred_date date not null, preferred_time text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','declined')),
  consent boolean not null default false, notified boolean not null default false
);
alter table public.appointments enable row level security;
revoke all on public.appointments from anon, authenticated;
grant select, insert, update on public.appointments to service_role;
create index if not exists appointments_created_idx on public.appointments (created_at desc);
create index if not exists sul_appointments_email_created on public.appointments (email, created_at);
create index if not exists sul_appointments_phone_created on public.appointments (phone, created_at);
create index if not exists sul_appointments_slot on public.appointments (preferred_date, preferred_time) where status = 'confirmed';

-- Called only by the server with its existing service role; never from a public browser.
create or replace function public.sul_submit_appointment(p jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare a public.appointments; n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('sul:email:' || (p->>'email'), 0));
  perform pg_advisory_xact_lock(hashtextextended('sul:phone:' || (p->>'phone'), 0));
  select * into a from public.appointments where reference = p->>'reference';
  if found then
    if a.email <> p->>'email' or a.phone <> p->>'phone' or a.name <> p->>'name' or a.service <> p->>'service' or a.preferred_date::text <> p->>'preferred_date' or a.preferred_time <> p->>'preferred_time' then
      return jsonb_build_object('error','REQUEST_CONFLICT');
    end if;
    return jsonb_build_object('duplicate',true,'appointment',to_jsonb(a));
  end if;
  select count(*) into n from public.appointments where created_at > now() - interval '1 hour' and (email = p->>'email' or phone = p->>'phone');
  if n >= 3 then return jsonb_build_object('error','RATE_LIMIT'); end if;
  insert into public.appointments(reference,name,phone,email,service,preferred_date,preferred_time,consent)
    values (p->>'reference',p->>'name',p->>'phone',p->>'email',p->>'service',(p->>'preferred_date')::date,p->>'preferred_time',true) returning * into a;
  return jsonb_build_object('duplicate',false,'appointment',to_jsonb(a));
end;
$$;

create or replace function public.sul_review_appointment(p_id uuid, p_status text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare a public.appointments;
begin
  if p_status not in ('confirmed','declined') then return jsonb_build_object('error','INVALID_STATUS'); end if;
  select * into a from public.appointments where id = p_id;
  if not found then return jsonb_build_object('error','NOT_FOUND'); end if;
  perform pg_advisory_xact_lock(hashtextextended('sul:slot:' || a.preferred_date::text || ':' || a.preferred_time, 0));
  select * into a from public.appointments where id = p_id for update;
  if a.status <> 'pending' then return jsonb_build_object('error','ALREADY_REVIEWED'); end if;
  if p_status = 'confirmed' and exists(select 1 from public.appointments where preferred_date = a.preferred_date and preferred_time = a.preferred_time and status = 'confirmed' and id <> p_id) then
    return jsonb_build_object('error','SLOT_TAKEN');
  end if;
  update public.appointments set status = p_status, updated_at = now() where id = p_id returning * into a;
  return jsonb_build_object('appointment',to_jsonb(a));
end;
$$;

create or replace function public.sul_booking_health() returns boolean
language sql security invoker set search_path = '' as $$ select true; $$;
revoke all on function public.sul_submit_appointment(jsonb) from public, anon, authenticated;
revoke all on function public.sul_review_appointment(uuid,text) from public, anon, authenticated;
revoke all on function public.sul_booking_health() from public, anon, authenticated;
grant execute on function public.sul_submit_appointment(jsonb) to service_role;
grant execute on function public.sul_review_appointment(uuid,text) to service_role;
grant execute on function public.sul_booking_health() to service_role;
commit;
