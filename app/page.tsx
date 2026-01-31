"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ShineButton } from "@/components/ui/shine-button";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Globe } from "@/components/ui/globe";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RiCheckboxCircleLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiStarFill,
  RiQrCodeLine,
  RiMoneyDollarCircleLine,
  RiBarChartLine,
  RiRobotLine,
  RiGasStationLine,
  RiFileList3Line,
  RiLockLine,
  RiCalendarCheckLine,
  RiGlobalLine,
  RiHistoryLine,
  RiSettings4Line,
  RiAlertLine,
  RiLineChartLine,
  RiShieldLine,
  RiThumbUpLine,
} from "react-icons/ri";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { testimonials, coreFeatures, featureCategories } from "@/app/contants";
import { FaqSection } from "@/components/faq-section";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const featureIcons = {
  qr: RiQrCodeLine,
  payment: RiMoneyDollarCircleLine,
  status: RiBarChartLine,
  ai: RiRobotLine,
  gas: RiGasStationLine,
  contract: RiFileList3Line,
  lock: RiLockLine,
  checklist: RiCalendarCheckLine,
  globe: RiGlobalLine,
  history: RiHistoryLine,
  gavel: RiSettings4Line,
};

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isProfileComplete, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && isProfileComplete && user?.address) {
      const redirectKey = `rivo_first_redirect_${user.address.toLowerCase()}`;
      const hasRedirected = localStorage.getItem(redirectKey);

      if (!hasRedirected) {
        localStorage.setItem(redirectKey, "true");
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isProfileComplete, isLoading, router, user?.address]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section with Globe */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <BackgroundGradient
            animate={true}
            className="opacity-20"
            containerClassName="absolute inset-0"
          />

          {/* Globe Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-8xl h-[800px]">
              <Globe className="top-20" />
              <div className="pointer-events-none absolute inset-0 h-full" />
            </div>
          </div>

          <div className="container relative z-10 mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Floating decorative icons */}
              <motion.div
                animate={{ rotate: 360, y: [-10, 10, -10] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -left-16 -top-8 hidden lg:block opacity-20"
              >
                <RiLockLine className="h-12 w-12 text-primary" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360, y: [10, -10, 10] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -right-20 -top-4 hidden lg:block opacity-20"
              >
                <RiGlobalLine className="h-16 w-16 text-success" />
              </motion.div>

              {/* Rivo Logo/Brand */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative"
                >
                  <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent">
                    Rivo
                  </h1>
                  {/* Sparkle effects around logo */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2"
                  >
                    <RiStarFill className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1 -left-2"
                  >
                    <RiStarFill className="h-3 w-3 text-primary" />
                  </motion.div>
                </motion.div>
              </div>

              <Badge className="mb-4 rounded-full px-6 py-2 text-sm font-medium bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 relative overflow-hidden">
                <motion.div
                  animate={{ x: [-20, 300] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
                <RiQrCodeLine className="mr-2 h-4 w-4 text-primary" />
                QR Invoice + IDRX Payments
                <RiMoneyDollarCircleLine className="ml-2 h-4 w-4 text-success" />
              </Badge>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            >
              <AnimatedGradientText>
                Simplify Indonesian business payments with IDRX
              </AnimatedGradientText>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl"
            >
              RIVO transforms supplier payments for Indonesian startups. Create QR invoices and settle instantly using IDRX stablecoin on Base.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Link href="/dashboard/invoices">
                <ShineButton className="w-full px-8 py-6 text-lg sm:w-auto">
                  <RiQrCodeLine className="mr-2 h-5 w-5" />
                  Create QR Invoice
                </ShineButton>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-primary/50 px-8 py-6 text-lg hover:bg-primary/10 sm:w-auto"
                >
                  View Dashboard
                  <RiArrowRightLine className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* How It Works - 6 Core Features */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                How RIVO Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Payment Infrastructure Built for Indonesian Business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From QR invoice generation to instant settlement, RIVO simplifies business payments with IDRX
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {coreFeatures.map((feature, index) => {
                const IconComponent = featureIcons[feature.icon as keyof typeof featureIcons];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      <CardHeader>
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-success/10 text-success border-success/20">
                Testimonials
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Trusted by SME Owners, Vendors, and Staff Worldwide
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how RIVO is transforming business payments in Indonesia
              </p>
            </motion.div>

            <InfiniteMovingCards
              items={testimonials}
              direction="right"
              speed="slow"
            />
          </div>
        </section>

        {/* Features by User Type */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Built For Everyone
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Whether You're an SME Owner, Vendor, or Staff
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                RIVO provides the tools you need for seamless IDRX payments
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* For SME Owners */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    </div>
                    <CardTitle className="text-2xl">For SME Owners</CardTitle>
                    <CardDescription>
                      Pay invoices with IDRX
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {featureCategories.forSMEOwners.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <RiCheckboxCircleLine className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* For Vendors/Suppliers */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="h-full border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <RiLineChartLine className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">For Vendors/Suppliers</CardTitle>
                    <CardDescription>
                      Receive invoice payments instantly with IDRX
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {featureCategories.forVendors.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <RiCheckboxCircleLine className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RiShieldCheckLine className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                Built on Base Blockchain
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                RIVO leverages Base's EVM-compatible blockchain for low-cost, fast, and secure smart contract execution. Your payments are transparent, immutable, and automatically enforced by code.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center">
                  <RiShieldLine className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Trustless</h3>
                  <p className="text-sm text-muted-foreground">No middleman needed</p>
                </div>
                <div className="flex flex-col items-center">
                  <RiHistoryLine className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Transparent</h3>
                  <p className="text-sm text-muted-foreground">All activity on-chain</p>
                </div>
                <div className="flex flex-col items-center">
                  <RiSettings4Line className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Automated</h3>
                  <p className="text-sm text-muted-foreground">Rules execute themselves</p>
                </div>
                <div className="flex flex-col items-center">
                  <RiGlobalLine className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Global</h3>
                  <p className="text-sm text-muted-foreground">Work from anywhere</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about Rivo
              </p>
            </motion.div>
            <FaqSection />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-transparent to-success/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                Ready to Transform Your Business Payments?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start paying invoices with IDRX in minutes. No credit card required.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/dashboard">
                  <ShineButton className="w-full px-8 py-6 text-lg sm:w-auto">
                    <RiFileList3Line className="mr-2 h-5 w-5" />
                    Get Started Now
                  </ShineButton>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
