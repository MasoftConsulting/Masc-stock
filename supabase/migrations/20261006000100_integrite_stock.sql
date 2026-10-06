-- =============================================================================
-- Intégrité du stock : la base garantit elle-même les règles métier, au lieu
-- de s'en remettre au code applicatif.
--
-- Ne touche qu'aux objets du stock. La seule interaction avec masc-fiche :
-- la suppression d'un client passe `mouvements.client_id` à NULL — le
-- trigger d'immuabilité ci-dessous l'autorise explicitement.
--
-- Si des données existantes violent une contrainte, toute la migration est
-- annulée (transaction) : rien n'est modifié.
-- =============================================================================

/* ------------------------------------------------------------ contraintes */

alter table public.mouvements
  add constraint mouvements_type_check
  check (type in ('entree', 'sortie', 'ajustement'));

-- Entrées et sorties : quantité strictement positive (le signe vient du type).
-- Ajustement : quantité signée, jamais nulle.
alter table public.mouvements
  add constraint mouvements_quantite_check
  check (
    (type in ('entree', 'sortie') and quantite > 0)
    or (type = 'ajustement' and quantite <> 0)
  );

alter table public.produits
  add constraint produits_seuil_alerte_check
  check (seuil_alerte >= 0);

-- Une catégorie utilisée ne peut plus être supprimée (avant : les produits
-- devenaient silencieusement « non classés »).
alter table public.produits
  drop constraint produits_categorie_id_fkey,
  add constraint produits_categorie_id_fkey
    foreign key (categorie_id) references public.categories (id)
    on delete restrict;

/* ------------------------------------------------------------ stock_actuel */

-- 1. Les produits désactivés gardent leur vrai stock (avant : absents de la
--    vue, donc affichés à 0). La colonne `actif` est ajoutée en fin de liste,
--    comme l'exige CREATE OR REPLACE VIEW.
-- 2. security_invoker : la vue respecte le RLS de l'appelant. Sans cela, elle
--    s'exécute avec les droits de son propriétaire et reste lisible avec la
--    clé `anon` publique.
create or replace view public.stock_actuel
with (security_invoker = true) as
select
  p.id,
  p.reference,
  p.nom,
  p.categorie_id,
  c.nom as categorie_nom,
  p.seuil_alerte,
  coalesce(sum(
    case m.type
      when 'entree'     then m.quantite
      when 'sortie'     then -m.quantite
      when 'ajustement' then m.quantite
      else 0
    end), 0::bigint)::integer as quantite,
  p.actif
from public.produits p
left join public.categories c on c.id = p.categorie_id
left join public.mouvements m on m.produit_id = p.id
group by p.id, c.nom;

/* ------------------------------------------------------- calcul du stock */

-- Stock courant d'un produit. Appelée après verrouillage de la ligne produit.
create function public.stock_produit(p_produit_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(
    case type
      when 'sortie' then -quantite
      else quantite
    end), 0)::integer
  from mouvements
  where produit_id = p_produit_id;
$$;

/* -------------------------------------------------- stock jamais négatif */

-- Toute écriture qui fait baisser le stock verrouille d'abord la ligne
-- produit : deux sorties simultanées sur le même produit sont sérialisées,
-- la seconde voit le stock déjà diminué.
create function public.verifier_stock_mouvement()
returns trigger
language plpgsql
set search_path = public
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

  -- DELETE : entrées et sorties sont l'historique, on ne les efface pas.
  if old.type <> 'ajustement' then
    raise exception 'Seuls les ajustements peuvent être supprimés. Les entrées et sorties sont conservées pour l''historique.'
      using errcode = 'MS002';
  end if;

  -- Supprimer un ajustement positif fait baisser le stock.
  if old.quantite > 0 then
    perform 1 from produits where id = old.produit_id for update;
    v_stock := stock_produit(old.produit_id);
    if v_stock - old.quantite < 0 then
      raise exception 'Suppression impossible : le stock deviendrait négatif (% disponible(s)).',
        v_stock
        using errcode = 'MS001';
    end if;
  end if;
  return old;
end;
$$;

create trigger mouvements_verifier_stock
  before insert or delete on public.mouvements
  for each row execute function public.verifier_stock_mouvement();

/* -------------------------------------------------- mouvements immuables */

-- Ce qui détermine le stock ne se modifie pas. Les champs descriptifs restent
-- modifiables — en particulier client_id, que masc-fiche passe à NULL quand
-- il supprime un client (ON DELETE SET NULL).
create function public.proteger_mouvement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.produit_id, new.type, new.quantite, new.date_mouvement)
     is distinct from
     (old.produit_id, old.type, old.quantite, old.date_mouvement) then
    raise exception 'Un mouvement ne se modifie pas : enregistrez un ajustement.'
      using errcode = 'MS003';
  end if;
  return new;
end;
$$;

create trigger mouvements_proteger
  before update on public.mouvements
  for each row execute function public.proteger_mouvement();

/* ------------------------------------------------- inventaire atomique */

-- Reçoit les quantités comptées, recalcule l'écart avec le stock RÉEL au
-- moment de la validation (et non celui affiché dans le navigateur), et crée
-- un ajustement par écart non nul. Tout ou rien.
--
-- p_comptes : [{"produit_id": "<uuid>", "compte": 12}, ...]
-- Retourne le nombre d'ajustements créés.
create function public.valider_inventaire(p_comptes jsonb, p_note text default null)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_ligne    jsonb;
  v_produit  uuid;
  v_compte   integer;
  v_stock    integer;
  v_nombre   integer := 0;
begin
  if jsonb_typeof(p_comptes) <> 'array' then
    raise exception 'Format de comptage invalide.' using errcode = '22023';
  end if;

  for v_ligne in select * from jsonb_array_elements(p_comptes) loop
    v_produit := (v_ligne ->> 'produit_id')::uuid;
    v_compte  := (v_ligne ->> 'compte')::integer;

    if v_compte is null or v_compte < 0 then
      raise exception 'Quantité comptée invalide.' using errcode = '22023';
    end if;

    perform 1 from produits where id = v_produit for update;
    if not found then
      raise exception 'Produit introuvable.' using errcode = '23503';
    end if;

    v_stock := stock_produit(v_produit);

    if v_compte <> v_stock then
      insert into mouvements (date_mouvement, produit_id, type, quantite, note)
      values (current_date, v_produit, 'ajustement', v_compte - v_stock,
              coalesce(nullif(trim(p_note), ''), 'Inventaire physique'));
      v_nombre := v_nombre + 1;
    end if;
  end loop;

  return v_nombre;
end;
$$;

/* ------------------------------------------------------------------ droits */

-- Par défaut, toute fonction de `public` est exécutable via /rest/v1/rpc par
-- les rôles `anon` et `authenticated`. Seul le serveur de l'app (service_role)
-- doit pouvoir les appeler.
revoke all on function public.stock_produit(uuid) from public, anon, authenticated;
revoke all on function public.valider_inventaire(jsonb, text) from public, anon, authenticated;
revoke all on function public.verifier_stock_mouvement() from public, anon, authenticated;
revoke all on function public.proteger_mouvement() from public, anon, authenticated;

grant execute on function public.stock_produit(uuid) to service_role;
grant execute on function public.valider_inventaire(jsonb, text) to service_role;
