import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/restaurant/components/ui/card";
import { Button } from "@/features/restaurant/components/ui/button";
import { Input } from "@/features/restaurant/components/ui/input";
import { Label } from "@/features/restaurant/components/ui/label";
import { Textarea } from "@/features/restaurant/components/ui/textarea";
import { ArrowLeft, Upload, Save, Sparkles, Loader2 } from "lucide-react";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { MenuItem } from "@/types/models";

interface AddMenuItemRestProps {
  onBack: () => void;
  onSave: (item: MenuItem) => void;
}

export const AddMenuItemRest: React.FC<AddMenuItemRestProps> = ({ onBack, onSave }) => {
  const { add_menu_item, isChangingMenu } = restaurantAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    discount: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast.error("Please enter an item name first to generate a description");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await axiosInstance.post("/ai/generate-description", { name: formData.name });
      setFormData((prev) => ({ ...prev, description: res.data.description }));
      toast.success("Description generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate description");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formPayload = new FormData();
    formPayload.append("name", formData.name);
    formPayload.append("description", formData.description);
    formPayload.append("price", formData.price);
    formPayload.append("category", formData.category);
    formPayload.append("discount", formData.discount);
    formPayload.append("is_available", "true");
    if (imageFile) {
      formPayload.append("image", imageFile);
    }

    const savedItem = await add_menu_item(formPayload);
    if (savedItem) {
      onSave(savedItem);
      onBack();
    } else {
      toast.error("failed adding menu");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isChangingMenu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-semibold">Updating menu item...</p>
          <p className="text-gray-400 text-sm">
            Please wait while we save your changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-white bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Menu</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Menu Item</h1>
          <p className="text-gray-400">
            Create a new item for your restaurant menu
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card className="bg-gray-900 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">Item Details</CardTitle>
            <CardDescription className="text-gray-200">
              Fill in the information for your new menu item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Item Image</Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-500 transition-colors relative">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto mb-4 h-32 object-cover rounded"
                    />
                  )}
                  <p className="text-sm text-gray-400 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-4 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Margherita Pizza"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !formData.name}
                    className="h-8 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 hover:from-indigo-600 hover:to-purple-600"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your menu item ingredients and preparation..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      Tk
                    </span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    name="category"
                    type="text"
                    placeholder="e.g. Pizza"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    Tk
                  </span>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Menu Item
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
