"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  RiLoginCircleLine,
  RiSecurePaymentLine,
  RiShieldCheckLine,
  RiWalletLine,
  RiArrowRightLine,
  RiStarFill,
  RiDashboardLine,
} from "react-icons/ri";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { useWallet } from "@/hooks/useWallet";

export default function LoginPage() {
  // NOTE: Login route is currently unused in the main flow.
  const router = useRouter();
  const { isConnected } = useWallet();
  const { isProfileComplete, isAuthenticated } = useAuth();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (isConnected && isAuthenticated) {
      // Check if profile is complete
      if (!isProfileComplete) {
        // Redirect to profile page to complete profile
        router.push("/dashboard/profile");
      } else {
        // Profile complete, go to dashboard
        router.push("/dashboard");
      }
    }
  }, [isConnected, isAuthenticated, isProfileComplete, router]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-muted/20 to-primary/5 relative overflow-hidden">
      {/* Background decorative icons */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 left-20 opacity-5"
      >
        <RiSecurePaymentLine className="h-32 w-32 text-primary" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360, scale: [1, 0.9, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 right-20 opacity-5"
      >
        <RiDashboardLine className="h-40 w-40 text-emerald-500" />
      </motion.div>

      <main className="flex-1 flex items-center justify-center py-12 relative z-10">
        <div className="container max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
              {/* Large icon header */}
              <div className="flex justify-center -mt-8 mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-gradient-to-br from-primary to-cyan-400 p-6 rounded-full shadow-xl"
                >
                  <RiWalletLine className="h-16 w-16 text-white" />
                </motion.div>
              </div>

              {/* Rivo Logo */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative"
                >
                  <h1 className="text-6xl font-black bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent">
                    Rivo
                  </h1>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2"
                  >
                    <RiStarFill className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                </motion.div>
              </div>

              <CardHeader className="space-y-1 text-center pb-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                    <RiShieldCheckLine className="h-8 w-8 text-primary" />
                    Welcome to Rivo
                  </CardTitle>
                  <CardDescription className="text-base mt-2 flex items-center justify-center gap-2">
                    <RiSecurePaymentLine className="h-4 w-4 text-cyan-400" />
                    Connect your wallet to access programmable work agreements
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-3">
                    Powered by OnchainKit on Base
                  </p>
                </motion.div>
              </CardHeader>

              <CardContent className="px-8 pb-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ConnectWalletButton />
                    </motion.div>

                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Connect with OnchainKit to get started
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <RiShieldCheckLine className="h-3 w-3 text-success" />
                        Secure wallet authentication
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  className="w-full text-center"
                >
                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-800">
                    <div className="flex items-center gap-1">
                      <RiShieldCheckLine className="h-4 w-4 text-success" />
                      Secure & Decentralized
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <RiSecurePaymentLine className="h-4 w-4 text-primary" />
                      On-Chain Protected
                    </div>
                  </div>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
