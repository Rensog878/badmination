"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MongoServerError } from "mongodb";
import { adminOrError, safeNext } from "@/lib/admin/guard";
import { toTournament, tournamentFormInput, tournamentFormSchema } from "@/lib/admin/tournamentSchema";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";
import { createUser, deleteUser, login, logout, type Role } from "@/lib/auth/session";
import { deleteTournament, findTournament, importSampleTournaments, saveTournament } from "@/lib/data/tournaments";
import { toggleCheckIn } from "@/lib/data/registrations";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: string };

const fieldErrorsOf = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.map(String).join(".")] ??= i.message;
  return out;
};

// ---------- auth ----------

export async function adminLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await login(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
  if (!result.ok) return { error: result.error };
  const fallback = result.user.role === "admin" ? "/admin" : "/";
  const next = safeNext(fd.get("next"), fallback);
  // Umpires may only be sent into the umpire console.
  redirect(result.user.role === "admin" || next.startsWith("/umpire/") ? next : fallback);
}

export async function adminLogout() {
  await logout();
  redirect("/admin/login");
}

// ---------- tournaments ----------

function revalidateTournament(slug: string) {
  revalidatePath("/");
  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/tournaments/${slug}/register`);
}

export async function saveTournamentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const parsed = tournamentFormSchema.safeParse(tournamentFormInput(fd));
  if (!parsed.success) return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const previousSlug = String(fd.get("previousSlug") ?? "") || undefined;
  const existing = previousSlug ? await findTournament(previousSlug) : undefined;
  if (!previousSlug && (await findTournament(parsed.data.slug))) {
    return { error: "A tournament with that URL slug already exists.", fieldErrors: { slug: "Already in use" } };
  }
  try {
    await saveTournament(toTournament(parsed.data, existing?.registered ?? 0), previousSlug);
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) return { fieldErrors: { slug: "Already in use" }, error: "That slug is taken." };
    throw e;
  }
  revalidateTournament(parsed.data.slug);
  if (previousSlug && previousSlug !== parsed.data.slug) revalidateTournament(previousSlug);
  redirect(`/admin/tournaments?saved=${encodeURIComponent(parsed.data.slug)}`);
}

export async function deleteTournamentAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const slug = String(fd.get("slug") ?? "");
  await deleteTournament(slug);
  revalidateTournament(slug);
  redirect("/admin/tournaments");
}

export async function importSamplesAction() {
  const auth = await adminOrError();
  if ("error" in auth) return;
  await importSampleTournaments();
  revalidatePath("/");
  redirect("/admin/tournaments");
}

// ---------- users ----------

export async function createUserAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const email = String(fd.get("email") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  const role = String(fd.get("role") ?? "") as Role;
  const password = String(fd.get("password") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email";
  if (name.length < 2) fieldErrors.name = "Enter a name";
  if (role !== "admin" && role !== "umpire") fieldErrors.role = "Choose a role";
  if (password.length < PASSWORD_MIN_LENGTH) fieldErrors.password = `At least ${PASSWORD_MIN_LENGTH} characters`;
  if (Object.keys(fieldErrors).length) return { fieldErrors, error: "Check the highlighted fields." };
  try {
    await createUser({ email, name, role, password });
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) return { fieldErrors: { email: "Already has an account" } };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: `Account created for ${email}.` };
}

export async function deleteUserAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const id = String(fd.get("id") ?? "");
  if (id === auth.user.id) return; // can't delete yourself
  await deleteUser(id);
  revalidatePath("/admin/users");
}

// ---------- morning tournament check-in desk ----------

export async function toggleCheckInAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const reference = String(fd.get("reference") ?? "");
  const targetState = fd.get("checkedIn") === "true";
  await toggleCheckIn(reference, targetState);
  revalidatePath("/admin/registrations");
}
