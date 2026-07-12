-- Seed Data Script

-- Users
INSERT INTO users (user_id, name, email, password, phone_number, role_id) VALUES
(1, 'Susan Ray', 'paul36@gmail.com', 'hashed_password', '768-749-5675', 'customer'),
(2, 'Michael Hampton', 'laura04@gmail.com', 'hashed_password', '298-772-6719', 'rider'),
(3, 'Ryan White', 'amanda66@lowe.net', 'hashed_password', '300-992-8326', 'customer'),
(4, 'Tracy Boyd', 'larsenchristian@yahoo.com', 'hashed_password', '413-855-1738', 'rider'),
(5, 'Elizabeth Fry', 'pamela20@green.com', 'hashed_password', '733-208-3124', 'rider');

-- Rider Profiles
INSERT INTO rider_profiles (user_id, vehicle_type, current_location, is_available) VALUES 
(2, 'bike', 'USNV Booker FPO AA 21297', true),
(4, 'bike', '127 Danielle Views North Paul, LA 04530', true),
(5, 'bike', '4507 Katie Island South Katrinamouth, AR 28386', true);

-- User Locations 
-- (restaurant_id is NULL here because these are purely user addresses)
INSERT INTO user_locations (location_id, user_id, restaurant_id, street, city, postal_code, latitude, longitude, addr_link, is_primary) VALUES 
(1, 4, NULL, '891 Espinoza Trail Apt. 732', 'West Stephanieborough', '36686', 29.48448506, -11.17003903, 'https://maps.google.com/?q=loc1', true),
(2, 1, NULL, '64596 Jacqueline Fork', 'Port Brandonshire', '68874', 4.34894799, 74.09282236, 'https://maps.google.com/?q=loc2', true),
(3, 4, NULL, '5512 Brenda Highway Apt. 830', 'West Michael', '44535', -34.69259652, 79.81143658, 'https://maps.google.com/?q=loc3', true),
(4, 3, NULL, '4829 Greg River Apt. 874', 'East Stevenside', '56975', 82.63795744, 44.31077383, 'https://maps.google.com/?q=loc4', true),
(5, 2, NULL, '4637 Alexis Isle Apt. 403', 'Port Mandybury', '85357', 51.06911149, -119.15858999, 'https://maps.google.com/?q=loc5', true),
(6, NULL, 6, 'Dhakaiya Kacchi Ghar', 'Dhaka', '1000', 23.7285, 90.3952, 'https://maps.google.com/?q=23.7285,90.3952', true),
(7, NULL, 7, 'Lalbagh Kabab & Naan', 'Dhaka', '1000', 23.7198, 90.3875, 'https://maps.google.com/?q=23.7198,90.3875', true),
(8, NULL, 8, 'Dhaka University Cafe & Burgers', 'Dhaka', '1000', 23.7265, 90.3998, 'https://maps.google.com/?q=23.7265,90.3998', true),
(9, NULL, 9, 'Pizzaria Bella Italia', 'Dhaka', '1000', 23.7412, 90.3824, 'https://maps.google.com/?q=23.7412,90.3824', true),
(10, NULL, 10, 'Nourish Bowls & Salads', 'Dhaka', '1000', 23.7385, 90.4124, 'https://maps.google.com/?q=23.7385,90.4124', true);
-- Restaurants 
-- (Added cuisine_type and descriptions to match schema)
INSERT INTO restaurants (restaurant_id, name, password, phone, email, location_id, average_rating, image_url, cuisine_type, descriptions) VALUES
(1, 'Black, Davis and Simon', 'hashed_password', '489-159-3776', 'sandra22@hotmail.com', 1, 3.32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 'American', 'Best burgers in town'),
(2, 'Atkinson, Price and Williams', 'hashed_password', '598-533-6698', 'randallmcintyre@gutierrez-carroll.com', 2, 3.77, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 'Healthy', 'Fresh salads and wraps'),
(3, 'Fisher PLC', 'hashed_password', '591-386-3262', 'millerdiana@yahoo.com', 3, 4.34, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80', 'Dessert', 'Sweet treats for everyone'),
(4, 'Robles LLC', 'hashed_password', '660-697-9159', 'suzanne68@navarro.biz', 4, 3.48, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80', 'Italian', 'Authentic pasta and pizza'),
(5, 'Cook LLC', 'hashed_password', '639-438-0388', 'kevin36@robinson.com', 5, 4.92, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', 'Pizza', 'Wood fired oven pizzas'),
(6, 'Dhakaiya Kacchi Ghar', 'hashed_password', '123-456-7890', 'dhakaiya@example.com', 6, 4.8, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80', 'Bengali', 'Authentic Kacchi Biryani and Bengali cuisine'),
(7, 'Lalbagh Kabab & Naan', 'hashed_password', '123-456-7891', 'lalbagh@example.com', 7, 4.6, 'https://images.unsplash.com/photo-1544025162-8a115ce92080?auto=format&fit=crop&w=800&q=80', 'Mughlai', 'Delicious grilled kababs and hot naan'),
(8, 'Dhaka University Cafe & Burgers', 'hashed_password', '123-456-7892', 'ducafe@example.com', 8, 4.4, 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=800&q=80', 'Fast Food', 'Popular burgers and fast food items for students'),
(9, 'Pizzaria Bella Italia', 'hashed_password', '123-456-7893', 'bella@example.com', 9, 4.7, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 'Italian', 'Wood-fired pizzas and creamy pastas'),
(10, 'Nourish Bowls & Salads', 'hashed_password', '123-456-7894', 'nourish@example.com', 10, 4.9, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 'Healthy', 'Fresh and organic salad bowls for healthy eating');
-- Restaurant Hours
INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time) VALUES 
(1, 'Mon', '10:00', '19:00'), (1, 'Sat', '09:00', '20:00'), (1, 'Sun', '08:00', '16:00'), (1, 'Thu', '10:00', '19:00'), (1, 'Wed', '11:00', '21:00'),
(2, 'Wed', '08:00', '18:00'), (2, 'Mon', '11:00', '21:00'), (2, 'Tue', '08:00', '16:00'), (2, 'Sun', '10:00', '19:00'), (2, 'Sat', '11:00', '21:00'),
(3, 'Tue', '10:00', '21:00'), (3, 'Thu', '11:00', '19:00'), (3, 'Sun', '10:00', '22:00'), (3, 'Mon', '10:00', '22:00'), (3, 'Fri', '08:00', '18:00'),
(4, 'Tue', '08:00', '17:00'), (4, 'Sat', '10:00', '20:00'), (4, 'Thu', '10:00', '20:00'), (4, 'Mon', '11:00', '19:00'), (4, 'Fri', '10:00', '22:00'),
(5, 'Tue', '10:00', '22:00'), (5, 'Fri', '08:00', '20:00'), (5, 'Thu', '09:00', '20:00'), (5, 'Sun', '09:00', '18:00'), (5, 'Wed', '08:00', '17:00'),
(6, 'Mon', '10:00', '22:00'), (6, 'Tue', '10:00', '22:00'), (6, 'Wed', '10:00', '22:00'), (6, 'Thu', '10:00', '22:00'), (6, 'Fri', '10:00', '22:00'), (6, 'Sat', '10:00', '22:00'), (6, 'Sun', '10:00', '22:00'),
(7, 'Mon', '10:00', '22:00'), (7, 'Tue', '10:00', '22:00'), (7, 'Wed', '10:00', '22:00'), (7, 'Thu', '10:00', '22:00'), (7, 'Fri', '10:00', '22:00'), (7, 'Sat', '10:00', '22:00'), (7, 'Sun', '10:00', '22:00'),
(8, 'Mon', '10:00', '22:00'), (8, 'Tue', '10:00', '22:00'), (8, 'Wed', '10:00', '22:00'), (8, 'Thu', '10:00', '22:00'), (8, 'Fri', '10:00', '22:00'), (8, 'Sat', '10:00', '22:00'), (8, 'Sun', '10:00', '22:00'),
(9, 'Mon', '10:00', '22:00'), (9, 'Tue', '10:00', '22:00'), (9, 'Wed', '10:00', '22:00'), (9, 'Thu', '10:00', '22:00'), (9, 'Fri', '10:00', '22:00'), (9, 'Sat', '10:00', '22:00'), (9, 'Sun', '10:00', '22:00'),
(10, 'Mon', '10:00', '22:00'), (10, 'Tue', '10:00', '22:00'), (10, 'Wed', '10:00', '22:00'), (10, 'Thu', '10:00', '22:00'), (10, 'Fri', '10:00', '22:00'), (10, 'Sat', '10:00', '22:00'), (10, 'Sun', '10:00', '22:00');
-- Menu Categories 
-- (Added dummy menu_category_image_url)
INSERT INTO menu_categories (category_id, restaurant_id, name, menu_category_image_url) VALUES 
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
(15, 10, 'Smoothies', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&h=300&q=80');
-- Menu Items
INSERT INTO menu_items (menu_item_id, category_id, name, description, price, is_available, is_active, menu_item_image_url) VALUES 
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
(22, 15, 'Mango Smoothie', 'Fresh mango blended with yogurt and honey.', 150.00, true, true, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&h=300&q=80');
-- Carts
INSERT INTO carts (cart_id, user_id, status) VALUES 
(1, 4, 'completed'),
(2, 4, 'completed'),
(3, 3, 'abandoned'),
(4, 3, 'active'),
(5, 1, 'abandoned');

-- Cart Items
INSERT INTO cart_item (cart_item_id, cart_id, menu_item_id, restaurant_id, quantity) VALUES 
(1, 1, 1, 1, 3),
(2, 2, 2, 2, 1),
(3, 3, 3, 3, 2),
(4, 4, 4, 4, 2),
(5, 5, 5, 5, 2);

-- Orders
-- Fixed status to match enum: 'pending' -> 'pending_restaurant_acceptance'
INSERT INTO orders (order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id) VALUES 
(1, 2, 1, 4, 'pending_restaurant_acceptance', 55.31, 'TRAN12345'),
(2, 1, 2, 4, 'preparing', 62.07, 'TRAN12346'),
(3, 4, 2, 4, 'delivered', 74.17, 'TRAN12347'),
(4, 5, 3, 5, 'preparing', 167.45, 'TRAN12348'),
(5, 3, 5, 5, 'cancelled', 73.94, 'TRAN12349');

-- Order Items
INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES 
(1, 1, 3, 8.53),
(2, 2, 1, 10.56),
(3, 3, 3, 5.22),
(4, 4, 3, 5.18),
(5, 5, 1, 16.79);

-- Payments
-- Fixed method_type to match enum: ('cod', 'sslcommerz')
INSERT INTO payments (payment_id, order_id, user_id, method_type, amount, status, tran_id) VALUES 
(1, 1, 1, 'sslcommerz', 67.59, 'paid', 'TRAN12345'),
(2, 2, 2, 'sslcommerz', 138.84, 'paid', 'TRAN12346'),
(3, 3, 3, 'cod', 191.65, 'paid', 'TRAN12347'),
(4, 4, 4, 'sslcommerz', 190.81, 'paid', 'TRAN12348'),
(5, 5, 5, 'sslcommerz', 48.94, 'paid', 'TRAN12349');

-- Deliveries
INSERT INTO deliveries (delivery_id, order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, status) VALUES 
(1, 1, 5, 1, -43.20373777, 33.6508777, '457 Ashley Knolls Suite 388 Adamshaven, TX 32134', 'delivered'),
(2, 2, 4, 2, 75.50168828, 172.99266574, '8075 James Lock Suite 682 North Paigeside, CA 76755', 'pending'),
(3, 3, 5, 3, 72.72274284, 114.64280732, '4104 Matthew Shoals North Julieshire, HI 45219', 'in_transit'),
(4, 4, 4, 4, -68.48824939, -97.68529082, '468 Lisa Curve Suite 868 North Jackshire, AK 56004', 'delivered'),
(5, 5, 5, 5, 28.50375148, 45.39484186, '4169 Daniel Walks Morrisonfort, WV 65432', 'in_transit');

-- Reviews
INSERT INTO reviews (review_id, user_id, restaurant_id, rider_id, rating, comment) VALUES 
(1, 2, 1, 2, 2.1, 'Factor matter look green former Republican maybe artist.'),
(2, 1, 2, 5, 1.5, 'Risk discover realize young drug standard baby kid.'),
(3, 2, 3, 4, 4.6, 'Child cultural sometimes.'),
(4, 1, 4, 2, 4.4, 'Painting hotel detail director off gas claim.'),
(5, 3, 5, 5, 4.3, 'Candidate learn heart sign.');

-- Notifications
INSERT INTO notifications (notification_id, user_id, target_type, target_id, order_id, type, message) VALUES 
(1, 1, 'rider', 2, 1, 'delivery_status', 'Discover color voice authority hospital.'),
(2, 2, 'restaurant', 1, 2, 'order_update', 'Usually quickly group whom my.'),
(3, 3, 'rider', 1, 3, 'order_update', 'Candidate seven cup term.'),
(4, 4, 'user', 4, 4, 'promotion', 'There wall than dream newspaper.');
-- Removed referencing order_id 5 for notification 5 because order 5 was cancelled, keeping data clean
INSERT INTO notifications (notification_id, user_id, target_type, target_id, order_id, type, message) VALUES 
(5, 5, 'restaurant', 4, 5, 'order_update', 'Happy one himself degree language point recent.');

-- Chats
INSERT INTO chats (chat_id, order_id, status, chat_type) VALUES 
(1, 1, 'open', 'support'),
(2, 2, 'open', 'support'),
(3, 3, 'open', 'support'),
(4, 4, 'open', 'support'),
(5, 5, 'open', 'order');

-- Chat Participants
INSERT INTO chat_participants (chat_id, user_id, role) VALUES 
(1, 1, 'rider'),
(2, 2, 'restaurant'),
(3, 3, 'restaurant'),
(4, 4, 'restaurant'),
(5, 5, 'rider');

-- Chat Messages
INSERT INTO chat_messages (message_id, chat_id, sender_id, message, status) VALUES 
(1, 1, 1, 'Take leg age guy final.', 'delivered'),
(2, 2, 2, 'Deal stop worry must but according instead.', 'read'),
(3, 3, 3, 'Section identify benefit exist concern chair east.', 'read'),
(4, 4, 4, 'Protect knowledge may laugh responsibility nearly question.', 'delivered'),
(5, 5, 5, 'Movie despite should condition relate style somebody.', 'delivered');

-- Update sequences to avoid conflicts when adding new data later
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('restaurants_restaurant_id_seq', (SELECT MAX(restaurant_id) FROM restaurants));
SELECT setval('user_locations_location_id_seq', (SELECT MAX(location_id) FROM user_locations));
SELECT setval('menu_categories_category_id_seq', (SELECT MAX(category_id) FROM menu_categories));
SELECT setval('menu_items_menu_item_id_seq', (SELECT MAX(menu_item_id) FROM menu_items));
SELECT setval('carts_cart_id_seq', (SELECT MAX(cart_id) FROM carts));
SELECT setval('cart_item_cart_item_id_seq', (SELECT MAX(cart_item_id) FROM cart_item));
SELECT setval('orders_order_id_seq', (SELECT MAX(order_id) FROM orders));
SELECT setval('payments_payment_id_seq', (SELECT MAX(payment_id) FROM payments));
SELECT setval('deliveries_delivery_id_seq', (SELECT MAX(delivery_id) FROM deliveries));
SELECT setval('reviews_review_id_seq', (SELECT MAX(review_id) FROM reviews));
SELECT setval('notifications_notification_id_seq', (SELECT MAX(notification_id) FROM notifications));
SELECT setval('chats_chat_id_seq', (SELECT MAX(chat_id) FROM chats));
SELECT setval('chat_messages_message_id_seq', (SELECT MAX(message_id) FROM chat_messages));