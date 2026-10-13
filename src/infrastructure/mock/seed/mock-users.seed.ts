import { User } from "@/core/domain/entities/user";
import { Role } from "@/core/domain/enums/role.enum";

export const SEED_USERS: User[] = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    role: Role.PHARMACY,
    fullName: "Rajiv Sharma, R.Ph",
    phoneNumber: "+919876543210",
    email: "rajiv.pharmacy@curalink.health",
    facilityId: "fac-city-general",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    role: Role.DOCTOR,
    fullName: "Dr. Amit Sen, MD",
    phoneNumber: "+919876543211",
    email: "dr.amit@curalink.health",
    facilityId: "fac-city-general",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    role: Role.ADMIN,
    fullName: "Systems Administrator",
    phoneNumber: "+919876543212",
    email: "admin@curalink.health",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    role: Role.PATIENT,
    fullName: "Suresh Patil",
    phoneNumber: "+919876543213",
    createdAt: "2026-01-01T08:00:00Z",
  },
];
