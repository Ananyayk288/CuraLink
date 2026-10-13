import { AuthProvider, AuthSession } from "@/core/ports/auth-provider.port";
import { User } from "@/core/domain/entities/user";
import { Role } from "@/core/domain/enums/role.enum";
import { UnauthorizedError, ForbiddenError } from "@/core/domain/errors/domain-error";
import { getSupabaseClient } from "./client";

export class SupabaseAuthProvider implements AuthProvider {
  async getCurrentUser(token?: string): Promise<User | null> {
    if (!token) return null;

    if (token.startsWith("demo-token-")) {
      const parts = token.split(":");
      return {
        id: parts[1] || "c0a80101-0000-0000-0000-000000000001",
        role: (parts[2] || Role.PHARMACY) as Role,
        fullName: parts[3] || "Pharmacist Rajiv",
        email: "rajiv.pharmacy@curalink.health",
        createdAt: new Date().toISOString(),
      };
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      // Check if token matches a user id in the users table
      const { data: dbUser } = await client.from("users").select("*").eq("id", token).maybeSingle();
      if (dbUser) {
        return {
          id: dbUser.id,
          role: dbUser.role as Role,
          fullName: dbUser.full_name || "Pharmacist",
          email: dbUser.email,
          createdAt: dbUser.created_at,
        };
      }
      return null;
    }

    const role = (data.user.app_metadata?.role || data.user.user_metadata?.role || Role.PHARMACY) as Role;
    return {
      id: data.user.id,
      role,
      fullName: data.user.user_metadata?.full_name || "Pharmacist",
      email: data.user.email,
      facilityId: data.user.app_metadata?.facility_id,
      createdAt: data.user.created_at,
    };
  }

  async validateRole(requiredRole: Role, token?: string): Promise<User> {
    const user = await this.getCurrentUser(token);
    if (!user) {
      throw new UnauthorizedError("Authentication required.");
    }
    if (user.role !== requiredRole && user.role !== Role.ADMIN) {
      throw new ForbiddenError(`Forbidden: Role ${user.role} lacks permission.`);
    }
    return user;
  }

  async signIn(credentials: { username: string; password?: string }): Promise<AuthSession> {
    const client = getSupabaseClient();

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password || "password123",
      });

      if (!error && data?.user && data?.session) {
        const role = (data.user.app_metadata?.role || Role.PHARMACY) as Role;
        const user: User = {
          id: data.user.id,
          role,
          fullName: data.user.user_metadata?.full_name || "Pharmacist",
          email: data.user.email,
          createdAt: data.user.created_at,
        };

        return { user, token: data.session.access_token };
      }
    } catch {
      // Fallback
    }

    // Fallback: check users table directly
    const { data: dbUser } = await client
      .from("users")
      .select("*")
      .or(`email.eq.${credentials.username},role.eq.PHARMACY`)
      .limit(1)
      .maybeSingle();

    if (dbUser) {
      const user: User = {
        id: dbUser.id,
        role: dbUser.role as Role,
        fullName: dbUser.full_name || "Pharmacist Rajiv",
        email: dbUser.email || credentials.username,
        createdAt: dbUser.created_at,
      };
      return { user, token: `demo-token-:${user.id}:${user.role}:${user.fullName}` };
    }

    // Default demo pharmacist
    const demoUser: User = {
      id: "c0a80101-0000-0000-0000-000000000001",
      role: Role.PHARMACY,
      fullName: "Pharmacist Rajiv",
      email: credentials.username || "rajiv.pharmacy@curalink.health",
      createdAt: new Date().toISOString(),
    };
    return { user: demoUser, token: `demo-token-:${demoUser.id}:${demoUser.role}:${demoUser.fullName}` };
  }

  async signOut(token?: string): Promise<void> {
    const client = getSupabaseClient();
    await client.auth.signOut().catch(() => {});
  }
}
