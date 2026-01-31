import type React from "react";
import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/hooks/useAuth";
import { UnlockProvider } from "@/hooks/useUnlock";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { WalletIsland } from "@coinbase/onchainkit/wallet";

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const fontHeading = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Rivo - Programmable Work Agreements",
  description:
    "Freedom of work, with trust locked and executed by code. Programmable work agreements for global freelance teams on Base blockchain.",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/Rivologo.png", sizes: "32x32", type: "image/png" },
      { url: "/Rivologo.png", sizes: "48x48", type: "image/png" },
      { url: "/Rivologo.png", sizes: "64x64", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            <AuthProvider>
              <UnlockProvider>
                <Navbar />
                {children}
                <Toaster />
                <WalletIsland />
              </UnlockProvider>
            </AuthProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
