# Database Seeding Guide

This guide explains how to properly wipe, recreate, and seed the Food Panda database at any time (e.g., if you come back after a month and want the dashboard charts to show recent, active data).

## Test Accounts

The dummy data generators are specifically configured to create orders and analytics for the following test accounts. You can log into these accounts to view the populated data:

- **Customer**: `customer1@gmail.com`
- **Restaurant**: `restaurant1@gmail.com`
- **Rider**: `rider1@gmail.com`

> [!NOTE]
> *The passwords for these accounts are standard across the dummy data, usually `password123` or whatever you have set for testing.*

---

## Step 1: Wipe the Database Clean

If you have old data and want to reset the database to a clean slate, run the following command in your terminal. This forces PostgreSQL to drop the old schema and recreate it completely empty.

```bash
docker exec -i food_panda_postgres_db psql -U postgres -d food_panda -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Step 2: Rebuild the Schema

Next, apply the schema blueprint to recreate all tables and triggers:

```bash
cat food_panda.sql | docker exec -i food_panda_postgres_db psql -U postgres -d food_panda
```

---

## Step 3: Insert Base Seed Data

Insert the base level data (including the `restaurant1`, `customer1`, and `rider1` test accounts, plus default menu items and locations):

```bash
cat populate.sql | docker exec -i food_panda_postgres_db psql -U postgres -d food_panda
```

---

## Step 4: Generate Fresh Analytics Data (No Wiping Required!)

**This is the most important step if you want fresh charts!** If you come back after a month, the original `populate.sql` data will appear to be 30 days old and drop off your dashboards. 

You **DO NOT** need to wipe your database and lose your own manually created data. You can just generate a brand new batch of hundreds of dummy orders spanning the *last 30 days* by running these three scripts:

```bash
# 1. Generate 300 random orders for the restaurant over the last 30 days
node backend/scripts/populate_more_orders.js

# 2. Generate positive reviews to boost the restaurant's average rating
node backend/scripts/populate_reviews.js

# 3. Generate 100 recent deliveries specifically for the Rider dashboard
node backend/scripts/generate_rider_orders_dynamic.js
```

**Note:** The rider script generates orders for a placeholder account (rider_id 4). After running it, quickly remap those new deliveries to the `rider1@gmail.com` test account using this command:

```bash
docker exec -i food_panda_postgres_db psql -U postgres -d food_panda -c "UPDATE deliveries SET rider_id = (SELECT user_id FROM users WHERE email = 'rider1@gmail.com') WHERE rider_id = 4; UPDATE orders SET rider_id = (SELECT user_id FROM users WHERE email = 'rider1@gmail.com') WHERE rider_id = 4; UPDATE reviews SET rider_id = (SELECT user_id FROM users WHERE email = 'rider1@gmail.com') WHERE rider_id = 4;"
```

Once these scripts finish, all of your dashboards (Customer, Restaurant, and Rider) will be instantly populated with beautiful, recent analytics data, while keeping your manual data perfectly intact!
