import { Search, MapPin } from "lucide-react";

const HeroSection = () => (
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
        Order from your favorite local restaurants and get it delivered hot &
        fresh.
      </p>

      {/* Search Bar
      <div className="flex flex-col sm:flex-row items-stretch gap-4 max-w-xl mx-auto">
        <div className="flex items-center bg-white rounded-lg overflow-hidden w-full">
          <span className="px-4 text-[#e21b70]">
            <MapPin className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Enter delivery address"
            className="flex-1 px-4 py-3 text-gray-800 focus:outline-none"
          />
        </div>
        <button className="btn bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 text-lg rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 mr-2" />
          Find Food
        </button>
      </div> */}
    </div>
  </section>
);

export default HeroSection;
