import { deleteUserAction } from "@/app/admin/actions";
import UserForm from "@/components/admin/UserForm";
import { getCurrentUser, listUsers } from "@/lib/auth/session";

export default async function AdminUsers() {
  const [users, me] = await Promise.all([listUsers(), getCurrentUser()]);
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">Users</h1>
      <ul className="mt-8 divide-y divide-off-white/10 border-y border-off-white/10">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-4 py-4">
            <span>
              <span className="font-semibold">{u.name}</span>
              <span className="ml-3 font-display text-xs tracking-[0.2em] text-court-green uppercase">{u.role}</span>
              <span className="block text-sm text-muted">{u.email}</span>
            </span>
            {u.id !== me?.id && (
              <form action={deleteUserAction}>
                <input type="hidden" name="id" value={u.id} />
                <button type="submit" aria-label={`Remove ${u.email}`} className="min-h-11 px-2 text-xs tracking-[0.18em] text-muted uppercase hover:text-off-white">
                  Remove
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <h2 className="mt-12 font-display text-xl font-bold uppercase">Add account</h2>
      <div className="mt-6">
        <UserForm />
      </div>
    </div>
  );
}
