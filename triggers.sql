CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION get_distance_km(
    lon1 DOUBLE PRECISION,
    lat1 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    dist DOUBLE PRECISION;
BEGIN
    dist := ST_Distance(
        ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
    );
    RETURN dist / 1000.0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_restaurant_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE restaurants
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE restaurant_id = NEW.restaurant_id
        )
        WHERE restaurant_id = NEW.restaurant_id;
    END IF;
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        UPDATE restaurants
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE restaurant_id = OLD.restaurant_id
        )
        WHERE restaurant_id = OLD.restaurant_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_average_rating ON reviews;
CREATE TRIGGER trigger_update_average_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_average_rating();

CREATE OR REPLACE FUNCTION upsert_restaurant_hours(
    p_restaurant_id INT,
    p_hours JSONB
)
RETURNS VOID AS $$
DECLARE
    hour_record JSONB;
BEGIN
    FOR hour_record IN SELECT * FROM jsonb_array_elements(p_hours)
    LOOP
        INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time)
        VALUES (
            p_restaurant_id,
            (hour_record->>'day_of_week')::day_of_week,
            (hour_record->>'open_time')::time,
            (hour_record->>'close_time')::time
        )
        ON CONFLICT (restaurant_id, day_of_week)
        DO UPDATE SET 
            open_time = EXCLUDED.open_time,
            close_time = EXCLUDED.close_time;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_deleted_menu_item()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO archived_menu_items SELECT OLD.*;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS archive_menu_item_trigger ON menu_items;
CREATE TRIGGER archive_menu_item_trigger
BEFORE DELETE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION archive_deleted_menu_item();

