import "server-only";
import { createAdminClient } from "./supabase";
import type { Client } from "./types-stock";

export type { Client };

const TABLE = "clients";

/* ---------------------------------------------------------------- lecture */

export async function listerClients(): Promise<Client[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(TABLE).select("*").order("nom");
  if (error) {
    console.error("[clients] listerClients", error.message);
    return [];
  }
  return (data ?? []) as Client[];
}

export async function lireClient(id: string): Promise<Client | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[clients] lireClient", error.message);
    return null;
  }
  return (data as Client) ?? null;
}