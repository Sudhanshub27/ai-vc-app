import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "SignBridge — AI Video Calling for Deaf & Hearing",
  description:
    "Real-time video calling with sign language recognition and speech-to-text captions. Breaking barriers between deaf and hearing communities.",
  keywords: ["sign language", "video calling", "deaf", "mute", "accessibility", "AI captions"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-inter antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(15,15,30,0.95)",
                color: "#e2e8f0",
                border: "1px solid rgba(139,92,246,0.3)",
                backdropFilter: "blur(12px)",
              },
              success: { iconTheme: { primary: "#8b5cf6", secondary: "#fff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
