const fs = require('fs');
const path = require('path');

const populateSqlPath = path.join(__dirname, 'populate.sql');
let sqlContent = fs.readFileSync(populateSqlPath, 'utf8');

const userLocationsBlock = `INSERT INTO user_locations (location_id, user_id, restaurant_id, street, city, postal_code, latitude, longitude, addr_link, is_primary) VALUES 
(1, 4, NULL, '891 Espinoza Trail Apt. 732', 'West Stephanieborough', '36686', 29.48448506, -11.17003903, 'https://maps.google.com/?q=loc1', true),
(2, 1, NULL, '64596 Jacqueline Fork', 'Port Brandonshire', '68874', 4.34894799, 74.09282236, 'https://maps.google.com/?q=loc2', true),
(3, 4, NULL, '5512 Brenda Highway Apt. 830', 'West Michael', '44535', -34.69259652, 79.81143658, 'https://maps.google.com/?q=loc3', true),
(4, 3, NULL, '4829 Greg River Apt. 874', 'East Stevenside', '56975', 82.63795744, 44.31077383, 'https://maps.google.com/?q=loc4', true),
(5, 2, NULL, '4637 Alexis Isle Apt. 403', 'Port Mandybury', '85357', 51.06911149, -119.15858999, 'https://maps.google.com/?q=loc5', true),
(6, NULL, 6, 'Dhakaiya Kacchi Ghar', 'Dhaka', '1000', 23.7285, 90.3952, 'https://maps.google.com/?q=23.7285,90.3952', true),
(7, NULL, 7, 'Lalbagh Kabab & Naan', 'Dhaka', '1000', 23.7198, 90.3875, 'https://maps.google.com/?q=23.7198,90.3875', true),
(8, NULL, 8, 'Dhaka University Cafe & Burgers', 'Dhaka', '1000', 23.7265, 90.3998, 'https://maps.google.com/?q=23.7265,90.3998', true),
(9, NULL, 9, 'Pizzaria Bella Italia', 'Dhaka', '1000', 23.7412, 90.3824, 'https://maps.google.com/?q=23.7412,90.3824', true),
(10, NULL, 10, 'Nourish Bowls & Salads', 'Dhaka', '1000', 23.7385, 90.4124, 'https://maps.google.com/?q=23.7385,90.4124', true);`;

const restaurantsBlock = `INSERT INTO restaurants (restaurant_id, name, password, phone, email, location_id, average_rating, image_url, cuisine_type, descriptions) VALUES
(1, 'Black, Davis and Simon', 'hashed_password', '489-159-3776', 'sandra22@hotmail.com', 1, 3.32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 'American', 'Best burgers in town'),
(2, 'Atkinson, Price and Williams', 'hashed_password', '598-533-6698', 'randallmcintyre@gutierrez-carroll.com', 2, 3.77, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 'Healthy', 'Fresh salads and wraps'),
(3, 'Fisher PLC', 'hashed_password', '591-386-3262', 'millerdiana@yahoo.com', 3, 4.34, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80', 'Dessert', 'Sweet treats for everyone'),
(4, 'Robles LLC', 'hashed_password', '660-697-9159', 'suzanne68@navarro.biz', 4, 3.48, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80', 'Italian', 'Authentic pasta and pizza'),
(5, 'Cook LLC', 'hashed_password', '639-438-0388', 'kevin36@robinson.com', 5, 4.92, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', 'Pizza', 'Wood fired oven pizzas'),
(6, 'Dhakaiya Kacchi Ghar', 'hashed_password', '123-456-7890', 'dhakaiya@example.com', 6, 4.8, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80', 'Bengali', 'Authentic Kacchi Biryani and Bengali cuisine'),
(7, 'Lalbagh Kabab & Naan', 'hashed_password', '123-456-7891', 'lalbagh@example.com', 7, 4.6, 'https://images.unsplash.com/photo-1544025162-8a115ce92080?auto=format&fit=crop&w=800&q=80', 'Mughlai', 'Delicious grilled kababs and hot naan'),
(8, 'Dhaka University Cafe & Burgers', 'hashed_password', '123-456-7892', 'ducafe@example.com', 8, 4.4, 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=800&q=80', 'Fast Food', 'Popular burgers and fast food items for students'),
(9, 'Pizzaria Bella Italia', 'hashed_password', '123-456-7893', 'bella@example.com', 9, 4.7, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 'Italian', 'Wood-fired pizzas and creamy pastas'),
(10, 'Nourish Bowls & Salads', 'hashed_password', '123-456-7894', 'nourish@example.com', 10, 4.9, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 'Healthy', 'Fresh and organic salad bowls for healthy eating');`;

const restaurantHoursBlock = `INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time) VALUES 
(1, 'Mon', '10:00', '19:00'), (1, 'Sat', '09:00', '20:00'), (1, 'Sun', '08:00', '16:00'), (1, 'Thu', '10:00', '19:00'), (1, 'Wed', '11:00', '21:00'),
(2, 'Wed', '08:00', '18:00'), (2, 'Mon', '11:00', '21:00'), (2, 'Tue', '08:00', '16:00'), (2, 'Sun', '10:00', '19:00'), (2, 'Sat', '11:00', '21:00'),
(3, 'Tue', '10:00', '21:00'), (3, 'Thu', '11:00', '19:00'), (3, 'Sun', '10:00', '22:00'), (3, 'Mon', '10:00', '22:00'), (3, 'Fri', '08:00', '18:00'),
(4, 'Tue', '08:00', '17:00'), (4, 'Sat', '10:00', '20:00'), (4, 'Thu', '10:00', '20:00'), (4, 'Mon', '11:00', '19:00'), (4, 'Fri', '10:00', '22:00'),
(5, 'Tue', '10:00', '22:00'), (5, 'Fri', '08:00', '20:00'), (5, 'Thu', '09:00', '20:00'), (5, 'Sun', '09:00', '18:00'), (5, 'Wed', '08:00', '17:00'),
(6, 'Mon', '10:00', '22:00'), (6, 'Tue', '10:00', '22:00'), (6, 'Wed', '10:00', '22:00'), (6, 'Thu', '10:00', '22:00'), (6, 'Fri', '10:00', '22:00'), (6, 'Sat', '10:00', '22:00'), (6, 'Sun', '10:00', '22:00'),
(7, 'Mon', '10:00', '22:00'), (7, 'Tue', '10:00', '22:00'), (7, 'Wed', '10:00', '22:00'), (7, 'Thu', '10:00', '22:00'), (7, 'Fri', '10:00', '22:00'), (7, 'Sat', '10:00', '22:00'), (7, 'Sun', '10:00', '22:00'),
(8, 'Mon', '10:00', '22:00'), (8, 'Tue', '10:00', '22:00'), (8, 'Wed', '10:00', '22:00'), (8, 'Thu', '10:00', '22:00'), (8, 'Fri', '10:00', '22:00'), (8, 'Sat', '10:00', '22:00'), (8, 'Sun', '10:00', '22:00'),
(9, 'Mon', '10:00', '22:00'), (9, 'Tue', '10:00', '22:00'), (9, 'Wed', '10:00', '22:00'), (9, 'Thu', '10:00', '22:00'), (9, 'Fri', '10:00', '22:00'), (9, 'Sat', '10:00', '22:00'), (9, 'Sun', '10:00', '22:00'),
(10, 'Mon', '10:00', '22:00'), (10, 'Tue', '10:00', '22:00'), (10, 'Wed', '10:00', '22:00'), (10, 'Thu', '10:00', '22:00'), (10, 'Fri', '10:00', '22:00'), (10, 'Sat', '10:00', '22:00'), (10, 'Sun', '10:00', '22:00');`;

const menuCategoriesBlock = `INSERT INTO menu_categories (category_id, restaurant_id, name, menu_category_image_url) VALUES 
(1, 1, 'American', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'),
(2, 2, 'Healthy', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80'),
(3, 3, 'Dessert', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=400&q=80'),
(4, 4, 'Italian', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80'),
(5, 5, 'Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80'),
(6, 6, 'Biryani', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&h=300&q=80'),
(7, 6, 'Drinks & Desserts', 'https://images.unsplash.com/photo-1544025162-8a115ce92080?auto=format&fit=crop&w=400&h=300&q=80'),
(8, 7, 'Kababs', 'https://images.unsplash.com/photo-1544025162-8a115ce92080?auto=format&fit=crop&w=400&h=300&q=80'),
(9, 7, 'Breads', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=300&q=80'),
(10, 8, 'Burgers', 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=400&h=300&q=80'),
(11, 8, 'Sides', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&h=300&q=80'),
(12, 9, 'Pizzas', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&h=300&q=80'),
(13, 9, 'Pastas', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&h=300&q=80'),
(14, 10, 'Salad Bowls', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=300&q=80'),
(15, 10, 'Smoothies', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&h=300&q=80');`;

const menuItemsBlock = `INSERT INTO menu_items (menu_item_id, category_id, name, description, price, is_available, is_active, menu_item_image_url) VALUES 
(1, 1, 'Classic Burger', 'Beef patty, lettuce, tomato, cheese', 32.15, true, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'),
(2, 2, 'Green Salad', 'Fresh greens with vinaigrette', 35.15, true, true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80'),
(3, 3, 'Chocolate Cake', 'Decadent chocolate cake', 34.62, true, true, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=400&q=80'),
(4, 4, 'Pasta Carbonara', 'Creamy pasta with bacon', 30.42, true, true, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80'),
(5, 5, 'Margherita Pizza', 'Classic cheese and tomato pizza', 12.65, true, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80'),
(6, 6, 'Mutton Kacchi Biryani', 'Layered basmati rice and marinated mutton cooked to perfection with saffron and potatoes.', 320.00, true, true, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&h=300&q=80'),
(7, 6, 'Chicken Roast', 'Traditional sweet and savory chicken roast prepared with ghee and rich spices.', 140.00, true, true, 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&h=300&q=80'),
(8, 7, 'Shahi Borhani', 'Traditional yogurt drink with mint, coriander, and spices.', 60.00, true, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&h=300&q=80'),
(9, 7, 'Shahi Jorda', 'Sweet rice dessert with nuts and baby sweets.', 90.00, true, true, 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=400&h=300&q=80'),
(10, 8, 'Beef Seekh Kabab', 'Minced beef mixed with spices, skewered and grilled.', 150.00, true, true, 'https://images.unsplash.com/photo-1544025162-8a115ce92080?auto=format&fit=crop&w=400&h=300&q=80'),
(11, 8, 'Chicken Tikka', 'Boneless chicken chunks marinated in spices and grilled over charcoal.', 130.00, true, true, 'https://images.unsplash.com/photo-1599487405270-8178a99478dc?auto=format&fit=crop&w=400&h=300&q=80'),
(12, 9, 'Butter Naan', 'Soft and fluffy flatbread brushed with butter.', 40.00, true, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=300&q=80'),
(13, 9, 'Garlic Naan', 'Flatbread infused with fresh garlic and cilantro.', 50.00, true, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=300&q=80'),
(14, 10, 'Cheese Smash Burger', 'Double smashed beef patties with melting cheese and house sauce.', 250.00, true, true, 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=400&h=300&q=80'),
(15, 10, 'Crispy Chicken Burger', 'Crispy fried chicken breast with spicy mayo and lettuce.', 220.00, true, true, 'https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=400&h=300&q=80'),
(16, 11, 'French Fries', 'Crispy golden potato fries.', 100.00, true, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&h=300&q=80'),
(17, 12, 'Pizza Margherita', 'Classic pizza with tomato sauce, mozzarella, and fresh basil.', 450.00, true, true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&h=300&q=80'),
(18, 12, 'Pepperoni Pizza', 'Mozzarella cheese and spicy pepperoni slices.', 550.00, true, true, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&h=300&q=80'),
(19, 13, 'Fettuccine Alfredo', 'Creamy parmesan sauce over flat pasta.', 380.00, true, true, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&h=300&q=80'),
(20, 14, 'Quinoa Avocado Bowl', 'Mixed greens, quinoa, sliced avocado, cherry tomatoes, and lemon dressing.', 350.00, true, true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=300&q=80'),
(21, 14, 'Grilled Chicken Salad', 'Fresh lettuce, grilled chicken breast, olives, and feta cheese.', 380.00, true, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300&q=80'),
(22, 15, 'Mango Smoothie', 'Fresh mango blended with yogurt and honey.', 150.00, true, true, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&h=300&q=80');`;

sqlContent = sqlContent.replace(/INSERT INTO user_locations.*?;\s*(?=\n-- Restaurants)/s, userLocationsBlock);
sqlContent = sqlContent.replace(/INSERT INTO restaurants.*?;\s*(?=\n-- Restaurant Hours)/s, restaurantsBlock);
sqlContent = sqlContent.replace(/INSERT INTO restaurant_hours.*?;\s*(?=\n-- Menu Categories)/s, restaurantHoursBlock);
sqlContent = sqlContent.replace(/INSERT INTO menu_categories.*?;\s*(?=\n-- Menu Items)/s, menuCategoriesBlock);
sqlContent = sqlContent.replace(/INSERT INTO menu_items.*?;\s*(?=\n-- Carts)/s, menuItemsBlock);

fs.writeFileSync(populateSqlPath, sqlContent, 'utf8');
console.log('Successfully updated populate.sql');
