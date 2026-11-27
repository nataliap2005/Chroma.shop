create table public.profiles(id uuid primary key references auth.users on delete cascade, name text not null default '', avatar text, beauty jsonb);
create table public.admins(id uuid primary key references auth.users on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admins where id=auth.uid()) $$;
create table public.products(id text primary key,nombre text not null,marca text not null,categoria text not null,tono text not null,color_hex text not null default '#DAB39A',precio_cop integer not null check(precio_cop>0),imagen text,swatch_image text,descripcion text,estacion text,subtono text,profundidad text,acabado text,tipos_piel text,nivel text,calidad text,panes text,stock integer not null default 0 check(stock>=0),active boolean not null default true);
create table public.orders(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,created_at timestamptz not null default now(),address text not null,status text not null default 'Confirmado' check(status in ('Confirmado','En preparación','Enviado','Entregado')),total bigint not null,shipping integer not null default 9900);
create table public.order_items(id bigint generated always as identity primary key,order_id uuid references public.orders on delete cascade,product_id text references public.products,nombre text not null,tono text not null,quantity integer not null check(quantity>0),price integer not null);
create table public.favorites(user_id uuid references auth.users on delete cascade,product_id text references public.products,primary key(user_id,product_id));
create table public.stores(id bigint generated always as identity primary key,name text not null,address text not null,lat double precision not null,lng double precision not null);
alter table public.profiles enable row level security; alter table public.admins enable row level security; alter table public.products enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.favorites enable row level security; alter table public.stores enable row level security;
create policy own_profile on public.profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy product_read on public.products for select using(active or public.is_admin());
create policy product_admin on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy order_read on public.orders for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy item_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy own_favorites on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy store_read on public.stores for select using(true);
create function public.checkout(items jsonb, delivery_address text) returns uuid language plpgsql security definer set search_path=public as $$
declare oid uuid; r record; p public.products%rowtype; total_amount bigint:=9900;
begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 if length(trim(coalesce(delivery_address,'')))<5 or jsonb_typeof(items)<>'array' or jsonb_array_length(items)=0 or jsonb_array_length(items)>100 then raise exception 'Pedido inválido'; end if;
 insert into public.orders(user_id,address,total) values(auth.uid(),trim(delivery_address),0) returning id into oid;
 for r in select x.id,sum(x.quantity)::integer as quantity from jsonb_to_recordset(items) x(id text,quantity integer) group by x.id order by x.id loop
 if r.quantity is null or r.quantity<1 or r.quantity>99 then raise exception 'Cantidad inválida'; end if;
 select * into p from public.products where id=r.id and active for update;
 if not found or p.stock<r.quantity then raise exception 'Stock insuficiente: %',r.id; end if;
 update public.products set stock=stock-r.quantity where id=p.id;
 insert into public.order_items(order_id,product_id,nombre,tono,quantity,price) values(oid,p.id,p.nombre,p.tono,r.quantity,p.precio_cop);
 total_amount:=total_amount+p.precio_cop::bigint*r.quantity;
 end loop;
 update public.orders set total=total_amount where id=oid; return oid;
end $$;
revoke all on function public.checkout(jsonb,text) from public; grant execute on function public.checkout(jsonb,text) to authenticated;
create function public.advance_order(oid uuid,new_status text) returns void language plpgsql security definer set search_path=public as $$ begin if not public.is_admin() then raise exception 'No autorizado'; end if; update public.orders set status=new_status where id=oid and (status,new_status) in (('Confirmado','En preparación'),('En preparación','Enviado'),('Enviado','Entregado')); if not found then raise exception 'Transición inválida'; end if; end $$;
revoke all on function public.advance_order(uuid,text) from public; grant execute on function public.advance_order(uuid,text) to authenticated;
alter publication supabase_realtime add table public.products,public.orders;
insert into storage.buckets(id,name,public) values('shop-avatars','shop-avatars',false);
create policy avatar_own on storage.objects for all to authenticated using(bucket_id='shop-avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='shop-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
-- Puntos ficticios para probar GPS; sustituir por sucursales verificadas.
insert into public.stores(name,address,lat,lng) values('Chroma Shop Norte (demo)','Cali, punto de demostración',3.475,-76.525),('Chroma Shop Sur (demo)','Cali, punto de demostración',3.375,-76.535);
