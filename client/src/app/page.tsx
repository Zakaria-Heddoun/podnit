import { HeroSection } from "@/components/ui/hero-section-1";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductCatalog from "@/components/landing/ProductCatalog";
import OrderLifecycle from "@/components/landing/OrderLifecycle";
import WhyChoose from "@/components/landing/WhyChoose";
import Footer from "@/components/landing/Footer";

const HomePage = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <HowItWorks />
      <ProductCatalog />
      <OrderLifecycle />
      <WhyChoose />
      <Footer />
    </main>
  );
};

export default HomePage;