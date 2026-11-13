-- Instala la eliminación completa. Ejecutar este SQL no elimina ningún producto.
begin;
create or replace function public.eliminar_producto_familia(
 p_owner uuid, p_familia uuid, p_esperado timestamptz
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 f productos_familias%rowtype; ids uuid[]; fotos jsonb; cantidad integer;
begin
 select * into f from productos_familias where id=p_familia and profile_id=p_owner for update;
 if not found then raise exception 'Producto principal no encontrado'; end if;
 if p_esperado is null or f.updated_at<>p_esperado then
  raise exception 'El producto cambió. Actualiza la ficha antes de eliminar' using errcode='40001';
 end if;
 -- Mismo orden de bloqueos que la edición de fichas; todo se confirma o se revierte.
 perform p.id from productos p join producto_variantes v on v.producto_id=p.id
 where v.familia_id=f.id order by p.id for update of p;
 if exists(select 1 from producto_variantes v join productos p on p.id=v.producto_id
           where v.familia_id=f.id and p.profile_id<>p_owner) then
  raise exception 'La ficha contiene una variante de otro negocio';
 end if;
 select coalesce(array_agg(producto_id),array[]::uuid[]) into ids
 from producto_variantes where familia_id=f.id;
 select coalesce(jsonb_agg(distinct url),'[]'::jsonb) into fotos from (
  select imagen_url as url from productos where id=any(ids)
  union select f.imagen_url
 ) x where url is not null;
 -- Las FK conservan compras/ventas con su nombre e importes (producto_id pasa a NULL).
 -- El kardex de los productos eliminados se borra según su FK ON DELETE CASCADE.
 delete from productos where profile_id=p_owner and id=any(ids);
 get diagnostics cantidad=row_count;
 delete from productos_familias where id=f.id and profile_id=p_owner;
 return jsonb_build_object('eliminados',cantidad,'imagenes',fotos);
end $$;
revoke all on function public.eliminar_producto_familia(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.eliminar_producto_familia(uuid,uuid,timestamptz) to service_role;
notify pgrst,'reload schema';
commit;
