'use client';

import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { Clock, PlayCircle, Printer, Truck, Package, CreditCard } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";



export default function OrderLifecycle() {
  const timelineData = [
    {
      title: "Pending",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Order Received</h4>
              <p className="text-sm text-muted-foreground">Your order has been placed and is awaiting processing</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            We've received your order details and design specifications. Our team will review everything to ensure accuracy before moving to the next stage.
          </p>
        </div>
      ),
    },
    {
      title: "In Progress",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Production Started</h4>
              <p className="text-sm text-muted-foreground">Your order is now being processed and prepared</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Our design experts have approved your artwork and production has begun. We ensure the highest quality standards throughout the process.
          </p>
        </div>
      ),
    },
    {
      title: "Printed",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Printing Complete</h4>
              <p className="text-sm text-muted-foreground">Your design has been printed on the selected products</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Using high-quality printing techniques, we've successfully applied your design to the chosen merchandise with precision and attention to detail.
          </p>
        </div>
      ),
    },
    {
      title: "Delivering",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Ready for Delivery</h4>
              <p className="text-sm text-muted-foreground">Products are packaged and ready to be delivered</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your products have been carefully packaged with protective materials and are now ready for delivery to ensure they arrive in perfect condition.
          </p>
        </div>
      ),
    },
    {
      title: "Shipped",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">In Transit</h4>
              <p className="text-sm text-muted-foreground">Package dispatched with tracking information</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your order has been dispatched and is on its way to the customer. Tracking information is available to monitor the delivery progress.
          </p>
        </div>
      ),
    },
    {
      title: "Paid",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Payment Processed</h4>
              <p className="text-sm text-muted-foreground">Secure payment transfer completed</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Order delivered successfully! Payment has been securely processed and transferred to your account. Transaction complete with full transparency and security.
          </p>
        </div>
      ),
    },
  ];
  
  return (
    <section id="order-process" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <AnimatedGroup preset="hero-blur">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Complete Transparency
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your order journey from start to finish with our transparent process
            </p>
          </div>
          <div className="relative w-full overflow-clip">
            <Timeline data={timelineData} />
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}