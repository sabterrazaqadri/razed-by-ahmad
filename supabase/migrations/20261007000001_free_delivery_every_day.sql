-- Free delivery every day.
--
-- Replaces create_order_intent so every order gets free_delivery_applied = true,
-- regardless of site_settings.free_delivery_day (kept only for compatibility).
-- CREATE OR REPLACE keeps the existing grants.

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
  v_free := true; -- free delivery runs every day
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
