"use client";

import { HeroSection } from "@/components/ui/hero-section-1";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductCatalog from "@/components/landing/ProductCatalog";
import OrderLifecycle from "@/components/landing/OrderLifecycle";
import WhyChoose from "@/components/landing/WhyChoose";
import Footer from "@/components/landing/Footer";
import { useEffect, useState } from "react";

const HomePage = () => {
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowWhatsApp(true);
      } else {
        setShowWhatsApp(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style jsx>{`
         /*** STICKY WHTSP BTN****/
.wp-fixed{
 position: fixed;
 left: 1%;
 bottom: 5%;
  z-index: 10000000 !important;
 /* padding: 124px; */
 }
.wp-fixed a {display: block;background: #22C04A;border-radius: 10px;color: #fff;text-align: center;font-size: 13px;font-weight: 600;padding: 12px 5px;font-family: sans-serif;}
.wp-fixed a img{
    font-size: 20px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 10px;
    width: 20%;
    /* margin-right: 10px; */
    font-weight: 900;
}
      `}</style>
      
      <main className="min-h-screen">
        <HeroSection />
        <HowItWorks />
        <ProductCatalog />
        <OrderLifecycle />
        <WhyChoose />
        <Footer />
      </main>

      {/* WhatsApp Floating Button */}
      <div className={`wp-fixed ${showWhatsApp ? 'show' : ''}`}>
        <a href="https://wa.me/+212607630567" target="_blank" rel="noopener noreferrer">
          <img src="/images/whatsapp.svg" alt="WhatsApp" />
          WhatsApp
        </a>
      </div>
    </>
  );
};

export default HomePage;