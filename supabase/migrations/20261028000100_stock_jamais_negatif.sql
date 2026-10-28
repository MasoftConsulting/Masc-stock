-- =============================================================================
-- Stock jamais négatif : rétablit le contrôle
--
-- La version de verifier_stock_mouvement() installée avec les bons de
-- livraison ne gardait que la règle de suppression : une sortie pouvait
-- rendre le stock négatif. On rétablit le contrôle d'origine (MS001) en
-- conservant l'assouplissement des BL : les mouvements liés à un BL
-- (bl_id renseigné) restent supprimables, ce qu'exigent modifier_bl_complet
-- et supprimer_bl_complet.
-- =============================================================================

-- Toute écriture qui fait baisser le stock verrouille d'abord la ligne
-- produit : deux sorties simultanées sur le même produit sont sérialisées,
-- la seconde voit le stock déjà diminué.
create or replace function stock.verifier_stock_mouvement()
returns trigger
language plpgsql
set search_path = stock
as $$
declare
  v_delta integer;
  v_stock integer;
begin
  if tg_op = 'INSERT' then
    v_delta := case new.type when 'sortie' then -new.quantite else new.quantite end;

    if v_delta < 0 then
      perform 1 from produits where id = new.produit_id for update;
      v_stock := stock_produit(new.produit_id);
      if v_stock + v_delta < 0 then
        raise exception 'Stock insuffisant : % disponible(s), % demandé(s).',
          v_stock, -v_delta
          using errcode = 'MS001';
      end if;
    end if;
    return new;
  end if;

  -- DELETE : entrées et sorties sont l'historique, on ne les efface pas,
  -- sauf celles d'un BL (modification ou suppression du bon).
  if old.type <> 'ajustement' and old.bl_id is null then
    raise exception 'Seuls les ajustements peuvent être supprimés. Les entrées et sorties sont conservées pour l''historique.'
      using errcode = 'MS002';
  end if;

  -- Supprimer un mouvement qui avait augmenté le stock le fait baisser.
  v_delta := case old.type when 'sortie' then old.quantite else -old.quantite end;
  if v_delta < 0 then
    perform 1 from produits where id = old.produit_id for update;
    v_stock := stock_produit(old.produit_id);
    if v_stock + v_delta < 0 then
      raise exception 'Suppression impossible : le stock deviendrait négatif (% disponible(s)).',
        v_stock
        using errcode = 'MS001';
    end if;
  end if;
  return old;
end;
$$;

revoke all on function stock.verifier_stock_mouvement() from public, anon, authenticated;
