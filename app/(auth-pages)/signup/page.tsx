"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { uploadEncryptedProfileToIPFS, isPinataConfigured } from "@/lib/ipfs/pinata";
import { storeWalletIPFSMapping, getWalletIPFSCID } from "@/lib/ipfs/storage";
import { encryptPassphraseForWallet } from "@/lib/ipfs/wallet-encryption";
import { generatePassphrase } from "@/lib/ipfs/encryption";
import {
  RiUserAddLine,
  RiSecurePaymentLine,
  RiShieldCheckLine,
  RiUserLine,
  RiMailLine,
  RiAccountCircleLine,
  RiStarFill,
  RiDashboardLine,
  RiCheckboxCircleLine,
  RiBriefcaseLine,
  RiTeamLine,
} from "react-icons/ri";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useDisconnect } from "wagmi";
import { useAuth } from "@/hooks/useAuth";

interface ProfileData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "sme_owner" | "vendor" | "staff";
}

export default function SignupPage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    role: "sme_owner",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { user, isProfileComplete, isLoading, refreshUser } = useAuth();

  // Pre-fill form if user already connected but profile incomplete
  useEffect(() => {
    if (isConnected && user && !isProfileComplete) {
      setProfileData({
        email: user.email || "",
        username: user.username || "",
        firstName: "",
        lastName: "",
        role: user.role || "sme_owner",
      });
    }
  }, [isConnected, user, isProfileComplete]);

  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.replace("/");
    }
  }, [isLoading, isConnected, router]);

  useEffect(() => {
    if (!isLoading && isConnected && isProfileComplete && !isSubmitting) {
      router.replace("/dashboard");
    }
  }, [isLoading, isConnected, isProfileComplete, isSubmitting, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!profileData.email || !profileData.username) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet before completing your profile.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const success = await saveUserProfile();

    if (success) {
      // Refresh user data to sync the newly created profile
      await refreshUser();

      // Redirect to dashboard - user is now logged in automatically
      router.push("/dashboard");
    }
  };

  const saveUserProfile = async (): Promise<boolean> => {
    if (!address) return false;

    // Check if wallet is already registered (check both IPFS and localStorage)
    const addressKey = address.toLowerCase();
    const existingIPFSCID = getWalletIPFSCID(address);
    const existingUserData =
      localStorage.getItem(`user_${addressKey}`) ?? localStorage.getItem(`user_${address}`);

    if (existingIPFSCID || existingUserData) {
      try {
        const existingUser = existingUserData ? JSON.parse(existingUserData) : null;

        // Wallet already has an account - show error and stay on signup page
        toast({
          title: "Wallet Already Registered",
          description: `This wallet is already registered to ${existingUser?.username || 'an account'}. Please disconnect and use a different wallet.`,
          variant: "destructive",
        });

        return false;
      } catch (error) {
        console.error('Failed to parse existing user data:', error);
      }
    }

    // Prepare profile data
    const userProfile = {
      username: profileData.username,
      email: profileData.email,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      role: profileData.role,
      walletAddress: address,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save locally first to avoid redirect loops if IPFS or wallet actions fail.
      localStorage.setItem(`user_${addressKey}`, JSON.stringify(userProfile));
      localStorage.setItem(`role_${addressKey}`, profileData.role);

      // Try to save to IPFS if Pinata is configured
      if (isPinataConfigured()) {
        toast({
          title: "Uploading to IPFS...",
          description: "Saving your profile to decentralized storage",
        });

        if (typeof window === "undefined" || !window.ethereum?.request) {
          throw new Error("Wallet does not support encryption keys.");
        }

        const publicKey = await window.ethereum.request({
          method: "eth_getEncryptionPublicKey",
          params: [address],
        });

        if (typeof publicKey !== "string") {
          throw new Error("Failed to get wallet encryption key.");
        }

        const passphrase = generatePassphrase();
        const encryptedPassphrase = encryptPassphraseForWallet(publicKey, passphrase);
        const ipfsCID = await uploadEncryptedProfileToIPFS(
          userProfile,
          passphrase,
          { [address.toLowerCase()]: encryptedPassphrase },
          [address.toLowerCase()],
        );

        // Store wallet to IPFS CID mapping (local) only.
        // Skip on-chain publish on signup to avoid immediate wallet payment prompt.
        storeWalletIPFSMapping(address, ipfsCID);

        console.log("Profile saved to IPFS with CID:", ipfsCID);

        toast({
          title: "Account Created!",
          description: `Welcome to Rivo! Profile saved to IPFS (CID: ${ipfsCID.slice(0, 8)}...). You can publish on-chain later.`,
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Welcome to Rivo! Your account has been created successfully.",
        });
      }

      return true;

    } catch (error) {
      console.error("Error saving profile:", error);

      toast({
        title: "Account Created (Offline Mode)",
        description: "Profile saved locally. IPFS upload failed but you can still use the app.",
        variant: "destructive",
      });

      return true; // Still return true as profile is saved locally
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-emerald-50/20 to-primary/5 relative overflow-hidden">
      {/* Background decorative icons */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 right-10 opacity-5"
      >
        <RiUserAddLine className="h-36 w-36 text-cyan-400" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360, scale: [1, 0.8, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-10 left-10 opacity-5"
      >
        <RiSecurePaymentLine className="h-32 w-32 text-primary" />
      </motion.div>

      <main className="flex-1 flex items-center justify-center py-12 relative z-10">
        <div className="container max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
              {/* Large icon header */}
              <div className="flex justify-center -mt-10 mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.9, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="bg-gradient-to-br from-primary to-cyan-400 p-6 rounded-full shadow-2xl"
                >
                  <RiUserAddLine className="h-20 w-20 text-white" />
                </motion.div>
              </div>

              {/* Rivo Logo */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="relative"
                >
                  <h1 className="text-7xl font-black bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent">
                    Rivo
                  </h1>
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2"
                  >
                    <RiStarFill className="h-5 w-5 text-yellow-400" />
                  </motion.div>
                </motion.div>
              </div>

              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                  <RiAccountCircleLine className="h-8 w-8 text-primary" />
                  Create Your Profile
                </CardTitle>
                <CardDescription className="text-base mt-3">
                  Tell us about yourself to get started
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-6">
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                      <RiMailLine className="h-4 w-4 text-primary" />
                      Email Address *
                    </Label>
                    <div className="relative">
                      <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="pl-10 h-11 border-2 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                      <RiUserLine className="h-4 w-4 text-primary" />
                      Username *
                    </Label>
                    <div className="relative">
                      <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Choose a username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        className="pl-10 h-11 border-2 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="h-11 border-2 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="h-11 border-2 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <RiBriefcaseLine className="h-4 w-4 text-primary" />
                      I am a *
                    </Label>
                    <RadioGroup
                      value={profileData.role}
                      onValueChange={(value: "sme_owner" | "vendor" | "staff") =>
                        setProfileData({ ...profileData, role: value })
                      }
                      className="grid grid-cols-3 gap-3"
                    >
                      <Label
                        htmlFor="sme_owner"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                      >
                        <RadioGroupItem value="sme_owner" id="sme_owner" className="sr-only" />
                        <RiBriefcaseLine className="mb-2 h-5 w-5" />
                        <span className="font-medium text-sm">SME Owner</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">Pay invoices & payroll</span>
                      </Label>
                      <Label
                        htmlFor="vendor"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                      >
                        <RadioGroupItem value="vendor" id="vendor" className="sr-only" />
                        <RiUserLine className="mb-2 h-5 w-5" />
                        <span className="font-medium text-sm">Vendor</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">Receive invoice payments</span>
                      </Label>
                      <Label
                        htmlFor="staff"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                      >
                        <RadioGroupItem value="staff" id="staff" className="sr-only" />
                        <RiTeamLine className="mb-2 h-5 w-5" />
                        <span className="font-medium text-sm">Staff/Agent</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">Receive payroll</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-400/90 text-white font-semibold text-base shadow-lg"
                    >
                      Complete Profile
                    </Button>
                  </motion.div>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                <div className="text-center">
                  {/* Temporarily disabled: login route is not used in current flow. */}
                  {/* <div className="text-sm text-gray-800 mb-4">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:text-cyan-400 font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <RiDashboardLine className="h-4 w-4" />
                      Sign In
                    </Link>
                  </div> */}

                  {/* Feature highlights */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-800 mt-4">
                    <div className="flex items-center gap-1">
                      <RiSecurePaymentLine className="h-4 w-4 text-primary" />
                      IDRX Payments
                    </div>
                    <div className="flex items-center gap-1">
                      <RiShieldCheckLine className="h-4 w-4 text-success" />
                      On-Chain Verified
                    </div>
                    <div className="flex items-center gap-1">
                      <RiDashboardLine className="h-4 w-4 text-primary" />
                      Batch Payroll
                    </div>
                    <div className="flex items-center gap-1">
                      <RiCheckboxCircleLine className="h-4 w-4 text-success" />
                      Instant Settlement
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
