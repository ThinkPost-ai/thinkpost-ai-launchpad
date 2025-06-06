
import { useEffect } from 'react';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import { useTikTokAuth } from '@/hooks/useTikTokAuth';

const Index = () => {
  const { checkTikTokAuthCallback } = useTikTokAuth();

  useEffect(() => {
    // Check for TikTok authentication callback when component mounts
    checkTikTokAuthCallback();
  }, [checkTikTokAuthCallback]);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
    </div>
  );
};

export default Index;
