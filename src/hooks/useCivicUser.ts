import { useUser as useCivicAuthUser } from "@civic/auth/react";

export function useCivicUser() {
  const { user } = useCivicAuthUser();
  return {
    user,
    isAuthenticated: !!user,
  };
} 