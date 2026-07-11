import { Link } from "react-router-dom";

const sampleCategories = [
  {
    id: "biryani",
    name: "Biryani",
    menu_category_image_url: "https://source.unsplash.com/400x300/?biryani",
  },
  {
    id: "pizza",
    name: "Pizza",
    menu_category_image_url: "https://source.unsplash.com/400x300/?pizza",
  },
  {
    id: "desserts",
    name: "Desserts",
    menu_caetgory_image_url: "https://source.unsplash.com/400x300/?dessert",
  },
];

const FeaturedCategories = ({ categories = sampleCategories }) => (
  <div className="py-20 bg-base-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-bold mb-2">Featured Categories</h2>
          <p className="text-xl text-base-content/70">
            Explore popular food types
          </p>
        </div>
        <Link to="/categories" className="btn btn-outline btn-lg">
          Browse All Categories
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {categories.map((category) => (
          <Link
            key={category.category_id}
            to={`/categories/${category.id}`}
            className="group"
          >
            <div className="card bg-base-200 hover:shadow-xl transition group-hover:-translate-y-2">
              <figure className="relative overflow-hidden">
                <img
                  src={category.menu_category_image_url}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </figure>
              <div className="card-body text-center">
                <h3 className="text-xl font-semibold text-base-content">
                  {category.name}
                </h3>
                <p className="text-sm text-base-content/60 mt-1">
                  Explore {category.name} restaurants
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default FeaturedCategories;
