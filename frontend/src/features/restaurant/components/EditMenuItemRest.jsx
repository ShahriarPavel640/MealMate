import { useState, useEffect } from "react";
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
import { Badge } from "@/features/restaurant/components/ui/badge";
import { ArrowLeft, Upload, Save, Eye, EyeOff } from "lucide-react";
import { restaurantAuthStore } from "@/features/restaurant/store/restaurantAuthStore";



const EditMenuItemRest = ({ item, onBack, onSave }) => {
  const { isChangingMenu } = restaurantAuthStore();

  const [formData, setFormData] = useState({
    menu_item_id: item?.menu_item_id || "",
    name: "",
    description: "",
    price: "",
    category: "",
    menu_item_image_url: "",
    is_available: true,
    discount: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData({
        menu_item_id: item.menu_item_id,
        name: item.name || "",
        description: item.description || "",
        price: item.price || "",
        category: item.category_name || item.category || "",
        menu_item_image_url: item.menu_item_image_url || "",
        is_available: item.is_available,
        discount: item.discount || "",
      });
      setImagePreview(item.menu_item_image_url || null);
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("menu_item_id", formData.menu_item_id);
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("price", formData.price);
    payload.append("category", formData.category);
    payload.append("is_available", formData.is_available ? "true" : "false");
    payload.append("discount", formData.discount);

    if (imageFile) {
      payload.append("image", imageFile);
    } else {
      payload.append("menu_item_image_url", formData.menu_item_image_url);
    }

    await onSave(payload);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      is_available: !prev.is_available,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (!item) return <div className="text-white">Item not found</div>;
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
          <h1 className="text-2xl font-bold">Edit Menu Item</h1>
          <p className="text-gray-400">Update your menu item details</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="bg-gray-900 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">Item Details</CardTitle>
            <CardDescription className="text-gray-200">
              Fill in the updated information for your menu item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Item Image</Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
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
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-4 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>

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
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge
                  className={
                    formData.is_available ? "bg-green-500" : "bg-gray-600"
                  }
                >
                  {formData.is_available ? "active" : "inactive"}
                </Badge>
                <Button variant="outline" onClick={toggleStatus}>
                  {formData.is_available ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {formData.is_available ? "Set Inactive" : "Set Active"}
                  </span>
                </Button>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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

export default EditMenuItemRest;
