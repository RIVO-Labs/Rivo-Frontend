"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useEncryptionPublicKey, useSetEncryptionPublicKey } from "@/hooks/useRivoHub";
import { RiAlertLine, RiCheckLine } from "react-icons/ri";

export default function ProfilePage() {
  const { user, isProfileComplete } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { address } = useAccount();
  
  // Simplified hook usage for RIVO
  const setEncryptionKey = useSetEncryptionPublicKey();
  const { data: publishedKey } = useEncryptionPublicKey();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (user?.address) {
      const addressKey = user.address.toLowerCase();
      // Load saved profile data from localStorage
      const storedUserData =
        localStorage.getItem(`user_${addressKey}`) ?? localStorage.getItem(`user_${user.address}`);

      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setFormData({
            username: user.username || "",
            email: user.email || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
          });
        } catch (error) {
          console.error('Failed to parse user data:', error);
          setFormData({
            username: user.username || "",
            email: user.email || "",
            firstName: "",
            lastName: "",
          });
        }
      } else {
        setFormData({
          username: user.username || "",
          email: user.email || "",
          firstName: "",
          lastName: "",
        });
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.username) {
      toast({
        title: "Validation Error",
        description: "Email and username are required",
        variant: "destructive",
      });
      return;
    }

    // Validate username is not wallet address format
    if (formData.username.includes('0x') || formData.username.includes('...')) {
      toast({
        title: "Validation Error",
        description: "Please enter a proper username, not your wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      if (user?.address) {
        const userProfile = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: user.role,
          walletAddress: user.address,
          createdAt: new Date().toISOString(), // Will be overwritten if updating
          updatedAt: new Date().toISOString(),
        };

        const addressKey = user.address.toLowerCase();
        localStorage.setItem(`user_${addressKey}`, JSON.stringify(userProfile));

        toast({
          title: "Profile Updated!",
          description: "Your profile is saved. Share it from an agreement when needed.",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublishEncryptionKey = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Connect your wallet to publish your encryption key.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window === "undefined" || !window.ethereum?.request) {
      toast({
        title: "Wallet Unavailable",
        description: "Your wallet does not support encryption keys.",
        variant: "destructive",
      });
      return;
    }

    try {
      const publicKey = await window.ethereum.request({
        method: "eth_getEncryptionPublicKey",
        params: [address],
      });

      if (typeof publicKey !== "string") {
        throw new Error("Unexpected response from wallet.");
      }

      setEncryptionKey.mutate(publicKey);
    } catch (error) {
      toast({
        title: "Failed to Publish Key",
        description: error instanceof Error ? error.message : "Unable to publish encryption key.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Warning if profile incomplete */}
        {!isProfileComplete && (
          <Alert variant="destructive">
            <RiAlertLine className="h-4 w-4" />
            <AlertDescription>
              Your profile is incomplete. Please fill in all required fields to access all features.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">Encryption Public Key</p>
                  <p className="text-xs text-muted-foreground">
                    Publish your key so counterparts can decrypt profiles you share from agreements.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sharing happens per agreement to keep access scoped.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {publishedKey ? "Published" : "Not published"} — publish once, update only if you want to rotate the key.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePublishEncryptionKey}
                  disabled={setEncryptionKey.isLoading}
                >
                  {setEncryptionKey.isLoading
                    ? "Publishing..."
                    : publishedKey
                      ? "Update Encryption Key"
                      : "Publish Encryption Key"}
                </Button>
              </div>
              {/* Wallet Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Wallet Address:</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {user.address}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Role:</span>
                    <Badge variant="secondary">{user.role === 'freelancer' ? 'Freelancer' : 'Company'}</Badge>
                  </div>
                  {isProfileComplete && (
                    <div className="flex items-center gap-2 text-success">
                      <RiCheckLine className="h-4 w-4" />
                      <span className="text-xs">Profile Complete</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username (e.g., johndoe)"
                    value={formData.username}
                    onChange={handleChange('username')}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a unique username for your profile
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit">
                    {isProfileComplete ? "Update Profile" : "Complete Profile"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (user) {
                        setFormData({
                          username: user.username || "",
                          email: user.email || "",
                          firstName: "",
                          lastName: "",
                        });
                      }
                    }}
                  >
                    Reset Changes
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
