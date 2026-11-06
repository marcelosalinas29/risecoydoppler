create or replace function public.appt_slots_needed(_study text) returns int
language sql immutable set search_path = public as $$
  select case
    when exists (
      select 1 from regexp_split_to_table(upper(coalesce(_study,'')), '\s*\+\s*') as p(x)
      where trim(p.x) like '%PUNCIÓN%' or trim(p.x) like '%PUNCION%'
         or trim(p.x) like '%BIOPSIA%' or trim(p.x) like '%PAAF%' or trim(p.x) like '%TRUCUT%'
    ) then 3
    when exists (
      select 1 from regexp_split_to_table(upper(coalesce(_study,'')), '\s*\+\s*') as p(x)
      where trim(p.x) like '%DOPPLER%'
         or trim(p.x) like '%MORFOLÓGICA%' or trim(p.x) like '%MORFOLOGICA%'
         or trim(p.x) like '% TN%' or trim(p.x) like 'TN %' or trim(p.x) = 'TN'
         or trim(p.x) like '%SCAN FETAL%'
         or trim(p.x) like '%TEST DE FUNCIÓN ENDOTELIAL%' or trim(p.x) like '%TEST DE FUNCION ENDOTELIAL%'
    ) then 2
    else 1 end
$$;

create or replace function public.enforce_double_slot() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_t time;
  v_slot time;
  v_n int;
  k int;
  v_hit text;
  v_hit_n int;
begin
  if NEW.es_sobreturno or NEW.status in ('cancelled','no-show') then return NEW; end if;
  v_t := public.appt_time(NEW.time);
  if v_t is null then return NEW; end if;

  if TG_OP = 'UPDATE' then
    if OLD.date = NEW.date and OLD.time = NEW.time
       and OLD.study_type is not distinct from NEW.study_type
       and OLD.doctor_id is not distinct from NEW.doctor_id
       and OLD.es_sobreturno = NEW.es_sobreturno
       and OLD.status not in ('cancelled','no-show') then
      return NEW;
    end if;
  end if;

  select b.time, public.appt_slots_needed(b.study_type) into v_hit, v_hit_n from public.appointments b
   where b.date = NEW.date and b.id <> NEW.id
     and b.status not in ('cancelled','no-show') and not b.es_sobreturno
     and (b.doctor_id is null or NEW.doctor_id is null or b.doctor_id = NEW.doctor_id)
     and public.appt_slots_needed(b.study_type) > 1
     and public.appt_time(b.time) < v_t
     and v_t < public.appt_time(b.time) + (public.appt_slots_needed(b.study_type) * interval '10 minutes')
   limit 1;
  if v_hit is not null then
    raise exception 'Las % es parte de un estudio de % turnos que empieza a las %. Elegí otro horario o usá Sobreturno.', to_char(v_t,'HH24:MI'), v_hit_n, v_hit using errcode = 'P0001';
  end if;

  v_n := public.appt_slots_needed(NEW.study_type);
  if v_n > 1 then
    for k in 1..(v_n - 1) loop
      v_slot := v_t + (k * interval '10 minutes');
      v_hit := null;
      select b.time into v_hit from public.appointments b
       where b.date = NEW.date and b.id <> NEW.id
         and b.status not in ('cancelled','no-show') and not b.es_sobreturno
         and (b.doctor_id is null or NEW.doctor_id is null or b.doctor_id = NEW.doctor_id)
         and (
           public.appt_time(b.time) = v_slot
           or (public.appt_slots_needed(b.study_type) > 1
               and public.appt_time(b.time) < v_slot
               and v_slot < public.appt_time(b.time) + (public.appt_slots_needed(b.study_type) * interval '10 minutes'))
         )
       limit 1;
      if v_hit is not null then
        raise exception 'Este estudio ocupa % turnos y el horario de las % ya está ocupado. Elegí otro horario.', v_n, to_char(v_slot,'HH24:MI') using errcode = 'P0001';
      end if;
    end loop;
  end if;

  return NEW;
end $$;