import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import StatsBar from '../../components/StatsBar';
import LogoCloud from '../../components/LogoCloud';
import BentoGrid from '../../components/BentoGrid';
import Pipeline from '../../components/Pipeline';
import Testimonials from '../../components/Testimonials';
import FAQ from '../../components/FAQ';
import CTA from '../../components/CTA';
import Footer from '../../components/Footer';

export default function Home() {
  // Set up the IntersectionObserver for section animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-12');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('section > div');
    
    animatedElements.forEach((el) => {
      // Ensure initial style classes are present for transition
      el.classList.add('transition-all', 'duration-1000', 'ease-out', 'opacity-0', 'translate-y-12');
      observer.observe(el);
    });

    // Cleanup observer on unmount
    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="mesh-bg text-on-background font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-primary min-h-screen">
      <Navbar />
      
      <main className="pt-24">
        <Hero />
        <StatsBar />
        <LogoCloud />
        <BentoGrid />
        <Pipeline />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
