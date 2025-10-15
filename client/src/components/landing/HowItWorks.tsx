import { FeatureSteps } from "@/components/ui/feature-section";

const features = [
  { 
    step: 'Step 1', 
    title: 'Upload Your Designs',
    content: 'Create and upload your custom designs. Use our templates or start from scratch with your creative ideas.', 
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3' 
  },
  { 
    step: 'Step 2',
    title: 'Manage Your Orders',
    content: 'Track order status, manage your catalog, and handle customer requests through our intuitive dashboard.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  { 
    step: 'Step 3',
    title: 'Get Paid Securely',
    content: 'Receive payments through secure bank transfers once orders are completed and validated.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <FeatureSteps 
        features={features}
        title="How It Works"
        autoPlayInterval={4000}
        imageHeight="h-[500px]"
      />
    </section>
  );
}