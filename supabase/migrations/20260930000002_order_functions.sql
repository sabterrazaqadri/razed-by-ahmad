-- Order intent + gift spin logic.
--
-- These run inside Postgres as SECURITY DEFINER, so the anon key can call them
-- but cannot touch order_intents directly. The weekday is computed here from the
-- database clock in Asia/Karachi — the browser clock is never consulted, so
-- changing a laptop's date cannot unlock free delivery or a spin.

-- 0 = Sunday … 6 = Saturday, in Karachi time.
create or replace function public.karachi_dow()
returns int language sql stable set search_path = public as $$
  select extract(dow from (now() at time zone 'Asia/Karachi'))::int;
$$;

create or replace function public.gen_order_code(len int default 4)
returns text language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- no 0/O/1/I
  out text := 'RZ-';
begin
  for i in 1..len loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out;
end $$;

create or replace function public.create_order_intent(
  p_product_id uuid,
  p_variant_id uuid,
  p_qty int default 1
) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_product  public.products%rowtype;
  v_variant  public.product_variants%rowtype;
  v_settings public.site_settings%rowtype;
  v_dow      int := public.karachi_dow();
  v_code     text;
  v_free     boolean;
  v_spin     boolean;
  v_tries    int := 0;
begin
  if p_qty is null or p_qty < 1 or p_qty > 20 then
    raise exception 'invalid_qty' using errcode = '22023';
  end if;

  select * into v_variant from public.product_variants
   where id = p_variant_id and product_id = p_product_id;
  if not found then
    raise exception 'variant_not_found' using errcode = 'P0002';
  end if;

  select * into v_product from public.products where id = p_product_id and is_active;
  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;

  select * into v_settings from public.site_settings where id = 1;
  v_free := coalesce(v_settings.free_delivery_day = v_dow, false);
  v_spin := coalesce(v_settings.spinner_enabled and v_settings.spinner_day = v_dow, false);

  loop
    v_tries := v_tries + 1;
    -- 4 chars gives ~1M codes; widen if the space ever gets crowded
    v_code := public.gen_order_code(case when v_tries > 8 then 6 else 4 end);
    begin
      insert into public.order_intents
        (code, product_id, variant_id, product_name, size_ml, qty, unit_price,
         spin_eligible, free_delivery_applied)
      values
        (v_code, v_product.id, v_variant.id, v_product.name, v_variant.size_ml, p_qty,
         v_variant.price, v_spin, v_free);
      exit;
    exception when unique_violation then
      if v_tries >= 16 then raise; end if;
    end;
  end loop;

  return jsonb_build_object(
    'code', v_code,
    'product_name', v_product.name,
    'size_ml', v_variant.size_ml,
    'qty', p_qty,
    'unit_price', v_variant.price,
    'free_delivery_applied', v_free,
    'spin_eligible', v_spin,
    'whatsapp_number', v_settings.whatsapp_number
  );
end $$;

-- One spin per order intent. A repeat call returns the original prize.
create or replace function public.spin_order(p_code text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_intent public.order_intents%rowtype;
  v_prize  public.spin_prizes%rowtype;
  v_total  int;
  v_roll   numeric;
  v_acc    int := 0;
  r        record;
begin
  select * into v_intent from public.order_intents where code = upper(p_code) for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_intent.spin_used then
    select * into v_prize from public.spin_prizes where id = v_intent.spin_prize_id;
    return jsonb_build_object(
      'code', v_intent.code,
      'prize_id', v_intent.spin_prize_id,
      'label', coalesce(v_prize.label, v_intent.spin_prize_label),
      'short_label', v_prize.short_label,
      'repeat', true
    );
  end if;

  if not v_intent.spin_eligible then
    raise exception 'not_eligible' using errcode = '42501';
  end if;

  select coalesce(sum(weight), 0) into v_total
    from public.spin_prizes where is_active and weight > 0;
  if v_total = 0 then
    raise exception 'no_prizes' using errcode = 'P0002';
  end if;

  v_roll := random() * v_total;
  for r in
    select * from public.spin_prizes
     where is_active and weight > 0
     order by sort_order, id
  loop
    v_acc := v_acc + r.weight;
    if v_roll < v_acc then
      select * into v_prize from public.spin_prizes where id = r.id;
      exit;
    end if;
  end loop;

  update public.order_intents
     set spin_used = true, spin_prize_id = v_prize.id, spin_prize_label = v_prize.label
   where id = v_intent.id;

  return jsonb_build_object(
    'code', v_intent.code,
    'prize_id', v_prize.id,
    'label', v_prize.label,
    'short_label', v_prize.short_label,
    'repeat', false
  );
end $$;

-- Public, read-only view of one order intent by code (for /spin/[code]).
-- Exposes no personal data — the customer's details only ever live in WhatsApp.
create or replace function public.get_order_intent(p_code text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'code', o.code,
    'product_name', o.product_name,
    'size_ml', o.size_ml,
    'qty', o.qty,
    'unit_price', o.unit_price,
    'free_delivery_applied', o.free_delivery_applied,
    'spin_eligible', o.spin_eligible,
    'spin_used', o.spin_used,
    'prize_id', o.spin_prize_id,
    'prize_label', coalesce(p.label, o.spin_prize_label),
    'prize_short_label', p.short_label
  )
  from public.order_intents o
  left join public.spin_prizes p on p.id = o.spin_prize_id
  where o.code = upper(p_code);
$$;

revoke all on function public.karachi_dow() from public;
revoke all on function public.gen_order_code(int) from public, anon, authenticated;
revoke all on function public.create_order_intent(uuid, uuid, int) from public;
revoke all on function public.spin_order(text) from public;
revoke all on function public.get_order_intent(text) from public;

grant execute on function public.karachi_dow() to anon, authenticated;
grant execute on function public.create_order_intent(uuid, uuid, int) to anon, authenticated;
grant execute on function public.spin_order(text) to anon, authenticated;
grant execute on function public.get_order_intent(text) to anon, authenticated;
