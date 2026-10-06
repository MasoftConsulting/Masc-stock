import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Toasts } from "@/components/toasts";
import { lireSession } from "@/lib/session";
import { deconnexion } from "@/app/actions";

/**
 * Enveloppe des écrans connectés : barre flottante + colonne centrale.
 *
 * Le layout ne se re-rend pas à chaque navigation : la vraie garde d'accès
 * est le proxy (chaque requête) et `lib/action.ts` (chaque action). Cette
 * vérification n'est qu'une sécurité supplémentaire au premier affichage.
 */
export default async function LayoutApplication({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await lireSession())) redirect("/connexion");

  return (
    <>
      <Navigation deconnexion={deconnexion} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">{children}</main>
      <Toasts />
    </>
  );
}
