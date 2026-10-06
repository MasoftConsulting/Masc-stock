-- =============================================================================
-- Synthèses pour le tableau de bord et les fiches client.
--
-- Les agrégats sont calculés par la base : l'API Supabase plafonne chaque
-- réponse à 1000 lignes, des totaux calculés côté app seraient silencieusement
-- faux dès que l'historique grossit.
--
-- Lecture seule. `clients` (masc-fiche) est seulement lue.
-- Pour toutes les fonctions : p_du / p_au inclus, NULL = pas de borne.
-- =============================================================================

/* ------------------------------------------------- livraisons par client */

-- Une ligne par client ayant reçu au moins une sortie sur la période.
create function public.resume_livraisons_clients(
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
    and m.client_id is not null
    and (p_du is null or m.date_mouvement >= p_du)
    and (p_au is null or m.date_mouvement <= p_au)
  group by m.client_id;
$$;

/* ------------------------------------------------------- fiche d'un client */

-- Consommables livrés à un client, un produit par ligne.
create function public.fiche_client(
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
    and m.client_id = p_client_id
    and (p_du is null or m.date_mouvement >= p_du)
    and (p_au is null or m.date_mouvement <= p_au)
  group by p.id, p.reference, p.nom, c.nom
  order by sum(m.quantite) desc, p.reference;
$$;

/* ------------------------------------------------- activité sur une période */

-- Nombre de mouvements et d'unités par type (tableau de bord).
create function public.synthese_mouvements(
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
  where (p_du is null or m.date_mouvement >= p_du)
    and (p_au is null or m.date_mouvement <= p_au)
  group by m.type;
$$;

/* ------------------------------------------------------------------ droits */

revoke all on function public.resume_livraisons_clients(date, date) from public, anon, authenticated;
revoke all on function public.fiche_client(uuid, date, date) from public, anon, authenticated;
revoke all on function public.synthese_mouvements(date, date) from public, anon, authenticated;

grant execute on function public.resume_livraisons_clients(date, date) to service_role;
grant execute on function public.fiche_client(uuid, date, date) to service_role;
grant execute on function public.synthese_mouvements(date, date) to service_role;
