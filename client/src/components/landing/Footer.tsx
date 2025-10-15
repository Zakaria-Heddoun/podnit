"use client";

import { Facebook, Instagram, Youtube } from "lucide-react";
import { Footer as UIFooter } from "@/components/ui/footer";
import { AnimatedGroup } from "@/components/ui/animated-group";

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
  </svg>
);

const footerVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(8px)",
      y: 30,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.2,
        duration: 0.8,
      },
    },
  },
};

export default function Footer() {
  return (
    <AnimatedGroup variants={footerVariants}>
      <UIFooter
        logo={<div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">A</div>}
      brandName="PODNIT"
      socialLinks={[
        {
          icon: <Facebook className="h-5 w-5" />,
          href: "https://facebook.com",
          label: "Facebook",
        },
        {
          icon: <TikTokIcon />,
          href: "https://tiktok.com",
          label: "TikTok",
        },
        {
          icon: <Instagram className="h-5 w-5" />,
          href: "https://instagram.com",
          label: "Instagram",
        },
        {
          icon: <Youtube className="h-5 w-5" />,
          href: "https://youtube.com",
          label: "YouTube",
        },
      ]}
      mainLinks={[
        { href: "/about", label: "About Us" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/success-stories", label: "Success Stories" },
        { href: "/help", label: "Help Center" },
      ]}
      legalLinks={[
        // { href: "/privacy", label: "Privacy Policy" },
        // { href: "/terms", label: "Terms of Service" },
        // { href: "/seller-agreement", label: "Seller Agreement" },
        // { href: "/returns", label: "Return Policy" },
      ]}
      copyright={{
        text: "© 2025 PODNIT. All rights reserved.",
        license: "Morocco's leading print-on-demand marketplace",
      }}
    />
    </AnimatedGroup>
  );
}