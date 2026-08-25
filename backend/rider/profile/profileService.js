import prisma from "../../prismaClient.js";
import { AppError } from "../../middleware/errorHandler.js";
import redisClient from "../../utils/redisClient.js";

export const getRiderProfile = async (riderId) => {
  const user = await prisma.users.findUnique({
    where: { user_id: riderId },
    include: {
      rider_profiles: true,
      user_locations: {
        where: { is_primary: true },
        take: 1,
      },
    },
  });

  if (!user || user.role_id !== "rider") {
    throw new AppError("Rider not found", 404);
  }

  const loc = user.user_locations?.[0];

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    vehicle_type: user.rider_profiles?.vehicle_type || null,
    current_location: user.rider_profiles?.current_location || null,
    is_available: user.rider_profiles?.is_available ?? true,
    latitude: loc?.latitude ? Number(loc.latitude) : null,
    longitude: loc?.longitude ? Number(loc.longitude) : null,
  };
};

export const updateRiderProfile = async (riderId, data) => {
  const { name, phone_number, phone, vehicle_type, latitude, longitude } = data;
  const phoneNumber = phone_number || phone || undefined;

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.users.update({
      where: { user_id: riderId },
      data: {
        name: name || undefined,
        phone_number: phoneNumber,
      },
    });

    const updatedProfile = await tx.rider_profiles.upsert({
      where: { user_id: riderId },
      update: {
        vehicle_type: vehicle_type !== undefined ? vehicle_type : undefined,
      },
      create: {
        user_id: riderId,
        vehicle_type: vehicle_type || null,
        is_available: true,
      },
    });

    if (latitude != null && longitude != null) {
      const existingLoc = await tx.user_locations.findFirst({
        where: { user_id: riderId },
      });

      if (existingLoc) {
        await tx.user_locations.update({
          where: { location_id: existingLoc.location_id },
          data: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            is_primary: true,
          },
        });
      } else {
        await tx.user_locations.create({
          data: {
            user_id: riderId,
            latitude: Number(latitude),
            longitude: Number(longitude),
            is_primary: true,
          },
        });
      }

      if (redisClient.isOpen) {
        try {
          await redisClient.geoAdd("active_riders", {
            longitude: Number(longitude),
            latitude: Number(latitude),
            member: riderId.toString(),
          });
        } catch (e) {}
      }
    }

    return {
      message: "Profile updated successfully",
      profile: {
        name: updatedUser.name,
        phone_number: updatedUser.phone_number,
        vehicle_type: updatedProfile.vehicle_type,
        is_available: updatedProfile.is_available,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    };
  });
};

export const updateRiderAvailability = async (riderId, isAvailable) => {
  const statusBool = Boolean(isAvailable);

  const updatedProfile = await prisma.rider_profiles.update({
    where: { user_id: riderId },
    data: { is_available: statusBool },
  });

  if (!statusBool && redisClient.isOpen) {
    try {
      await redisClient.zRem("active_riders", riderId.toString());
    } catch (e) {}
  }

  return {
    message: `Availability updated to ${statusBool ? "available" : "offline"}`,
    is_available: updatedProfile.is_available,
  };
};
