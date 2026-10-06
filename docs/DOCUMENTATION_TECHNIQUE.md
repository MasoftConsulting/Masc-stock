# MASC Stock — Documentation technique

> Public : développeurs qui maintiennent ou font évoluer l'application.
> Pour l'installation, le déploiement et les procédures courantes, voir
> [DOCUMENTATION_EXPLOITATION.md](DOCUMENTATION_EXPLOITATION.md).

---

## 1. Vue d'ensemble

MASC Stock gère le stock de consommables d'imprimerie (toners, tambours,
développeurs, bacs de récupération) de MA SOFT CONSULTING et les livraisons
faites à ses clients.

| Aspect | Choix |
|---|---|
| Usage | Mono-utilisateur, interne, un seul code d'accès |
| Application | Next.js 16 (App Router), React 19, TypeScript |
| Interface | Tailwind CSS 4, polices Inter + Plus Jakarta Sans (`next/font`) |
| Données | Supabase (PostgreSQL), **projet partagé avec masc-fiche** |
| Validation | zod 4 |
| Session | Cookie JWT HS256 signé (`jose`) |
| Exports | PDF (`@react-pdf/renderer`), CSV |
| Hébergement | Vercel |

### Principe directeur

**Le stock n'est jamais saisi : il est calculé.** Chaque entrée, sortie ou
ajustement est un mouvement ; le stock d'un produit est la somme de ses
mouvements (vue `stock_actuel`). Les règles métier critiques (stock jamais
négatif, mouvements immuables, inventaire atomique) sont garanties **par la
base**, pas seulement par l'application.

> ⚠️ **Next.js 16 diffère des versions précédentes** (APIs, conventions).
> Avant de coder, lire la documentation fournie dans
> `node_modules/next/dist/docs/`. Exemples de différences rencontrées :
> `params` / `searchParams` sont des `Promise`, `error.tsx` reçoit `retry`
> (et non `reset`), le middleware s'appelle `proxy.ts`, helpers globaux
> `PageProps<"/route">` et `RouteContext<"/route">` (générés par
> `next typegen`).

---

## 2. Architecture

```
Navigateur
   │  (cookie masc_stock)
   ▼
proxy.ts ──────────── vérifie le JWT sur chaque requête (sauf /connexion)
   │
   ▼
app/(app)/layout.tsx  navigation + toasts, revérifie la session
   │
   ├── Pages (Server Components) ──► lib/*.ts (lectures) ──┐
   ├── Server Actions (actions.ts) ─► lib/action.ts        │
   │        session + zod ──────────► lib/*.ts (écritures) ├─► Supabase
   └── Route handlers (PDF / CSV) ──► lib/export/*  ───────┘   (service_role)
```

- **Aucun accès à la base depuis le navigateur.** Toutes les requêtes passent
  par le serveur avec la clé `service_role` (`lib/supabase.ts`, marqué
  `server-only`). La clé ne quitte jamais le serveur.
- Les tables ont le RLS activé **sans politique** : la clé publique `anon`
  (exposée par masc-fiche) ne lit ni n'écrit rien. Les fonctions SQL sont
  révoquées pour `anon` / `authenticated`.

---

## 3. Arborescence

```
app/
  layout.tsx              Racine : polices, métadonnées
  globals.css             Thème Tailwind (tokens), animations, classes .champ/.etiquette
  actions.ts              Connexion / déconnexion
  connexion/              Page publique de connexion
  (app)/                  Groupe des écrans connectés (n'apparaît pas dans l'URL)
    layout.tsx            Navigation + <Toasts />, garde de session
    loading.tsx           Squelette pendant le chargement
    error.tsx             « Données indisponibles » + Réessayer
    page.tsx              Tableau de bord
    produits/             Liste, création, édition, (dés)activation
    categories/           Idem pour les catégories
    mouvements/           Journal, entrée, sortie, annulation
      inventaire/         Inventaire physique
    clients/              Liste des clients + livraisons
      [id]/               Fiche d'inventaire client
        pdf/route.ts      Téléchargement PDF
        csv/route.ts      Téléchargement CSV
components/
  navigation.tsx          Barre flottante + menu mobile
  ui.tsx                  Briques : EnTetePage, Carte, Tableau, Tuile, Grille,
                          Indicateur, Bandeau, MessageErreur, Vide…
  vue.tsx                 Bascule Liste / Grille (useVue, BasculeVue)
  toasts.tsx              Confirmations éphémères (annoncer, useSuccesAction)
  selecteur-periode.tsx   Choix de période (dans l'URL)
  reveler.tsx             Apparition en CSS pur
  marque.tsx              Logo
lib/
  supabase.ts             Client serveur, echecLecture()
  session.ts              Code d'accès, JWT, cookie
  action.ts               actionFormulaire / actionSimple (session + zod)
  champs.ts               Schémas zod réutilisables (module pur)
  types-stock.ts          Types partagés + présentation (statutStock, natureMouvement)
  format.ts               formaterDate/Nombre, normaliser/correspond (recherche)
  periode.ts              Lecture des périodes d'URL (module pur)
  produits.ts | categories.ts | mouvements.ts | clients.ts | tableau-de-bord.ts
  export/                 fiche-client-pdf.tsx, fiche-client-csv.ts, telechargement.ts
supabase/migrations/      Schéma versionné (voir §5)
donnees/                  Scripts SQL de données ponctuels (reprise de l'existant)
proxy.ts                  Garde d'accès globale
```

**Règle d'import :** les Client Components n'importent que des modules sans
dépendance serveur (`lib/types-stock.ts`, `lib/format.ts`, `lib/periode.ts`,
`lib/champs.ts`). Les modules marqués `import "server-only"` font échouer le
build s'ils sont importés côté client.

---

## 4. Modèle de données

### 4.1 Tables du stock

**`categories`** — `id`, `nom` (unique), `description`, `actif`, `created_at`, `updated_at`

**`produits`**

| Colonne | Type | Notes |
|---|---|---|
| `reference` | text | unique (ex. `BP-GT70CA`) |
| `nom` | text | |
| `categorie_id` | uuid | FK `categories`, **ON DELETE RESTRICT** |
| `description` | text | |
| `compatibilite` | text | modèles d'imprimantes, texte libre |
| `seuil_alerte` | integer | `>= 0` ; stock `<=` seuil ⇒ « À commander » |
| `actif` | boolean | un produit désactivé reste dans l'historique |

**`mouvements`**

| Colonne | Type | Notes |
|---|---|---|
| `date_mouvement` | date | |
| `produit_id` | uuid | FK `produits`, ON DELETE RESTRICT |
| `type` | text | `entree` \| `sortie` \| `ajustement` (CHECK) |
| `quantite` | integer | entrée/sortie `> 0` ; ajustement signé `≠ 0` (CHECK) |
| `client_id` | uuid | FK `clients` (masc-fiche), ON DELETE SET NULL |
| `fournisseur`, `note` | text | |
| `annule_par` | uuid | renseigné si le mouvement a été annulé |
| `annulation_de` | uuid | renseigné si le mouvement **est** une annulation |

**Vue `stock_actuel`** (`security_invoker = true`) — un produit par ligne avec
`quantite` = Σ(entrées) − Σ(sorties) + Σ(ajustements). Inclut les produits
désactivés (colonne `actif`).

### 4.2 Tables de masc-fiche utilisées

`clients` est **lue seulement** (id, nom, contact, telephone, email, adresse).
Ne jamais modifier son schéma depuis ce projet. Autres tables présentes dans
la base et à ne pas toucher : `contacts`, `equipements`, `journal`,
`techniciens`, `fiches_intervention`, `codes_mfa`, `settings`, `print_points`.

### 4.3 Règles garanties par la base

| Règle | Mécanisme | Code d'erreur |
|---|---|---|
| Stock jamais négatif | Trigger `mouvements_verifier_stock` (BEFORE INSERT/DELETE), verrou `FOR UPDATE` sur le produit pour sérialiser les sorties concurrentes | `MS001` |
| Entrées/sorties non supprimables | même trigger | `MS002` |
| Champs déterminant le stock non modifiables | Trigger `mouvements_proteger` (BEFORE UPDATE) — autorise la mise à NULL de `client_id` (suppression d'un client dans masc-fiche) | `MS003` |
| Pas de double annulation | `annuler_mouvement` + trigger | `MS004` |
| Produit/catégorie utilisés non supprimables | FK ON DELETE RESTRICT | `23503` |
| Référence / nom de catégorie uniques | contraintes UNIQUE | `23505` |

Les messages des exceptions `MSxxx` sont rédigés en français pour être
affichés tels quels dans l'interface.

### 4.4 Fonctions SQL (RPC)

Toutes en `set search_path = public`, exécutables par `service_role` uniquement.

| Fonction | Rôle |
|---|---|
| `stock_produit(uuid)` | Stock courant d'un produit |
| `valider_inventaire(jsonb, text)` | Reçoit `[{produit_id, compte}]`, recalcule chaque écart contre le stock **réel** au moment de la validation, crée les ajustements. Atomique. Retourne le nombre d'ajustements |
| `annuler_mouvement(uuid, text)` | Crée l'ajustement inverse (motif obligatoire), lie original ↔ annulation |
| `resume_livraisons_clients(date, date)` | Par client : livraisons, unités, références, dernière livraison |
| `fiche_client(uuid, date, date)` | Consommables livrés à un client, un produit par ligne |
| `synthese_mouvements(date, date)` | Nombre et unités par type (tableau de bord) |

Les synthèses excluent les mouvements annulés et leurs annulations. Les
agrégats sont calculés en SQL car l'API Supabase plafonne chaque réponse à
1000 lignes : un calcul côté application serait faux sans avertissement.

---

## 5. Migrations

| Fichier | Contenu |
|---|---|
| `20260925114301_masc_fiche.sql` | Vide : aligne l'historique local sur une migration de masc-fiche (sans lui, `db push` refuse de tourner) |
| `20261006000000_schema_initial_stock.sql` | Documente l'état initial (marqué « appliqué », jamais rejoué) |
| `20261006000100_integrite_stock.sql` | CHECK, FK RESTRICT, triggers, `valider_inventaire`, vue `security_invoker` |
| `20261006000200_syntheses_clients.sql` | Fonctions de synthèse |
| `20261006000300_annulation_compatibilite.sql` | Annulation, `compatibilite` |

Créer une migration : `npx supabase migration new <nom>`, écrire le SQL,
vérifier avec `npx supabase db push --dry-run`. Procédure d'application :
voir la documentation d'exploitation.

**Ne jamais lancer `supabase db reset --linked`** : cela effacerait la base
de production partagée avec masc-fiche.

---

## 6. Sécurité

- **Authentification** — `lib/session.ts`. Un code unique (`CODE_STOCK`)
  comparé en temps constant (`timingSafeEqual`). Session : JWT HS256 signé
  avec `SESSION_SECRET` (≥ 32 caractères), cookie `masc_stock` httpOnly,
  `sameSite=lax`, `secure` en production, 30 jours.
- **Trois niveaux de contrôle** :
  1. `proxy.ts` vérifie le JWT sur chaque requête (sauf `/connexion` et les
     fichiers statiques) ;
  2. `app/(app)/layout.tsx` revérifie au premier rendu ;
  3. chaque Server Action passe par `lib/action.ts`, chaque route de
     téléchargement par `lib/export/telechargement.ts`, qui revérifient.
- **Validation** — toute entrée de formulaire passe par un schéma zod
  (`lib/champs.ts`). Le type d'un mouvement est fixé côté serveur
  (`creerEntreeAction` / `creerSortieAction`), jamais lu dans le formulaire.
- **Export CSV** — les cellules commençant par `= + - @` sont préfixées d'une
  apostrophe (injection de formules Excel), sauf numéros de téléphone.
- **Limites connues** — pas de limitation des tentatives de connexion ; la
  déconnexion supprime le cookie mais ne révoque pas un jeton copié (le seul
  moyen est de changer `SESSION_SECRET`).

---

## 7. Conventions de code

### 7.1 Lectures et erreurs

- Les fonctions `lister*` / `lire*` **lèvent** une erreur (`echecLecture`)
  au lieu de renvoyer `[]` : une panne s'affiche via `error.tsx`, jamais
  comme une liste vide.
- Les écritures renvoient `{ erreur }` pour les erreurs attendues (doublon,
  stock insuffisant…) : c'est la recommandation Next.js pour les Server
  Actions.

### 7.2 Server Actions

```ts
export const creerProduitAction = actionFormulaire(
  z.object({ reference: champ.texte("La référence est obligatoire."), ... }),
  async (d) => {
    const resultat = await creerProduit(d);
    if ("erreur" in resultat) return { erreur: resultat.erreur };
    revalidatePath("/produits");
    return { token: resultat.produit.id, message: "Produit créé." };
  },
);
```

- `actionFormulaire` (formulaires `useActionState`) : vérifie la session,
  valide, renvoie `EtatAction = { erreur?, token?, message? }`.
- `actionSimple` (boutons sans état) : redirige vers `/connexion` sans
  session ; résultat communiqué par `?erreur=` / `?supprime=1` dans l'URL.
- `token` change à chaque succès ; côté client,
  `useSuccesAction(etat, apres)` affiche `message` en toast et exécute
  `apres` (fermer un formulaire).

### 7.3 Interface

- Briques partagées dans `components/ui.tsx` ; ne pas recopier les classes
  des cartes.
- Vue Liste / Grille : `const [vue, setVue] = useVue("cle-page")` +
  `<BasculeVue>` ; préférence stockée dans `localStorage` (`vue:<cle>`).
- Recherche : toujours `correspond(normaliser(terme), ...champs)` (insensible
  aux accents, à la casse, aux tirets et espaces).
- Taille de texte minimale 0,75 rem ; `ink-faint` = `#6b6b6b` (contraste AA).
- `Reveler` est une animation CSS (`.reveler`), désactivée si
  `prefers-reduced-motion`.

### 7.4 Nommage

Le code est en français (fonctions, variables, composants), cohérent avec le
domaine métier : `listerProduitsComplet`, `creerSortieAction`,
`statutStock`…

---

## 8. Exports PDF et CSV

- Routes : `GET /clients/[id]/pdf?periode=…` et `/clients/[id]/csv?periode=…`.
- `lib/export/telechargement.ts` : session, période, fiche, nom de fichier
  ASCII (`fiche_<client>_<du>_<au>.pdf`), `Cache-Control: no-store`.
- PDF : page 1 signable (synthèse + cadres de signature), annexe avec le
  détail des livraisons. Police Helvetica intégrée : l'espace fine insécable
  (U+202F) et certains symboles (→) ne sont pas supportés — `nombre()`
  remplace les espaces de milliers.
- `@react-pdf/renderer` est externalisé par défaut par Next
  (`serverExternalPackages`) ; ne pas le faire bundler.
- Le détail des livraisons est limité à 1000 lignes (`LIMITE_DETAIL`) ; la
  synthèse par produit reste exacte.

---

## 9. Développement local

```bash
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit     # types
npm run lint         # ESLint
npm run build        # build de production
npx next typegen     # régénère PageProps / RouteContext après ajout de route
```

Variables requises dans `.env.local` : voir la documentation d'exploitation.

**Tester un module pur** (sans Next) : `npx tsx fichier.ts` fonctionne pour
`lib/format.ts`, `lib/periode.ts`, `lib/champs.ts`. Pour le PDF, bundler en
ESM avec esbuild (react-pdf n'expose que des exports ESM).

---

## 10. Limites connues et pistes

| Sujet | État |
|---|---|
| Journal des mouvements | 200 derniers chargés ; recherche et filtre côté client. Piste : filtres dans l'URL + pagination serveur |
| Connexion | Pas de limite de tentatives |
| Types de la base | Écrits à la main (`lib/types-stock.ts`). Piste : `supabase gen types` |
| Tests | Aucun test automatisé. Pistes : `statutStock`, `normaliser`, `lirePeriode`, export CSV |
| Imprimantes compatibles | Texte libre, non relié au parc `equipements` de masc-fiche |
