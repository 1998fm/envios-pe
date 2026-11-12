-- Catálogo integrado. Migración ADITIVA: no actualiza ni agrupa productos existentes.
-- Los IDs usados por ventas/compras/kardex siguen siendo productos.id.
begin;
create table if not exists public.productos_familias (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 nombre text not null check(length(trim(nombre)) between 1 and 200),
 descripcion text,
 precio_base numeric(10,2) not null default 0 check(precio_base>=0),
 imagen_url text,
 unidad text not null default 'unidad',
 opciones jsonb not null default '["Variante"]' check(jsonb_typeof(opciones)='array'),
 archivado boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default clock_timestamp()
);
create table if not exists public.producto_variantes (
 producto_id uuid primary key references public.productos(id) on delete cascade,
 familia_id uuid not null references public.productos_familias(id) on delete cascade,
 opciones jsonb not null check(jsonb_typeof(opciones)='object' and opciones<>'{}'),
 precio_especial boolean not null default false,
 nombre_especial boolean not null default false,
 descripcion_especial boolean not null default false,
 imagen_especial boolean not null default false,
 unique(familia_id, opciones) deferrable initially deferred
);
create index if not exists productos_familias_owner on public.productos_familias(profile_id,id);
create index if not exists producto_variantes_familia on public.producto_variantes(familia_id);
alter table public.productos_familias enable row level security;
alter table public.producto_variantes enable row level security;
revoke all on public.productos_familias, public.producto_variantes from anon,authenticated;
grant all on public.productos_familias, public.producto_variantes to service_role;

create or replace function public.marcar_variante_editada() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if current_setting('tori.familia_propagando',true)='1' then return new; end if;
 begin
  perform id from productos_familias where id in(select familia_id from producto_variantes where producto_id=new.id) for update nowait;
 exception when lock_not_available then raise exception 'La ficha se está editando. Vuelve a intentar' using errcode='40001'; end;
 update producto_variantes set
  precio_especial=precio_especial or new.precio_venta is distinct from old.precio_venta,
  nombre_especial=nombre_especial or new.nombre is distinct from old.nombre,
  descripcion_especial=descripcion_especial or new.descripcion is distinct from old.descripcion,
  imagen_especial=imagen_especial or new.imagen_url is distinct from old.imagen_url
 where producto_id=new.id;
 update productos_familias set updated_at=clock_timestamp() where id in(select familia_id from producto_variantes where producto_id=new.id);
 return new;
end $$;
drop trigger if exists producto_variante_edicion on public.productos;
create trigger producto_variante_edicion after update of nombre,descripcion,precio_venta,imagen_url,sku,stock_minimo,unidad,archivado,precio_compra on public.productos for each row execute function public.marcar_variante_editada();

create or replace function public.gestionar_producto_familia(
 p_owner uuid, p_accion text, p_familia uuid, p_esperado timestamptz,
 p_datos jsonb, p_variantes jsonb
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
 f productos_familias%rowtype; pr productos%rowtype; vi producto_variantes%rowtype;
 v jsonb; opciones_val jsonb; pid uuid; etiqueta text; nsku text; especial boolean;
 prev_setting text;
begin
 if p_owner is null or not exists(select 1 from profiles where id=p_owner) then raise exception 'Negocio no encontrado'; end if;
 if p_accion not in('crear','agrupar','guardar','desvincular','disolver') then raise exception 'Acción no válida'; end if;
 if jsonb_typeof(p_variantes)<>'array' or jsonb_array_length(p_variantes)>200 then raise exception 'Lista de variantes no válida'; end if;
 prev_setting:=coalesce(current_setting('tori.familia_propagando',true),'');
 perform set_config('tori.familia_propagando','1',true);
 if p_accion in('crear','agrupar') then
  if jsonb_array_length(p_variantes)<1 then raise exception 'Agrega al menos una variante'; end if;
  insert into productos_familias(profile_id,nombre,descripcion,precio_base,imagen_url,unidad,opciones)
  values(p_owner,trim(p_datos->>'nombre'),nullif(p_datos->>'descripcion',''),(p_datos->>'precio_base')::numeric,nullif(p_datos->>'imagen_url',''),coalesce(nullif(p_datos->>'unidad',''),'unidad'),p_datos->'opciones') returning * into f;
 else
  select * into f from productos_familias where id=p_familia and profile_id=p_owner for update;
  if not found then raise exception 'Producto principal no encontrado'; end if;
  if p_esperado is null or f.updated_at<>p_esperado then raise exception 'El producto cambió. Actualiza la ficha antes de guardar'; end if;
 end if;
 if p_accion='disolver' then
  delete from productos_familias where id=f.id;
  perform set_config('tori.familia_propagando',prev_setting,true); return f.id;
 end if;
 -- Bloquear en orden estable evita intercalar ventas o ajustes de una misma variante.
 perform p.id from productos p where p.id in(select producto_id from producto_variantes where familia_id=f.id) or (p_accion='agrupar' and p.id in(select (x->>'producto_id')::uuid from jsonb_array_elements(p_variantes) x)) order by p.id for update;
 if p_accion='desvincular' then
  for v in select value from jsonb_array_elements(p_variantes) loop
   if not exists(select 1 from producto_variantes pv join productos p on p.id=pv.producto_id where pv.producto_id=(v->>'producto_id')::uuid and pv.familia_id=f.id and p.profile_id=p_owner) then raise exception 'Variante no encontrada'; end if;
   delete from producto_variantes where producto_id=(v->>'producto_id')::uuid and familia_id=f.id;
  end loop;
  update productos_familias set updated_at=clock_timestamp() where id=f.id;
  perform set_config('tori.familia_propagando',prev_setting,true); return f.id;
 end if;
 if p_accion='guardar' then
  if p_datos->'opciones' is distinct from f.opciones then raise exception 'Las opciones de una ficha existente no se pueden cambiar'; end if;
  if (select count(*) from producto_variantes where familia_id=f.id) + (select count(*) from jsonb_array_elements(p_variantes) x where nullif(x->>'producto_id','') is null)>200 then raise exception 'Máximo 200 variantes por ficha'; end if;
  update productos_familias set nombre=trim(p_datos->>'nombre'),descripcion=nullif(p_datos->>'descripcion',''),precio_base=(p_datos->>'precio_base')::numeric,
    imagen_url=nullif(p_datos->>'imagen_url',''),unidad=coalesce(nullif(p_datos->>'unidad',''),'unidad'),opciones=p_datos->'opciones',updated_at=clock_timestamp()
  where id=f.id returning * into f;
 end if;
 if jsonb_array_length(f.opciones)<1 or jsonb_array_length(f.opciones)>3 then raise exception 'Define de una a tres opciones'; end if;
 for v in select value from jsonb_array_elements(p_variantes) loop
  opciones_val:=v->'opciones';
  if jsonb_typeof(opciones_val)<>'object' or (select count(*) from jsonb_object_keys(opciones_val))<>jsonb_array_length(f.opciones) then raise exception 'Completa las opciones de cada variante'; end if;
  etiqueta:='';
  for nsku in select jsonb_array_elements_text(f.opciones) loop
   if length(trim(coalesce(opciones_val->>nsku,''))) not between 1 and 100 then raise exception 'Valor de variante no válido'; end if;
   etiqueta:=etiqueta||case when etiqueta='' then '' else ' / ' end||trim(opciones_val->>nsku);
  end loop;
  if p_accion='agrupar' then
   select * into pr from productos where id=(v->>'producto_id')::uuid and profile_id=p_owner for update;
   if not found then raise exception 'Producto no encontrado en este negocio'; end if;
   if exists(select 1 from producto_variantes where producto_id=pr.id) then raise exception 'Un producto ya pertenece a otra ficha'; end if;
   -- Agrupar SOLO inserta la relación. No cambia productos, stocks ni históricos.
   insert into producto_variantes(producto_id,familia_id,opciones,precio_especial,nombre_especial,descripcion_especial,imagen_especial)
   values(pr.id,f.id,opciones_val,true,true,true,true);
   continue;
  end if;
  if nullif(v->>'producto_id','') is null then
   nsku:=nullif(trim(v->>'sku'),'');
   if nsku is not null and exists(select 1 from productos where profile_id=p_owner and lower(sku)=lower(nsku)) then raise exception 'El SKU ya está registrado'; end if;
   especial:=coalesce((v->>'precio_especial')::boolean,false);
   if coalesce((v->>'precio_venta')::numeric,f.precio_base)<0 or coalesce((v->>'precio_compra')::numeric,0)<0 or coalesce((v->>'stock_actual')::integer,0)<0 then raise exception 'Los importes y el stock deben ser positivos o cero'; end if;
   insert into productos(profile_id,nombre,sku,descripcion,precio_venta,precio_compra,stock_actual,stock_minimo,unidad,imagen_url,archivado)
   values(p_owner,f.nombre||' - '||etiqueta,nsku,f.descripcion,case when especial then (v->>'precio_venta')::numeric else f.precio_base end,coalesce((v->>'precio_compra')::numeric,0),0,coalesce((v->>'stock_minimo')::integer,0),f.unidad,coalesce(nullif(v->>'imagen_url',''),f.imagen_url),coalesce((v->>'archivado')::boolean,false)) returning id into pid;
   insert into producto_variantes(producto_id,familia_id,opciones,precio_especial,imagen_especial) values(pid,f.id,opciones_val,especial,nullif(v->>'imagen_url','') is not null);
   if coalesce((v->>'stock_actual')::integer,0)>0 then perform * from ajustar_stock(pid,(v->>'stock_actual')::integer,'Stock inicial'); end if;
  else
   pid:=(v->>'producto_id')::uuid;
   select * into vi from producto_variantes where producto_id=pid and familia_id=f.id;
   if not found then raise exception 'La variante no pertenece a este producto'; end if;
   select * into pr from productos where id=pid and profile_id=p_owner for update;
   if not found then raise exception 'Variante no encontrada en este negocio'; end if;
   update producto_variantes set opciones=opciones_val,
    precio_especial=coalesce((v->>'precio_especial')::boolean,precio_especial),
    nombre_especial=coalesce((v->>'nombre_especial')::boolean,nombre_especial),
    descripcion_especial=coalesce((v->>'descripcion_especial')::boolean,descripcion_especial),
    imagen_especial=coalesce((v->>'imagen_especial')::boolean,imagen_especial)
   where producto_id=pid returning * into vi;
   if v ? 'sku' and (nullif(v->>'sku','') is distinct from pr.sku) and nullif(v->>'sku','') is not null and exists(select 1 from productos where profile_id=p_owner and id<>pid and lower(sku)=lower(v->>'sku')) then raise exception 'El SKU ya está registrado'; end if;
   update productos set
    nombre=case when v ? 'nombre' then v->>'nombre' else nombre end,
    descripcion=case when v ? 'descripcion' then nullif(v->>'descripcion','') else descripcion end,
    precio_venta=case when v ? 'precio_venta' then (v->>'precio_venta')::numeric else precio_venta end,
    sku=case when v ? 'sku' then nullif(v->>'sku','') else sku end,
    imagen_url=case when v ? 'imagen_url' then nullif(v->>'imagen_url','') else imagen_url end,
    precio_compra=case when v ? 'precio_compra' then (v->>'precio_compra')::numeric else precio_compra end,
    stock_minimo=case when v ? 'stock_minimo' then (v->>'stock_minimo')::integer else stock_minimo end,
    archivado=case when v ? 'archivado' then (v->>'archivado')::boolean else archivado end,
    updated_at=clock_timestamp() where id=pid;
   if v ? 'stock_actual' then
    if (v->>'stock_esperado')::integer is distinct from pr.stock_actual then raise exception 'El stock cambió durante la edición. Actualiza la ficha'; end if;
    if length(trim(coalesce(v->>'motivo','')))<3 then raise exception 'Indica el motivo del ajuste de stock'; end if;
    if (v->>'stock_actual')::integer<0 then raise exception 'El stock no puede ser negativo'; end if;
    perform * from ajustar_stock(pid,(v->>'stock_actual')::integer,v->>'motivo');
    update productos set archivado=((v->>'stock_actual')::integer<=0) where id=pid;
   end if;
  end if;
 end loop;
 -- Campos heredados. Las excepciones permanecen hasta que el usuario las quite.
 update productos p set
  nombre=case when not pv.nombre_especial then f.nombre||' - '||(select string_agg(pv.opciones->>x.value,' / ' order by x.ordinality) from jsonb_array_elements_text(f.opciones) with ordinality x(value,ordinality)) else p.nombre end,
  descripcion=case when not pv.descripcion_especial then f.descripcion else p.descripcion end,
  precio_venta=case when not pv.precio_especial then f.precio_base else p.precio_venta end,
  imagen_url=case when not pv.imagen_especial then f.imagen_url else p.imagen_url end,
  updated_at=clock_timestamp()
 from producto_variantes pv where p.id=pv.producto_id and pv.familia_id=f.id and p.profile_id=p_owner and p_accion<>'agrupar';
 update productos_familias set updated_at=clock_timestamp() where id=f.id;
 perform set_config('tori.familia_propagando',prev_setting,true);
 return f.id;
end $$;
revoke all on function public.gestionar_producto_familia(uuid,text,uuid,timestamptz,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.gestionar_producto_familia(uuid,text,uuid,timestamptz,jsonb,jsonb) to service_role;
revoke all on function public.marcar_variante_editada() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
