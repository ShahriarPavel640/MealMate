import pool from "./db.js";
import bcrypt from "bcrypt";

const MY_LAT = 23.72524992;
const MY_LON = 90.39254796;

const restaurantsData = [
  {
    name: "Dhakaiya Kacchi Ghar",
    phone: "01711122233",
    email: "kacchi@example.com",
    cuisine_type: "Biryani & Bengali",
    descriptions: "Authentic Dhakaiya Kacchi Biryani with tender mutton, potatoes, and aromatic spices.",
    image_url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&h=400&q=80",
    lat: 23.7285,
    lon: 90.3952,
    street: "Dhaka University Area",
    city: "Dhaka",
    postal_code: "1000",
    categories: [
      {
        name: "Biryani Special",
        image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Mutton Kacchi Biryani",
            description: "Layered basmati rice and marinated mutton cooked to perfection with saffron and potatoes.",
            price: 320.00,
            image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Chicken Roast",
            description: "Traditional sweet and savory chicken roast prepared with ghee and rich spices.",
            price: 140.00,
            image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      },
      {
        name: "Sides & Drinks",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Shahi Borhani",
            description: "Spiced sour yogurt drink flavored with mint, coriander, and mustard seeds.",
            price: 60.00,
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Shahi Jorda",
            description: "Sweet saffron-flavored rice dessert garnished with nuts, raisins, and baby sweets.",
            price: 80.00,
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      }
    ]
  },
  {
    name: "Lalbagh Kabab & Naan",
    phone: "01722233344",
    email: "kabab@example.com",
    cuisine_type: "Kebabs & Grills",
    descriptions: "Juicy seekh kebabs, boti kebabs, and fresh butter naan baked in a traditional clay oven.",
    image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&h=400&q=80",
    lat: 23.7198,
    lon: 90.3875,
    street: "Lalbagh Fort Road",
    city: "Dhaka",
    postal_code: "1211",
    categories: [
      {
        name: "Signature Kebabs",
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Beef Seekh Kabab",
            description: "Finely minced beef mixed with onions, garlic, and special spices, grilled on skewers.",
            price: 150.00,
            image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Chicken Boti Kabab",
            description: "Tender, boneless chicken cubes marinated in yogurt and tikka spices, grilled to perfection.",
            price: 160.00,
            image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      },
      {
        name: "Fresh Tandoori Breads",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Garlic Butter Naan",
            description: "Soft tandoori flatbread brushed with garlic butter and fresh coriander.",
            price: 45.00,
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      }
    ]
  },
  {
    name: "Dhaka University Cafe & Burgers",
    phone: "01733344455",
    email: "ucafe@example.com",
    cuisine_type: "Burgers & Fast Food",
    descriptions: "Mouthwatering smash burgers, crispy chicken fries, and refreshing milkshakes.",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=400&q=80",
    lat: 23.7265,
    lon: 90.3998,
    street: "Nilkhet Road, Dhaka University",
    city: "Dhaka",
    postal_code: "1000",
    categories: [
      {
        name: "Gourmet Burgers",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Classic Cheese Smash Burger",
            description: "Two smashed beef patties, double cheddar, secret house sauce, and pickles on a toasted brioche bun.",
            price: 250.00,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Crispy Spicy Chicken Burger",
            description: "Crispy fried chicken breast, spicy mayo, lettuce, and jalapeños.",
            price: 230.00,
            image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      },
      {
        name: "Sides & Shakes",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Cheesy Waffle Fries",
            description: "Crispy waffle fries loaded with melted cheese sauce and chives.",
            price: 120.00,
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Double Chocolate Shake",
            description: "Thick, creamy milkshake made with real Belgian chocolate ice cream.",
            price: 150.00,
            image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      }
    ]
  },
  {
    name: "Pizzaria Bella Italia",
    phone: "01744455566",
    email: "bella@example.com",
    cuisine_type: "Italian Pizza & Pasta",
    descriptions: "Wood-fired Neapolitan pizzas made with imported Italian ingredients.",
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&h=400&q=80",
    lat: 23.7412,
    lon: 90.3824,
    street: "Dhanmondi Lake Road",
    city: "Dhaka",
    postal_code: "1205",
    categories: [
      {
        name: "Neapolitan Pizzas",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Pizza Margherita",
            description: "San Marzano tomatoes, fresh mozzarella, fresh basil, and extra virgin olive oil.",
            price: 450.00,
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Pizza Pepperoni Double",
            description: "Rich tomato sauce, double mozzarella, and loaded with spicy pepperoni slices.",
            price: 550.00,
            image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      },
      {
        name: "Desserts",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Classic Tiramisu",
            description: "Ladyfingers dipped in coffee, layered with a whipped mixture of egg yolks, sugar, and mascarpone cheese.",
            price: 220.00,
            image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      }
    ]
  },
  {
    name: "Nourish Bowls & Salads",
    phone: "01755566677",
    email: "nourish@example.com",
    cuisine_type: "Healthy & Salads",
    descriptions: "Nutritious salad bowls, protein shakes, and healthy wraps for a clean diet.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&h=400&q=80",
    lat: 23.7385,
    lon: 90.4124,
    street: "Segunbagicha, Ramna",
    city: "Dhaka",
    postal_code: "1000",
    categories: [
      {
        name: "Salad Bowls",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Grilled Chicken Avocado Salad",
            description: "Grilled chicken breast, ripe avocado, mixed greens, cherry tomatoes, and honey mustard dressing.",
            price: 280.00,
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=300&q=80"
          },
          {
            name: "Quinoa Harvest Bowl",
            description: "Organic quinoa, roasted sweet potatoes, kale, chickpeas, pumpkin seeds, and tahini dressing.",
            price: 260.00,
            image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      },
      {
        name: "Healthy Wraps",
        image: "https://images.unsplash.com/photo-1626700051175-6518c4793fdf?auto=format&fit=crop&w=400&h=300&q=80",
        items: [
          {
            name: "Keto Chicken Wrap",
            description: "Low-carb tortilla wrap stuffed with grilled chicken, spinach, cheese, and garlic ranch.",
            price: 180.00,
            image: "https://images.unsplash.com/photo-1626700051175-6518c4793fdf?auto=format&fit=crop&w=400&h=300&q=80"
          }
        ]
      }
    ]
  }
];

const populate = async () => {
  try {
    console.log("--- Starting Nearby Restaurant Seeding ---");
    console.log(`Target User Location: Lat ${MY_LAT}, Lon ${MY_LON}`);

    // Generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    for (const r of restaurantsData) {
      // 1. Delete existing restaurant with this email to allow re-runs
      const existing = await pool.query("SELECT restaurant_id, location_id FROM restaurants WHERE email = $1", [r.email]);
      if (existing.rows.length > 0) {
        const oldId = existing.rows[0].restaurant_id;
        const oldLocId = existing.rows[0].location_id;
        console.log(`Cleaning up old entry for ${r.name}...`);
        await pool.query("DELETE FROM restaurants WHERE restaurant_id = $1", [oldId]);
        if (oldLocId) {
          await pool.query("DELETE FROM user_locations WHERE location_id = $1", [oldLocId]);
        }
      }

      // 2. Insert Restaurant without location_id first
      const restInsert = await pool.query(
        `INSERT INTO restaurants (name, password, phone, email, average_rating, image_url, cuisine_type, descriptions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING restaurant_id`,
        [r.name, hashedPassword, r.phone, r.email, 4.80, r.image_url, r.cuisine_type, r.descriptions]
      );
      const restaurantId = restInsert.rows[0].restaurant_id;

      // 3. Insert Location
      const locInsert = await pool.query(
        `INSERT INTO user_locations (restaurant_id, street, city, postal_code, latitude, longitude, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING location_id`,
        [restaurantId, r.street, r.city, r.postal_code, r.lat, r.lon, true]
      );
      const locationId = locInsert.rows[0].location_id;

      // 4. Update Restaurant with the location_id
      await pool.query(
        "UPDATE restaurants SET location_id = $1 WHERE restaurant_id = $2",
        [locationId, restaurantId]
      );

      // 5. Calculate and print actual distance from user
      const distRes = await pool.query(
        "SELECT get_distance_km($1, $2, $3, $4) AS distance",
        [MY_LON, MY_LAT, r.lon, r.lat]
      );
      const distance = parseFloat(distRes.rows[0].distance).toFixed(2);
      console.log(`Created ${r.name} - Distance: ${distance} km (Coordinates: ${r.lat}, ${r.lon})`);

      // 6. Insert Menu Categories & Menu Items
      for (const cat of r.categories) {
        const catInsert = await pool.query(
          `INSERT INTO menu_categories (restaurant_id, name, menu_category_image_url)
           VALUES ($1, $2, $3) RETURNING category_id`,
          [restaurantId, cat.name, cat.image]
        );
        const categoryId = catInsert.rows[0].category_id;

        for (const item of cat.items) {
          await pool.query(
            `INSERT INTO menu_items (category_id, name, description, price, is_available, menu_item_image_url)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [categoryId, item.name, item.description, item.price, true, item.image]
          );
        }
      }
      console.log(`  -> Seeded ${r.categories.length} categories with items.`);
    }

    console.log("--- Seeding Completed Successfully! ---");
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err.message);
    process.exit(1);
  }
};

populate();
