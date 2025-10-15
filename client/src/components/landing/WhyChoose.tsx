"use client";

import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { Shield, Eye, MapPin, DollarSign, Users, Award } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";
const timelineData = [
  {
    id: 1,
    title: "Secure Payments",
    date: "Always",
    content: "Bank-level security with encrypted payments and fraud protection for all transactions.",
    category: "Security",
      icon: Shield,
    relatedIds: [2, 6],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Full Transparency",
    date: "Real-time",
    content: "Track every step of your order with real-time updates and clear communication throughout the process.",
    category: "Transparency",
    icon: Eye,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "Local Focus",
    date: "Morocco",
    content: "Proudly Moroccan - supporting local businesses and understanding unique market needs.",
    category: "Local",
    icon: MapPin,
    relatedIds: [2, 4],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 4,
    title: "Fair Pricing",
    date: "No Hidden Fees",
    content: "Competitive rates with complete transparency. Keep more of what you earn from each sale.",
    category: "Pricing",
    icon: DollarSign,
    relatedIds: [3, 5],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 5,
    title: "Seller Support",
    date: "24/7",
    content: "Dedicated support team ready to help you succeed and grow your print-on-demand business.",
    category: "Support",
    icon: Users,
    relatedIds: [4, 6],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 6,
    title: "Quality Promise",
    date: "Guaranteed",
    content: "Premium materials and printing quality backed by our comprehensive satisfaction guarantee.",
    category: "Quality",
    icon: Award,
    relatedIds: [5, 1],
    status: "completed" as const,
    energy: 98,
  },
];



export default function WhyChoose() {
  return (
    <section className="bg-background">
      <AnimatedGroup preset="hero-blur">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
              Why Choose PODNIT
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover what makes PODNIT the most trusted print-on-demand platform in Morocco
            </p>
          </div>
        </div>
        
        <div className="h-screen">
          <RadialOrbitalTimeline timelineData={timelineData} />
        </div>
      </AnimatedGroup>
    </section>
  );
}