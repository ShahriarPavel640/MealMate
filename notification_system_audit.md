# Notification System Audit

This document outlines the current state of notifications across the application and provides an evaluation of whether these cases are optimal, what should be removed, and what should be added.

## 1. Customer Notifications

### Current Cases
1. **Order Accepted by Restaurant**: When the restaurant accepts their order (status changes to `preparing`).
2. **Order Rejected by Restaurant**: If the restaurant rejects the order (status changes to `restaurant_rejected`).
3. **General Order Status Updates**: Whenever the restaurant manually updates the order status (e.g., marking it as `ready_for_pickup`, `delivered`).
4. **Rider Assigned**: When a rider accepts the delivery, an `order_accepted` socket event is fired and a DB record is inserted.
5. **New Chat Messages**: Emits a `receive_message` socket event for incoming chats.

### Evaluation
* **Are these cases perfect?** Yes, customers are highly invested in their food's journey. Keeping them informed at every state change reduces support tickets and anxiety.
* **What to Remove?** None. All these notifications are essential for a good user experience.
* **What to Add?**
  * **Rider is Nearby:** If we implement live tracking, sending a "Your rider is arriving in 2 minutes" notification is a great touch so the customer can head to the door.

---

## 2. Restaurant Notifications

### Current Cases
1. **New Order Placed**: When a customer successfully places an order, the restaurant gets a `new_order` socket event and DB record.
2. **Rider Assigned**: When a rider accepts the order for delivery, the restaurant receives an `order_accepted` socket event and DB record.
3. **Action Echoes**: When the restaurant accepts or rejects an order via their socket dashboard, they receive an immediate echo `order_status_updated` event to update their UI.

### Evaluation
* **Are these cases perfect?** Mostly. The restaurant needs to know when to start cooking and who is picking it up.
* **What to Remove?** The **Action Echoes** are slightly redundant if the frontend optimistically updates the UI when a button is clicked. However, it *is* useful if the restaurant has multiple tablets open (e.g., one at the register, one in the kitchen) so they stay synced. Keep it for now.
* **What to Add?**
  * **Rider Arrived:** A notification when the rider physically arrives at the restaurant. This helps the kitchen prioritize bagging the food and handing it off, reducing the crowd of waiting riders.
  * **Customer Cancelled:** If a customer is allowed to cancel an order (e.g., within 5 minutes of placing it), the restaurant MUST be notified immediately to stop cooking.

---

## 3. Rider Notifications

### Current Cases
1. **New Delivery Available**: When a restaurant marks an order as `ready_for_pickup`, the backend broadcasts a `new_delivery` socket event to the `"riders"` room. It also loops through all available riders and inserts a DB notification for every single one of them.
2. **New Chat Messages**: Emits a `receive_message` socket event for incoming chats.

### Evaluation
* **Are these cases perfect?** **NO.** The rider notifications have a critical flaw in how they are stored in the database.
* **What to Remove?**
  * **The Mass Database Insert:** Broadcasting the `socket` event to all riders is great. However, looping over `availableRiders` and inserting a row into the `notifications` table for *every single online rider* is extremely inefficient and will bloat the database massively. If 100 riders are online, 1 order creates 100 DB rows, but only 1 rider will accept it. We should **remove** the mass DB insert. We only need the real-time socket popup.
* **What to Add?**
  * **Order Cancelled:** If the rider has accepted an order, but the customer or restaurant cancels it while the rider is en route to the restaurant, the rider MUST get a notification so they don't waste gas driving there.
  * **Customer Not Responsive:** If the rider is at the drop-off and the customer isn't responding, the system should allow the rider to trigger a high-priority "Your rider is waiting" ping to the customer.
