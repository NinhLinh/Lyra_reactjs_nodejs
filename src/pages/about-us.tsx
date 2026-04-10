import React from 'react';

const AboutUs: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto pt-[80px] px-4">
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6">
        About Us
      </h1>

      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          Welcome to <span className="font-semibold text-gray-900">LunaReact</span>. We are
          passionate about curating quality products with a focus on style, comfort, and everyday
          confidence.
        </p>

        <p>
          From the moment you land on our store, our goal is to make shopping simple and
          enjoyable: discover products, add them to your cart, and come back anytime to check
          updates.
        </p>

        <p>
          This demo page is intentionally lightweight. If you want later we can expand this
          section with your mission, story, team, and FAQs.
        </p>
      </div>
    </section>
  );
};

export default AboutUs;

