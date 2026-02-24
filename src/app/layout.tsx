import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/contexts/RoleContext";
import { Web3Provider } from "@/contexts/Web3Context";
import { AppLayout } from "@/components/layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "LandChain | National Blockchain Property System",
  description: "Secure, transparent, and efficient government property registration on the blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${playfair.variable} font-sans antialiased text-primary-900`}>
        <RoleProvider>
          <Web3Provider>
            <AppLayout>
              {children}
            </AppLayout>
          </Web3Provider>
        </RoleProvider>
      </body>
    </html>
  );
}
