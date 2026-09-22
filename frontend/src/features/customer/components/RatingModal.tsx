import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/features/restaurant/components/ui/dialog";
import { Button } from "@/features/restaurant/components/ui/button";
import { Textarea } from "@/features/restaurant/components/ui/textarea";
import { Label } from "@/features/restaurant/components/ui/label";
import { Star } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export interface RatingTarget {
  type: "restaurant" | "rider";
  id?: number | string;
  orderId: number | string;
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: RatingTarget | null;
  onReviewSubmitted: (type: "restaurant" | "rider") => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  target,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
      setHoverRating(0);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide a rating.");
      return;
    }

    if (!target) return;

    setIsSubmitting(true);
    try {
      const reviewData: {
        rating: number;
        comment: string;
        order_id: number | string;
        restaurant_id?: number | string;
        rider_id?: number | string;
      } = {
        rating,
        comment,
        order_id: target.orderId,
      };

      if (target.type === "restaurant") {
        reviewData.restaurant_id = target.id;
        await axiosInstance.post("/customer/review/restaurant", reviewData);
        toast.success("Restaurant review submitted successfully!");
      } else if (target.type === "rider") {
        reviewData.rider_id = target.id;
        await axiosInstance.post("/customer/review/rider", reviewData);
        toast.success("Rider review submitted successfully!");
      }
      onReviewSubmitted(target.type);
      onClose();
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      const apiErr = error as { response?: { status?: number; data?: { message?: string } } };
      if (apiErr?.response?.status === 409) {
        toast.error(apiErr.response.data?.message || "Already reviewed.");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Rate {target?.type === "restaurant" ? "Restaurant" : "Rider"}
          </DialogTitle>
          <DialogDescription>
            Share your experience by rating and leaving a comment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="rating" className="text-right">
              Rating:
            </Label>
            <div className="flex">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <Star
                    key={starValue}
                    className={`cursor-pointer ${
                      starValue <= (hoverRating || rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    size={28}
                    fill={
                      starValue <= (hoverRating || rating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                );
              })}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comment:</Label>
            <Textarea
              id="comment"
              placeholder="Leave your comments here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="col-span-3 text-gray-300"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
