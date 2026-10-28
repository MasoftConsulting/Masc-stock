-- =============================================================================
-- Schéma dédié `stock`
--
-- Les objets de la gestion de stock quittent `public` (partagé avec MASC Fiche)
-- pour un schéma `stock`. Restent dans `public` : clients, contacts,
-- equipements, journal (tables de MASC Fiche, lues ou alimentées ici) et
-- touch_updated_at (fonction de trigger commune).
--
-- ALTER … SET SCHEMA conserve les données, index, contraintes, triggers, RLS
-- et les liens par OID (FK, vue, valeurs par défaut des séquences). Seuls les
-- corps de fonctions, stockés en texte, sont réécrits.
--
-- Accès : service_role uniquement (l'application passe par la clé
-- service_role côté serveur). anon et authenticated n'ont plus aucun droit,
-- ce qui ferme aussi l'appel public aux fonctions *_bl_complet.
--
-- PRÉREQUIS : ajouter `stock` aux « Exposed schemas » de l'API
-- (Dashboard → Integrations → Data API → Settings).
-- =============================================================================

create schema if not exists stock;

-- ── Tables, vue, séquences ──────────────────────────────────────────────────
alter table public.categories            set schema stock;
alter table public.produits              set schema stock;
alter table public.mouvements            set schema stock;
alter table public.bons_livraison        set schema stock;
alter table public.bons_livraison_lignes set schema stock;
alter view  public.stock_actuel          set schema stock;
alter sequence public.bl_numero_seq      set schema stock;
alter sequence public.commande_seq       set schema stock;

-- ── Fonctions ───────────────────────────────────────────────────────────────
alter function public.stock_produit(uuid)                  set schema stock;
alter function public.valider_inventaire(jsonb, text)      set schema stock;
alter function public.annuler_mouvement(uuid, text)        set schema stock;
alter function public.proteger_mouvement()                 set schema stock;
alter function public.verifier_stock_mouvement()           set schema stock;
alter function public.resume_livraisons_clients(date, date) set schema stock;
alter function public.fiche_client(uuid, date, date)       set schema stock;
alter function public.synthese_mouvements(date, date)      set schema stock;
alter function public.creer_bl_complet(uuid, text, text, text, text, jsonb)          set schema stock;
alter function public.modifier_bl_complet(uuid, uuid, text, text, text, text, jsonb) set schema stock;
alter function public.supprimer_bl_complet(uuid)           set schema stock;

-- Fonctions à noms non qualifiés : il suffit de changer leur search_path.
alter function stock.stock_produit(uuid)                   set search_path = stock;
alter function stock.valider_inventaire(jsonb, text)       set search_path = stock;
alter function stock.annuler_mouvement(uuid, text)         set search_path = stock;
alter function stock.proteger_mouvement()                  set search_path = stock;
alter function stock.verifier_stock_mouvement()            set search_path = stock;
alter function stock.resume_livraisons_clients(date, date) set search_path = stock;
alter function stock.fiche_client(uuid, date, date)        set search_path = stock;
alter function stock.synthese_mouvements(date, date)       set search_path = stock;

-- Fonctions des bons de livraison : elles qualifiaient `public.` en dur.
-- Réécrites à l'identique avec `stock.` et un search_path vide (SECURITY
-- DEFINER).
create or replace function stock.creer_bl_complet(
  p_client_id uuid,
  p_contact_noms text,
  p_contact_details text,
  p_emis_par text,
  p_signature text,
  p_lignes jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bl_id uuid;
  v_ligne record;
begin
  insert into stock.bons_livraison (client_id, contact_noms, contact_details, emis_par, signature_client)
  values (p_client_id, p_contact_noms, p_contact_details, p_emis_par, p_signature)
  returning id into v_bl_id;

  for v_ligne in select * from jsonb_to_recordset(p_lignes) as x(produit_id uuid, quantite integer) loop
    insert into stock.bons_livraison_lignes (bl_id, produit_id, quantite)
    values (v_bl_id, v_ligne.produit_id, v_ligne.quantite);

    insert into stock.mouvements (produit_id, type, quantite, client_id, note, date_mouvement, bl_id)
    values (v_ligne.produit_id, 'sortie', v_ligne.quantite, p_client_id, 'Livraison BL', current_date, v_bl_id);
  end loop;

  return v_bl_id;
end;
$$;

create or replace function stock.modifier_bl_complet(
  p_bl_id uuid,
  p_client_id uuid,
  p_contact_noms text,
  p_contact_details text,
  p_emis_par text,
  p_signature text,
  p_lignes jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ligne record;
begin
  -- 1. Mise à jour de l'en-tête du BL
  update stock.bons_livraison
  set client_id = p_client_id,
      contact_noms = p_contact_noms,
      contact_details = p_contact_details,
      emis_par = p_emis_par,
      signature_client = p_signature,
      updated_at = now()
  where id = p_bl_id;

  -- 2. On supprime les anciens mouvements (cela remet automatiquement l'ancien stock)
  delete from stock.mouvements where bl_id = p_bl_id;

  -- 3. On supprime les anciennes lignes du BL
  delete from stock.bons_livraison_lignes where bl_id = p_bl_id;

  -- 4. On insère les nouvelles lignes et les nouveaux mouvements
  for v_ligne in select * from jsonb_to_recordset(p_lignes) as x(produit_id uuid, quantite integer) loop
    insert into stock.bons_livraison_lignes (bl_id, produit_id, quantite)
    values (p_bl_id, v_ligne.produit_id, v_ligne.quantite);

    insert into stock.mouvements (produit_id, type, quantite, client_id, note, date_mouvement, bl_id)
    values (v_ligne.produit_id, 'sortie', v_ligne.quantite, p_client_id, 'Livraison BL (modifiée)', current_date, p_bl_id);
  end loop;
end;
$$;

create or replace function stock.supprimer_bl_complet(p_bl_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from stock.mouvements where bl_id = p_bl_id;
  delete from stock.bons_livraison where id = p_bl_id;
end;
$$;

-- ── Droits ──────────────────────────────────────────────────────────────────
revoke all on schema stock from public, anon, authenticated;
revoke all on all tables    in schema stock from anon, authenticated;
revoke all on all sequences in schema stock from anon, authenticated;
revoke all on all functions in schema stock from public, anon, authenticated;

grant usage on schema stock to service_role;
grant all     on all tables    in schema stock to service_role;
grant all     on all sequences in schema stock to service_role;
grant execute on all functions in schema stock to service_role;

alter default privileges for role postgres in schema stock grant all on tables    to service_role;
alter default privileges for role postgres in schema stock grant all on sequences to service_role;
alter default privileges for role postgres in schema stock grant execute on functions to service_role;
alter default privileges for role postgres in schema stock revoke execute on functions from public;

-- Recharge le cache de schéma de l'API.
notify pgrst, 'reload schema';
