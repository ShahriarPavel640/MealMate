import { Search, Truck, ShieldCheck } from "lucide-react";

const features = [
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

const FeaturesSection = () => (
  <div className="py-20 bg-base-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-gray-100">
          Why choose FoodPanda?
        </h2>
        <p className="text-xl text-gray-300">
          Experience the best food delivery service
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.slice(0, 9).map((feature, idx) => (
          <div
            key={idx}
            className={`card bg-gray-400 border shadow-sm hover:shadow-md transition ${feature.cardBg}`}
          >
            <div className="card-body text-center">
              <div
                className={`w-20 h-20 ${feature.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                {feature.icon}
              </div>
              <h3 className="card-title text-2xl justify-center mb-4 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-lg text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default FeaturesSection;
