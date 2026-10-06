import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import { Logo } from "@/components/marque";
import { Formulaire } from "./formulaire";

export const dynamic = "force-dynamic";

export default async function PageConnexion() {
  const session = await lireSession();
  if (session) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="text-center">
        <div className="mx-auto flex justify-center">
          <Logo hauteur={90} priority />
        </div>
        <h1 className="mt-6 font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em]">
          MASC Stock
        </h1>
        <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">
          Saisissez votre code d&apos;accès pour continuer.
        </p>
      </div>

      <div className="mt-8">
        <Formulaire />
      </div>
    </main>
  );
}