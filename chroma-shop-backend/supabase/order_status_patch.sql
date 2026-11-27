-- Atomic transition with administrator authorization and previous-state check.
CREATE OR REPLACE FUNCTION public.change_order_status(
    oid uuid, new_status text, expected_status text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    old_status text;
    owner_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    SELECT status, user_id INTO old_status, owner_id
    FROM public.orders WHERE id = oid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pedido inexistente'; END IF;
    IF expected_status IS NOT NULL AND old_status <> expected_status THEN
        RAISE EXCEPTION 'Estado desactualizado';
    END IF;
    IF new_status IS NULL OR (old_status, new_status) NOT IN (
        ('Confirmado', 'En preparación'), ('En preparación', 'Enviado'),
        ('Enviado', 'Entregado'), ('Entregado', 'Enviado'),
        ('Enviado', 'En preparación'), ('En preparación', 'Confirmado')
    ) THEN RAISE EXCEPTION 'Transición inválida'; END IF;
    UPDATE public.orders SET status = new_status WHERE id = oid;
    RETURN jsonb_build_object('previous_status', old_status, 'user_id', owner_id);
END;
$$;
REVOKE ALL ON FUNCTION public.change_order_status(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_order_status(uuid,text,text) TO authenticated;
