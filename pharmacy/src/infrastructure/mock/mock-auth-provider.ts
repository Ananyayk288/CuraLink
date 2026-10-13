import { AuthProvider, AuthSession } from "@/core/ports/auth-provider.port";
import { User } from "@/core/domain/entities/user";
import { Role } from "@/core/domain/enums/role.enum";
import { UnauthorizedError, ForbiddenError } from "@/core/domain/errors/domain-error";
import { SEED_USERS } from "./seed/mock-users.seed";

export class MockAuthProvider implements AuthProvider {
  private users: User[] = [...SEED_USERS];
  private sessions: Map<string, User> = new Map();

  constructor() {
    // Seed an initial default session for Pharmacist Rajiv
    const defaultPharmacist = this.users.find((u) => u.role === Role.PHARMACY);
    if (defaultPharmacist) {
      this.sessions.set("mock-token-rajiv", defaultPharmacist);
    }
  }

  async getCurrentUser(token?: string): Promise<User | null> {
    if (!token) {
      // Default to Rajiv in dev mode if no token provided
      const defaultPharmacist = this.users.find((u) => u.role === Role.PHARMACY);
      return defaultPharmacist || null;
    }
    return this.sessions.get(token) || null;
  }

  async validateRole(requiredRole: Role, token?: string): Promise<User> {
    const user = await this.getCurrentUser(token);
    if (!user) {
      throw new UnauthorizedError("Authentication required. Please sign in.");
    }
    if (user.role !== requiredRole && user.role !== Role.ADMIN) {
      throw new ForbiddenError(
        `Role "${user.role}" does not have permission to access ${requiredRole} resources.`
      );
    }
    return user;
  }

  async signIn(credentials: { username: string; password?: string }): Promise<AuthSession> {
    const usernameLower = credentials.username.toLowerCase();
    const user = this.users.find(
      (u) =>
        u.email?.toLowerCase().includes(usernameLower) ||
        u.fullName.toLowerCase().includes(usernameLower) ||
        (usernameLower === "pharmacy" && u.role === Role.PHARMACY) ||
        (usernameLower === "doctor" && u.role === Role.DOCTOR)
    );

    if (!user) {
      throw new UnauthorizedError(`User "${credentials.username}" not found.`);
    }

    const token = `mock-token-${user.id}-${Date.now()}`;
    this.sessions.set(token, user);

    return { user, token };
  }

  async signOut(token?: string): Promise<void> {
    if (token) {
      this.sessions.delete(token);
    }
  }
}
