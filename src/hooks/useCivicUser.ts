import { useUser as useCivicAuthUser } from "@civic/auth-web3/react";

export function useCivicUser() {
  const { user } = useCivicAuthUser();
  return {
    user,
    isAuthenticated: !!user,
  };
} 