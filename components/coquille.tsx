// src/components/coquille.tsx
import { redirect } from "next/navigation";
import { Navigation } from "./navigation";
import { lireSession } from "@/lib/session";
import { deconnexion } from "@/app/actions";

export async function Coquille({ children }: { children: React.ReactNode }) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  return (
    <>
      <Navigation deconnexion={deconnexion} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        {children}
      </main>
    </>
  );
}