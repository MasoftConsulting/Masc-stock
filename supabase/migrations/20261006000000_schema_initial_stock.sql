-- =============================================================================
-- Schéma initial du stock — état de la base AU 06/10/2026, avant toute
-- migration versionnée.
--
-- Ce fichier DOCUMENTE l'existant : il ne doit PAS être rejoué sur la base de
-- production (les objets existent déjà). On le marque comme appliqué avec :
--
--   npx supabase migration repair --status applied 20261006000000
--
-- La base est partagée avec masc-fiche. Ne figurent ici que les objets propres
-- au stock. `clients` et la fonction `touch_updated_at()` appartiennent à
-- masc-fiche et sont supposés exister.
-- =============================================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null unique,
  description text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_nom_idx on public.categories (nom);

create trigger categories_touch
  before update on public.categories
  for each row execute function touch_updated_at();

create table public.produits (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  nom          text not null,
  categorie_id uuid references public.categories (id) on delete set null,
  description  text,
  seuil_alerte integer not null default 0,
  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index produits_nom_idx on public.produits (nom);
create index produits_categorie_idx on public.produits (categorie_id);

create trigger produits_touch
  before update on public.produits
  for each row execute function touch_updated_at();

create table public.mouvements (
  id             uuid primary key default gen_random_uuid(),
  date_mouvement date not null default current_date,
  produit_id     uuid not null references public.produits (id) on delete restrict,
  type           text not null,
  quantite       integer not null,
  client_id      uuid references public.clients (id) on delete set null,
  fournisseur    text,
  note           text,
  created_at     timestamptz not null default now()
);

create index mouvements_produit_idx on public.mouvements (produit_id, date_mouvement desc);
create index mouvements_client_idx on public.mouvements (client_id, date_mouvement desc);
create index mouvements_date_idx on public.mouvements (date_mouvement desc);

alter table public.categories enable row level security;
alter table public.produits   enable row level security;
alter table public.mouvements enable row level security;

create view public.stock_actuel as
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
    end), 0::bigint)::integer as quantite
from public.produits p
left join public.categories c on c.id = p.categorie_id
left join public.mouvements m on m.produit_id = p.id
where p.actif = true
group by p.id, c.nom;
