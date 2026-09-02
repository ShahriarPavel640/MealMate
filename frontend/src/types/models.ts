// User / Customer
export interface User {
  user_id: number;
  name: string;
  email: string;
  phone_number?: string;
  profile_pic?: string;
  address?: string | { street?: string; city?: string; postal_code?: string };
  latitude?: number;
  longitude?: number;
  location?: { latitude?: number; longitude?: number };
  role?: 'customer';
  user?: { name?: string; email?: string };
}

// Restaurant
export interface Restaurant {
  restaurant_id: number;
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  description?: string;
  descriptions?: string;
  image?: string;
  image_url?: string;
  logo?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  opening_hours?: string;
  avg_rating?: number;
  average_rating?: number | string;
  rating?: number | string;
  is_open?: boolean;
  is_favorite?: boolean;
  distance?: number;
  category?: string;
  role?: 'restaurant';
}

// Rider
export interface Rider {
  rider_id: number;
  name: string;
  email: string;
  phone_number?: string;
  vehicle_type?: string;
  is_available?: boolean;
  latitude?: number;
  longitude?: number;
  role?: 'rider';
}

// Menu
export interface MenuItem {
  menu_item_id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  menu_item_image_url?: string;
  category?: string;
  category_id?: number;
  category_name?: string;
  menu_category_image_url?: string;
  is_available?: boolean;
  isPopular?: boolean;
  isVegetarian?: boolean;
  discount?: number;
  prep_time?: number;
  order_count?: number;
  created_at?: string;
}

// Cart
export interface CartItem {
  cart_item_id: number;
  menu_item_id: number;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  restaurant_id?: number;
  restaurant_name?: string;
}

// Order
export interface Order {
  order_id: number;
  user_id: number;
  restaurant_id: number;
  rider_id?: number;
  status: OrderStatus;
  total_price: number;
  delivery_fee?: number;
  delivery_address?: string;
  special_instructions?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  restaurant?: Restaurant;
  rider?: Rider;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'restaurant_rejected';

export interface OrderItem {
  order_item_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  name?: string;
}

// Notification
export interface Notification {
  notification_id?: number;
  type?: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

// Chat
export interface ChatMessage {
  message_id?: number;
  order_id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  created_at?: string;
}

// Review
export interface Review {
  review_id: number;
  user_id: number;
  restaurant_id?: number;
  rider_id?: number;
  order_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// API Response Wrappers
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

// Auth User Union (used in App.tsx for currentAuthUser)
export type AuthUser =
  | (User & { role: 'customer' })
  | (Restaurant & { role: 'restaurant' })
  | (Rider & { role: 'rider' });
