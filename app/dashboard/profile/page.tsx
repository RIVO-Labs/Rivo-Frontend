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
import { RiAlertLine, RiCheckLine } from "react-icons/ri";

export default function ProfilePage() {
  const { user, isProfileComplete } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    businessName: "",
    businessCategory: "",
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
            businessName: userData.businessName || "",
            businessCategory: userData.businessCategory || "",
          });
        } catch (error) {
          console.error('Failed to parse user data:', error);
          setFormData({
            username: user.username || "",
            email: user.email || "",
            firstName: "",
            lastName: "",
            businessName: "",
            businessCategory: "",
          });
        }
      } else {
        setFormData({
          username: user.username || "",
          email: user.email || "",
          firstName: "",
          lastName: "",
          businessName: "",
          businessCategory: "",
        });
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.username || !formData.businessName || !formData.businessCategory) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
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
          businessName: formData.businessName,
          businessCategory: formData.businessCategory,
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
                    <Badge variant="secondary">{user.role === 'sme_owner' ? 'Business Owner' : 'Vendor'}</Badge>
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
                    Contact Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Full name of contact person"
                    value={formData.username}
                    onChange={handleChange('username')}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as the primary contact on agreements
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      {user?.role === "sme_owner" ? "Business Name" : "Vendor Name"}
                      <span className="text-destructive"> *</span>
                    </Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder={user?.role === "sme_owner" ? "Your company name" : "Your store or vendor name"}
                      value={formData.businessName}
                      onChange={handleChange('businessName')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCategory">
                      {user?.role === "sme_owner" ? "Industry" : "Service Category"}
                      <span className="text-destructive"> *</span>
                    </Label>
                    <Input
                      id="businessCategory"
                      type="text"
                      placeholder={user?.role === "sme_owner" ? "e.g. Logistics, F&B, Retail" : "e.g. Catering, Materials, Services"}
                      value={formData.businessCategory}
                      onChange={handleChange('businessCategory')}
                      required
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
                          businessName: user.businessName || "",
                          businessCategory: user.businessCategory || "",
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
