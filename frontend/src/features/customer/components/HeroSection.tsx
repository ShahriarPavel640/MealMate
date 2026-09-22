import React from "react";

const HeroSection: React.FC = () => (
  <section className="relative min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-[#e21b70] via-pink-500 to-orange-400 text-white">
    {/* Overlay */}
    <div className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm"></div>

    {/* Content */}
    <div className="relative z-10 text-center px-4 max-w-2xl">
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
        Delicious food,{" "}
        <span className="text-yellow-300 block">delivered to you</span>
      </h1>
      <p className="text-lg sm:text-xl mb-8 opacity-90">
        Order from your favorite local restaurants and get it delivered hot &amp;
        fresh.
      </p>
    </div>
  </section>
);

export default HeroSection;
