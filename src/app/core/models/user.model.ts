export interface BranchSummary {
  id: string;
  name: string;
  code?: string;
  isPlant?: boolean;
  isCentral?: boolean;
}

export interface Permission {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

export interface Role {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  isSuperAdmin: boolean;
  permissions: Permission[];
}

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  lastLogin: string;
  emailVerified: boolean;
  roles: Role[];
  permissions: Permission[];
  branch?: BranchSummary | null;
}