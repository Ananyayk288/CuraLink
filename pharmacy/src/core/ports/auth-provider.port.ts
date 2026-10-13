import { User } from "../domain/entities/user";
import { Role } from "../domain/enums/role.enum";

export interface AuthSession {
  user: User;
  token: string;
}

export interface AuthProvider {
  getCurrentUser(token?: string): Promise<User | null>;
  validateRole(requiredRole: Role, token?: string): Promise<User>;
  signIn(credentials: { username: string; password?: string }): Promise<AuthSession>;
  signOut(token?: string): Promise<void>;
}
