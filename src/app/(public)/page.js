"use client";

import React, { useEffect } from 'react';
import Hero from '@/components/Hero';
import BentoGrid from '@/components/BentoGrid';
import Pipeline from '@/components/Pipeline';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';

export default function HomePage() {
  // Section scroll animation via IntersectionObserver
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
      el.classList.add('transition-all', 'duration-1000', 'ease-out', 'opacity-0', 'translate-y-12');
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <main className="pt-24">
      <Hero />
      <div id="solutions">
        <BentoGrid />
      </div>
      <Pipeline />
      <Testimonials />
      <div id="faq">
        <FAQ />
      </div>
      <CTA />
    </main>
  );
}
