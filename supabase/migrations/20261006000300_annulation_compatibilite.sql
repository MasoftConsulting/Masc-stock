-- =============================================================================
-- 1. Annulation d'un mouvement (contre-passation)
--
-- Un mouvement ne se supprime pas et ne se modifie pas : pour corriger une
-- erreur de saisie, on l'ANNULE. L'annulation crée un ajustement inverse,
-- lié à l'original dans les deux sens :
--   • original.annule_par      → l'ajustement d'annulation
--   • annulation.annulation_de → l'original
-- Le stock reste juste (les deux s'annulent) et l'historique garde la trace
-- de l'erreur et de son motif. Les synthèses (tableau de bord, fiches client)
-- ignorent les mouvements annulés et leurs annulations.
--
-- 2. Compatibilité imprimantes : texte libre sur le produit
--    (ex. « BP-70C31, BP-70C36 »).
-- =============================================================================

/* --------------------------------------------------------------- colonnes */

alter table public.mouvements
  add column annule_par    uuid unique references public.mouvements (id),
  add column annulation_de uuid unique references public.mouvements (id);

alter table public.produits
  add column compatibilite text;

/* ------------------------------------------- immuabilité (mise à jour) */

-- `annule_par` ne se renseigne qu'une fois (par annuler_mouvement) et ne
-- s'efface jamais ; `annulation_de` est fixé à la création.
create or replace function public.proteger_mouvement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.produit_id, new.type, new.quantite, new.date_mouvement, new.annulation_de)
     is distinct from
     (old.produit_id, old.type, old.quantite, old.date_mouvement, old.annulation_de) then
    raise exception 'Un mouvement ne se modifie pas : annulez-le puis ressaisissez-le.'
      using errcode = 'MS003';
  end if;

  if old.annule_par is not null and new.annule_par is distinct from old.annule_par then
    raise exception 'Ce mouvement est déjà annulé.' using errcode = 'MS004';
  end if;

  return new;
end;
$$;

/* ------------------------------------------------------------- annulation */

create function public.annuler_mouvement(p_id uuid, p_motif text)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_original    mouvements%rowtype;
  v_annulation  uuid;
  v_motif       text := nullif(trim(p_motif), '');
begin
  if v_motif is null then
    raise exception 'Indiquez le motif de l''annulation.' using errcode = '22023';
  end if;

  select * into v_original from mouvements where id = p_id for update;
  if not found then
    raise exception 'Mouvement introuvable.' using errcode = 'P0002';
  end if;
  if v_original.annule_par is not null then
    raise exception 'Ce mouvement est déjà annulé.' using errcode = 'MS004';
  end if;
  if v_original.annulation_de is not null then
    raise exception 'Une annulation ne s''annule pas : ressaisissez le mouvement.' using errcode = 'MS004';
  end if;

  -- Effet inverse sur le stock. Le trigger de stock refuse l'annulation si
  -- elle rendait le stock négatif (ex. annuler une entrée déjà ressortie).
  insert into mouvements (date_mouvement, produit_id, type, quantite, client_id, note, annulation_de)
  values (
    current_date,
    v_original.produit_id,
    'ajustement',
    case v_original.type when 'sortie' then v_original.quantite else -v_original.quantite end,
    v_original.client_id,
    'Annulation : ' || v_motif,
    v_original.id
  )
  returning id into v_annulation;

  update mouvements set annule_par = v_annulation where id = v_original.id;

  return v_annulation;
end;
$$;

/* ------------------------------------------- synthèses : hors annulations */

create or replace function public.resume_livraisons_clients(
  p_du date default null,
  p_au date default null
)
returns table (
  client_id          uuid,
  nb_livraisons      integer,
  unites             integer,
  nb_produits        integer,
  derniere_livraison date
)
language sql
stable
set search_path = public
as $$
  select
    m.client_id,
    count(*)::integer,
    sum(m.quantite)::integer,
    count(distinct m.produit_id)::integer,
    max(m.date_mouvement)
  from mouvements m
  where m.type = 'sortie'
    and m.annule_par is null
    and m.client_id is not null
    and (p_du is null or m.date_mouvement >= p_du)
    and (p_au is null or m.date_mouvement <= p_au)
  group by m.client_id;
$$;

create or replace function public.fiche_client(
  p_client_id uuid,
  p_du        date default null,
  p_au        date default null
)
returns table (
  produit_id          uuid,
  reference           text,
  nom                 text,
  categorie_nom       text,
  unites              integer,
  nb_livraisons       integer,
  premiere_livraison  date,
  derniere_livraison  date
)
language sql
stable
set search_path = public
as $$
  select
    p.id,
    p.reference,
    p.nom,
    c.nom,
    sum(m.quantite)::integer,
    count(*)::integer,
    min(m.date_mouvement),
    max(m.date_mouvement)
  from mouvements m
  join produits p on p.id = m.produit_id
  left join categories c on c.id = p.categorie_id
  where m.type = 'sortie'
    and m.annule_par is null
    and m.client_id = p_client_id
    and (p_du is null or m.date_mouvement >= p_du)
    and (p_au is null or m.date_mouvement <= p_au)
  group by p.id, p.reference, p.nom, c.nom
  order by sum(m.quantite) desc, p.reference;
$$;

create or replace function public.synthese_mouvements(
  p_du date default null,
  p_au date default null
)
returns table (
  type          text,
  nb_mouvements integer,
  unites        integer
)
language sql
stable
set search_path = public
as $$
  select
    m.type,
    count(*)::integer,
    sum(abs(m.quantite))::integer
  from mouvements m
  where m.annule_par is null
    and m.annulation_de is null
    and (p_du is null or m.date_mouvement >= p_du)
    and (p_au is null or m.date_mouvement <= p_au)
  group by m.type;
$$;

/* ------------------------------------------------------------------ droits */

revoke all on function public.annuler_mouvement(uuid, text) from public, anon, authenticated;
grant execute on function public.annuler_mouvement(uuid, text) to service_role;
