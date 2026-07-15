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

## Step 4: Generate Fresh Analytics Data

**This is the most important step!** If you come back after a month, the original `populate.sql` data will appear to be 30 days old. 

To get a fresh set of 300 orders and reviews generated dynamically for the *current* date, run these two scripts from the root directory:

```bash
# 1. Generate 300 random orders for restaurant1@gmail.com over the last 30 days
node backend/populate_more_orders.js

# 2. Generate positive reviews to boost the average rating
node backend/populate_reviews.js
```

Once these scripts finish, the `restaurant1@gmail.com` dashboard will be fully populated with beautiful, recent analytics data!
