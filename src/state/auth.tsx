import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthApi {
  configured: boolean;
  loading: boolean;
  user: User | null;
  username: string | null;
  signUp: (email: string, password: string, username: string) => Promise<AuthResult & { needsCode?: boolean }>;
  verifySignup: (email: string, code: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  sendResetCode: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
}

const Ctx = createContext<AuthApi | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
};

function dutch(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Ongeldig e-mailadres of wachtwoord.";
  if (m.includes("not confirmed")) return "Bevestig eerst je e-mailadres met de code uit je mail.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Dit e-mailadres heeft al een account.";
  if (m.includes("database error")) return "Deze gebruikersnaam is al bezet of ongeldig.";
  if (m.includes("password") && m.includes("characters")) return "Het wachtwoord moet minimaal 8 tekens bevatten.";
  if (m.includes("token") && (m.includes("expired") || m.includes("invalid"))) return "De code is onjuist of verlopen.";
  if (m.includes("rate limit") || m.includes("too many")) return "Te veel pogingen. Probeer het over een paar minuten opnieuw.";
  if (m.includes("network") || m.includes("fetch")) return "Geen verbinding. Controleer je internet.";
  return "Er ging iets mis. Probeer het opnieuw.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const wrap = useCallback(async (fn: () => Promise<{ error: { message: string } | null }>): Promise<AuthResult> => {
    if (!supabase) return { ok: false, error: "Accounts zijn nog niet ingesteld." };
    try {
      const { error } = await fn();
      return error ? { ok: false, error: dutch(error.message) } : { ok: true };
    } catch (e) {
      return { ok: false, error: dutch(String((e as Error)?.message ?? e)) };
    }
  }, []);

  const api = useMemo<AuthApi>(() => ({
    configured: !!supabase,
    loading,
    user,
    username: (user?.user_metadata?.username as string | undefined) ?? null,

    async signUp(email, password, username) {
      if (!supabase) return { ok: false, error: "Accounts zijn nog niet ingesteld." };
      const name = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,16}$/.test(name)) return { ok: false, error: "Gebruikersnaam: 3–16 letters, cijfers of _." };
      if (password.length < 8) return { ok: false, error: "Het wachtwoord moet minimaal 8 tekens bevatten." };
      try {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: name } } });
        if (error) return { ok: false, error: dutch(error.message) };
        // Supabase hides existing accounts: an empty identities list means the address is taken.
        if (data.user && data.user.identities?.length === 0) return { ok: false, error: "Dit e-mailadres heeft al een account." };
        return { ok: true, needsCode: !data.session };
      } catch (e) {
        return { ok: false, error: dutch(String((e as Error)?.message ?? e)) };
      }
    },
    verifySignup: (email, code) => wrap(() => supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "signup" })),
    signIn: (email, password) => wrap(() => supabase!.auth.signInWithPassword({ email: email.trim(), password })),
    async signOut() { await supabase?.auth.signOut(); },
    sendResetCode: (email) => wrap(() => supabase!.auth.resetPasswordForEmail(email.trim())),
    async resetPassword(email, code, newPassword) {
      if (newPassword.length < 8) return { ok: false, error: "Het wachtwoord moet minimaal 8 tekens bevatten." };
      const v = await wrap(() => supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" }));
      if (!v.ok) return v;
      return wrap(() => supabase!.auth.updateUser({ password: newPassword }));
    },
    async deleteAccount() {
      const r = await wrap(async () => supabase!.rpc("delete_my_account"));
      if (r.ok) await supabase?.auth.signOut();
      return r;
    },
  }), [loading, user, wrap]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
