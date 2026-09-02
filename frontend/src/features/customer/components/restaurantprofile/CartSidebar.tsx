import React from "react";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { Button } from "@/features/restaurant/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/features/restaurant/components/ui/sheet";
import { Badge } from "@/features/restaurant/components/ui/badge";
import { Separator } from "@/features/restaurant/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/types/models";

interface CartSidebarProps {
  cartItems: CartItem[];
  onUpdateQuantity: (menuItemId: number, quantity: number) => void;
  onRemoveItem: (cartItemId: number) => void;
}

export function CartSidebar({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
}: CartSidebarProps): React.JSX.Element {
  const navigate = useNavigate();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );
  const uniqueRestaurants = new Set(cartItems.map((item) => item.restaurant_id)).size;
  const deliveryFee = uniqueRestaurants > 0 ? uniqueRestaurants * 30 : 0;
  const total = subtotal + deliveryFee;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl z-50 bg-[#e21b70] hover:bg-[#c2145d] text-white hover:scale-110 transition-transform duration-300">
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-pink-600 text-white">
                {totalItems}
              </Badge>
            )}
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-l border-gray-100 dark:border-gray-800 shadow-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-2xl">
            <ShoppingBag className="h-6 w-6 text-[#e21b70]" />
            Your Cart ({totalItems} items)
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-500">
                  Add items to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.cart_item_id}
                    className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <img
                      src={item.image || (item as any).menu_item_image_url}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl shadow-sm"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-md mb-1 line-clamp-1">{item.name}</h4>
                      <p className="text-pink-500 font-semibold">
                        Tk {item.price}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 rounded-full"
                            onClick={() =>
                              onUpdateQuantity(
                                item.menu_item_id,
                                Math.max(0, item.quantity - 1)
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 rounded-full"
                            onClick={() =>
                              onUpdateQuantity(
                                item.menu_item_id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={() => onRemoveItem(item.cart_item_id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Tk {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>Tk {deliveryFee.toFixed(2)}</span>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>Tk {total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-[#e21b70] hover:bg-[#c2145d] text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-bold"
                size="lg"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
