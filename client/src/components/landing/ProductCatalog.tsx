'use client';

const tshirtMockup = "/images/tshirt-mockup.jpg";
const hoodieMockup = "/images/hoodie-mockup.jpg";
const totebagMockup = "/images/totebag-mockup.jpg";
const capMockup = "/images/cap-mockup.jpg";
import { Component as CircularGallery } from "@/components/ui/circular-gallery";
import { AnimatedGroup } from "@/components/ui/animated-group";

const products = [
  {
    image: tshirtMockup,
    text: "Premium T-Shirts",
  },
  {
    image: hoodieMockup,
    text: "Hoodies & Sweatshirts",
  },
  {
    image: totebagMockup,
    text: "Tote Bags",
  },
  {
    image: capMockup,
    text: "Baseball Caps",
  },
];



export default function ProductCatalog() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <AnimatedGroup preset="hero-blur">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Product Catalog
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Quality products ready for your custom designs and creativity
            </p>
          </div>

          <div className="w-full h-[600px] overflow-hidden">
            <CircularGallery 
              items={products} 
              bend={3} 
              textColor="hsl(var(--foreground))" 
              borderRadius={0.05}
              font="bold 24px Outfit, sans-serif"
            />
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              And many more products coming soon...
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-card px-4 py-2 rounded-full shadow-sm text-card-foreground">Mugs</span>
              <span className="bg-card px-4 py-2 rounded-full shadow-sm text-card-foreground">Phone Cases</span>
              <span className="bg-card px-4 py-2 rounded-full shadow-sm text-card-foreground">Posters</span>
              <span className="bg-card px-4 py-2 rounded-full shadow-sm text-card-foreground">Stickers</span>
              <span className="bg-card px-4 py-2 rounded-full shadow-sm text-card-foreground">+ More</span>
            </div>
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}