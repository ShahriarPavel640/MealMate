import React from "react";
import { Search, Truck, ShieldCheck } from "lucide-react";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  bg: string;
  cardBg: string;
}

const features: FeatureItem[] = [
  {
    icon: <Search className="w-10 h-10 text-white" />,
    title: "Easy Ordering",
    description:
      "Browse through thousands of restaurants and cuisines with our intuitive interface",
    bg: "bg-blue-500",
    cardBg: "border-blue-200",
  },
  {
    icon: <Truck className="w-10 h-10 text-white" />,
    title: "Fast Delivery",
    description:
      "Get your food delivered in 30 minutes or less with our efficient delivery network",
    bg: "bg-green-500",
    cardBg: "border-green-200",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-white" />,
    title: "Quality Assured",
    description:
      "All our restaurant partners are carefully selected and quality checked",
    bg: "bg-purple-500",
    cardBg: "border-purple-200",
  },
];

const FeaturesSection: React.FC = () => (
  <div className="py-20 bg-[#0a0a0a] text-white">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold mb-4 text-white tracking-tight">
          Why choose MealMate?
        </h2>
        <p className="text-xl text-gray-400 font-medium">
          Experience the best food delivery service
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.slice(0, 9).map((feature, idx) => (
          <div
            key={idx}
            className="card bg-[#141414] border border-white/5 shadow-2xl hover:bg-[#1a1a1a] hover:border-white/10 transition-all duration-300"
          >
            <div className="card-body text-center">
              <div
                className={`w-20 h-20 ${feature.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                {feature.icon}
              </div>
              <h3 className="card-title text-2xl justify-center mb-4 text-white font-bold">
                {feature.title}
              </h3>
              <p className="text-lg text-gray-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default FeaturesSection;
