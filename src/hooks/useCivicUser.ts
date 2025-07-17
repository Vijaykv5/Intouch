import { useUser as useCivicAuthUser } from "@civic/auth-web3/react";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  wallet_address?: string;
  created_at: string;
}

interface CivicUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  wallet_address?: string;
}

export function useCivicUser() {
  const { user, solana } = useCivicAuthUser();
  console.log("user-",user)
  console.log("solana-",solana)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createOrGetUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Check if user profile already exists by email
        const { data: existingProfile, error: fetchError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("email", user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Error fetching user profile:", fetchError);
          toast.error("Failed to load user profile");
          return;
        }

        if (existingProfile) {
          // User profile exists, update it with latest Civic data
          const updateData: Partial<UserProfile> = {
            name: user.name || user.email?.split('@')[0] || 'User',
            profile_image: user.picture || undefined,
          };

          const { data: updatedProfile, error: updateError } = await supabase
            .from("user_profiles")
            .update(updateData)
            .eq("id", existingProfile.id)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating user profile:", updateError);
            toast.error("Failed to update user profile");
            return;
          }

          setUserProfile(updatedProfile);
        } else {
          // Create new user profile with simplified data structure
          const newProfileData = {
            name: user.name || user.email?.split('@')[0] || 'User',
            email: user.email,
            profile_image: user.picture || null,
            wallet_address: null, // Will be updated when wallet is connected
          };

          const { data: newProfile, error: createError } = await supabase
            .from("user_profiles")
            .insert([newProfileData])
            .select()
            .single();

          if (createError) {
            console.error("Error creating user profile:", createError);
            toast.error("Failed to create user profile");
            return;
          }

          setUserProfile(newProfile);
          toast.success("Profile created successfully!");
        }
      } catch (error) {
        console.error("Error in createOrGetUserProfile:", error);
        toast.error("Failed to process user profile");
      } finally {
        setIsLoading(false);
      }
    };

    createOrGetUserProfile();
  }, [user]);

  // Effect to update wallet address when it becomes available from Civic context
  useEffect(() => {
    const updateWalletAddressFromContext = async () => {
      if (!userProfile || !solana?.address) return;

      // Only update if the wallet address is different from what's stored
      if (userProfile.wallet_address !== solana.address) {
        try {
          const { data: updatedProfile, error } = await supabase
            .from("user_profiles")
            .update({
              wallet_address: solana.address,
            })
            .eq("id", userProfile.id)
            .select()
            .single();

          if (error) {
            console.error("Error updating wallet address from context:", error);
            return;
          }

          setUserProfile(updatedProfile);
          console.log("Wallet address updated from Civic context:", solana.address);
        } catch (error) {
          console.error("Error in updateWalletAddressFromContext:", error);
        }
      }
    };

    updateWalletAddressFromContext();
  }, [userProfile, solana?.address]);

  // Function to update user profile with additional data
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    try {
      const { data: updatedProfile, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", userProfile.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        toast.error("Failed to update profile");
        return;
      }

      setUserProfile(updatedProfile);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      toast.error("Failed to update profile");
    }
  };

  // Function to update wallet address when wallet is connected
  const updateWalletAddress = async (walletAddress: string) => {
    if (!userProfile) return;

    try {
      const { data: updatedProfile, error } = await supabase
        .from("user_profiles")
        .update({
          wallet_address: walletAddress,
        })
        .eq("id", userProfile.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating wallet address:", error);
        return;
      }

      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error in updateWalletAddress:", error);
    }
  };

  return {
    user,
    userProfile,
    isAuthenticated: !!user,
    isLoading,
    updateUserProfile,
    updateWalletAddress,
  };
} 