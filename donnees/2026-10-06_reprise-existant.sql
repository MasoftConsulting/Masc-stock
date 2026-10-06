-- =============================================================================
-- Reprise de l'existant — 06/10/2026
--
-- Sources :
--   • Inventarire_consommable_masoft.pdf  → stock MA SOFT (stock d'ouverture)
--   • inventaire_consommable.pdf          → consommables déjà chez UTB
--
-- Corrections validées :
--   • Couleurs Sharp : BP-GT70MA = magenta, BP-GT70YA = jaune (les fichiers
--     les inversaient). Les quantités restent attachées à la référence.
--   • BP-C50GT (×3 couleurs) → BP-C50GTM / BP-C50GTC / BP-C50GTY.
--   • « BPGT70MA » / « BPGT70YA » → BP-GT70MA / BP-GT70YA.
--   • Seuil d'alerte = 1 pour tous les produits.
--
-- À lancer UNE FOIS dans le SQL Editor de Supabase. Tout ou rien : la moindre
-- erreur annule l'ensemble. Le script refuse de tourner si des produits
-- existent déjà (évite les doublons en cas de double exécution).
-- =============================================================================

begin;

do $$
begin
  if exists (select 1 from produits) or exists (select 1 from mouvements) then
    raise exception 'Reprise annulée : des produits ou des mouvements existent déjà.';
  end if;
  if (select count(*) from clients where nom = 'UTB') <> 1 then
    raise exception 'Reprise annulée : client « UTB » introuvable (ou en double) dans masc-fiche.';
  end if;
end $$;

/* ------------------------------------------------------------- catégories */

insert into categories (nom, description) values
  ('Toners noirs',          null),
  ('Toners couleur',        'Cyan, magenta, jaune'),
  ('Tambours',              null),
  ('Développeurs',          null),
  ('Bacs de récupération',  'Bacs de toner usagé')
on conflict (nom) do nothing;

/* --------------------------------------------------------------- produits */

insert into produits (reference, nom, categorie_id, seuil_alerte)
select v.reference, v.nom, c.id, 1
from (values
  ('BP-GT700',  'Toner noir',          'Toners noirs'),
  ('BP-GT70BA', 'Toner noir',          'Toners noirs'),
  ('BP-GT70CA', 'Toner cyan',          'Toners couleur'),
  ('BP-GT70MA', 'Toner magenta',       'Toners couleur'),
  ('BP-GT70YA', 'Toner jaune',         'Toners couleur'),
  ('BP-C50GTC', 'Toner cyan',          'Toners couleur'),
  ('BP-C50GTM', 'Toner magenta',       'Toners couleur'),
  ('BP-C50GTY', 'Toner jaune',         'Toners couleur'),
  ('BP-DR70SA', 'Tambour',             'Tambours'),
  ('BP-GV700',  'Développeur noir',    'Développeurs'),
  ('BP-HB700',  'Bac de récupération', 'Bacs de récupération')
) as v (reference, nom, categorie)
join categories c on c.nom = v.categorie;

/* ------------------------------------- consommables déjà chez UTB (24/09) */

-- Ils ont été livrés avant MASC Stock : on les fait transiter par le stock
-- (ajustement +q puis sortie −q, effet nul sur le stock) pour qu'ils
-- apparaissent sur la fiche d'inventaire d'UTB.
create temporary table reprise_utb (reference text, quantite integer) on commit drop;
insert into reprise_utb values
  ('BP-GT700',  3),
  ('BP-GT70BA', 2),
  ('BP-GT70CA', 1),
  ('BP-GT70MA', 1),
  ('BP-GT70YA', 1),
  ('BP-C50GTC', 1),
  ('BP-C50GTM', 1),
  ('BP-C50GTY', 1);

insert into mouvements (date_mouvement, produit_id, type, quantite, note)
select '2026-09-24', p.id, 'ajustement', r.quantite,
       'Reprise de l''existant — consommable déjà chez UTB'
from reprise_utb r join produits p on p.reference = r.reference;

insert into mouvements (date_mouvement, produit_id, type, quantite, client_id, note)
select '2026-09-24', p.id, 'sortie', r.quantite,
       (select id from clients where nom = 'UTB'),
       'Reprise de l''existant'
from reprise_utb r join produits p on p.reference = r.reference;

/* ------------------------------------------ stock d'ouverture MA SOFT (06/10) */

insert into mouvements (date_mouvement, produit_id, type, quantite, note)
select '2026-10-06', p.id, 'ajustement', v.quantite, 'Stock d''ouverture'
from (values
  ('BP-GV700',  2),
  ('BP-HB700',  1),
  ('BP-GT700',  3),
  ('BP-GT70BA', 1),
  ('BP-GT70YA', 2),
  ('BP-GT70MA', 2),
  ('BP-GT70CA', 1),
  ('BP-DR70SA', 2)
) as v (reference, quantite)
join produits p on p.reference = v.reference;

/* ------------------------------------------------------------ contrôle */

-- Stock attendu après reprise ; l'écart doit être vide, sinon tout est annulé.
do $$
declare
  v_ecarts text;
begin
  select string_agg(format('%s : %s au lieu de %s', s.reference, s.quantite, a.attendu), ', ')
  into v_ecarts
  from stock_actuel s
  join (values
    ('BP-GV700', 2), ('BP-HB700', 1), ('BP-GT700', 3), ('BP-GT70BA', 1),
    ('BP-GT70YA', 2), ('BP-GT70MA', 2), ('BP-GT70CA', 1), ('BP-DR70SA', 2),
    ('BP-C50GTC', 0), ('BP-C50GTM', 0), ('BP-C50GTY', 0)
  ) as a (reference, attendu) on a.reference = s.reference
  where s.quantite <> a.attendu;

  if v_ecarts is not null then
    raise exception 'Reprise annulée, stock inattendu : %', v_ecarts;
  end if;
  if (select count(*) from produits) <> 11 then
    raise exception 'Reprise annulée : 11 produits attendus.';
  end if;
end $$;

commit;
