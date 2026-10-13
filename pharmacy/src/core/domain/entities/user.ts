import { Role } from "../enums/role.enum";

export interface User {
  id: string;
  role: Role;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  facilityId?: string;
  createdAt: string;
}
