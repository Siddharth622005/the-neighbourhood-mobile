-- Lets someone who already joined look up their queue position and
-- referral link again later, using only their phone number (the one
-- field that's always required). Returns just an id and a position,
-- never name/phone/email, the same privacy shape as the rest of the
-- waitlist RPCs. Security definer so it can find the row regardless of
-- the column-level SELECT restrictions on the table itself.
create or replace function find_my_spot(p_phone text)
returns table(id bigint, queue_position integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  select w.id into v_id from waitlist w where w.phone = p_phone limit 1;
  if v_id is null then
    return;
  end if;
  return query select v_id, get_queue_position(v_id);
end;
$$;
