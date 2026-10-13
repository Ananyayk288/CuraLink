import { AuthProvider, AuthSession } from "@/core/ports/auth-provider.port";
import { User } from "@/core/domain/entities/user";
import { Role } from "@/core/domain/enums/role.enum";
import { UnauthorizedError, ForbiddenError } from "@/core/domain/errors/domain-error";
import { getSupabaseClient } from "./client";

export class SupabaseAuthProvider implements AuthProvider {
  async getCurrentUser(token?: string): Promise<User | null> {
    if (!token) return null;
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;

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
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.username,
      password: credentials.password || "password123",
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedError("Invalid Supabase credentials.");
    }

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

  async signOut(token?: string): Promise<void> {
    const client = getSupabaseClient();
    await client.auth.signOut();
  }
}
