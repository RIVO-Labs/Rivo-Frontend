"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useDisconnect } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import { fetchProfileFromIPFS, isPinataConfigured } from "@/lib/ipfs/pinata";
import { getWalletIPFSCID } from "@/lib/ipfs/storage";

interface User {
  id: string;
  address: string;
  username: string;
  email?: string;
  businessName?: string;
  businessCategory?: string;
  role: 'sme_owner' | 'vendor';
  roleSelected?: boolean;
  isProfileComplete?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = isConnected && !!user;

  const hasProfileBasics = !!(
    user?.email &&
    user?.username &&
    user?.username.length > 0 &&
    user?.businessName &&
    user?.businessCategory
  );

  // Check if profile is complete (has email, username, and selected role)
  const isProfileComplete = hasProfileBasics && !!user?.roleSelected;

  const syncWalletAuth = useCallback(async () => {
    if (isConnected && address) {
      const addressKey = address.toLowerCase();
      const storedRole = (localStorage.getItem(`role_${addressKey}`) ??
        localStorage.getItem(`role_${address}`)) as 'sme_owner' | 'vendor' | null;

      // Try to load from IPFS first if Pinata is configured
      if (isPinataConfigured()) {
        try {
          let ipfsCID = '';

          ipfsCID = getWalletIPFSCID(address) || '';

          if (ipfsCID) {
            console.log("Loading profile from IPFS:", ipfsCID);
            const ipfsData = await fetchProfileFromIPFS(ipfsCID, address, {
              allowDecrypt: false,
            });

            if (ipfsData) {
              const roleSelected = !!(ipfsData.role || storedRole);
              const isComplete = !!(
                ipfsData.email &&
                ipfsData.username &&
                ipfsData.businessName &&
                ipfsData.businessCategory &&
                roleSelected
              );

              setUser({
                id: address,
                address: address,
                username: ipfsData.username || '',
                email: ipfsData.email,
                businessName: ipfsData.businessName || '',
                businessCategory: ipfsData.businessCategory || '',
                role: ipfsData.role || storedRole || 'sme_owner',
                roleSelected,
                isProfileComplete: isComplete,
              });

              if (!isComplete) {
                toast({
                  title: "Profile Incomplete",
                  description: "Please complete your profile to access all features",
                  variant: "destructive",
                });
              }

              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error loading from IPFS, falling back to localStorage:", error);
        }
      }

      // Fallback to localStorage if IPFS fails or not configured
      const storedUserData =
        localStorage.getItem(`user_${addressKey}`) ?? localStorage.getItem(`user_${address}`);

      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          const roleSelected = !!(userData.role || storedRole);
          const isComplete = !!(
            userData.email &&
            userData.username &&
            userData.businessName &&
            userData.businessCategory &&
            roleSelected
          );

          setUser({
            id: address,
            address: address,
            username: userData.username || '',
            email: userData.email,
            businessName: userData.businessName || '',
            businessCategory: userData.businessCategory || '',
            role: userData.role || storedRole || 'sme_owner',
            roleSelected,
            isProfileComplete: isComplete,
          });

          if (!isComplete) {
            toast({
              title: "Profile Incomplete",
              description: "Please complete your profile to access all features",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          setUser({
            id: address,
            address: address,
            username: '',
            role: storedRole || 'sme_owner',
            roleSelected: !!storedRole,
            isProfileComplete: false,
          });

          toast({
            title: "Profile Incomplete",
            description: "Please complete your profile to access all features",
            variant: "destructive",
          });
        }
      } else {
        // New wallet, create basic user profile
        setUser({
          id: address,
          address: address,
          username: '',
          businessName: '',
          businessCategory: '',
          businessName: '',
          businessCategory: '',
          role: storedRole || 'sme_owner',
          roleSelected: !!storedRole,
          isProfileComplete: false,
        });

        toast({
          title: "Welcome!",
          description: "Please complete your profile to get started",
        });
      }

      setIsLoading(false);
    } else {
      // Wallet disconnected, clear user
      setUser(null);
      setIsLoading(false);
    }
  }, [isConnected, address, toast]);

  // Sync wallet connection with user state
  useEffect(() => {
    syncWalletAuth();
  }, [syncWalletAuth]);

  useEffect(() => {
    if (isLoading || !isConnected || !user) {
      return;
    }

    if (!user.roleSelected && pathname !== "/signup") {
      router.replace("/signup");
      return;
    }

    if (user.roleSelected && !hasProfileBasics && pathname !== "/dashboard/profile") {
      router.replace("/dashboard/profile");
    }
  }, [isLoading, isConnected, user, hasProfileBasics, pathname, router]);

  const logout = async () => {
    try {
      setIsLoading(true);

      // Disconnect wallet
      disconnect();

      // Clear user state
      setUser(null);

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });

      // Redirect to main page
      router.push("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear state even if disconnect fails
      setUser(null);

      toast({
        title: "Logged Out",
        description: "You have been logged out.",
      });

      // Redirect to main page even on error
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      isProfileComplete,
      logout,
      refreshUser: syncWalletAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
