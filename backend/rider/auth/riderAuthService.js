import prisma from "../../prismaClient.js";
import bcrypt from "bcrypt";
import { AppError } from "../../middleware/errorHandler.js";

export const signup = async (data) => {
  const {
    name,
    email,
    password,
    phone_number,
    vehicle_type,
    current_location,
    latitude,
    longitude,
    is_available = true,
  } = data;

  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const saltRound = 10;
  const salt = await bcrypt.genSalt(saltRound);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newRider = await prisma.$transaction(async (tx) => {
    // Insert into users
    const user = await tx.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        role_id: "rider",
      },
    });

    // Insert into rider_profiles
    const profile = await tx.rider_profiles.create({
      data: {
        user_id: user.user_id,
        vehicle_type,
        current_location,
        is_available,
      },
    });

    // Insert into user_locations (if coordinates provided)
    if (latitude != null && longitude != null) {
      await tx.user_locations.create({
        data: {
          user_id: user.user_id,
          latitude,
          longitude,
          is_primary: true,
        },
      });
    }

    return { user, profile };
  });

  const { password: _, ...userDto } = newRider.user;
  
  return {
    user: userDto,
    profile: newRider.profile,
  };
};

export const login = async (email, password) => {
  const user = await prisma.users.findFirst({
    where: {
      email,
      role_id: "rider",
    },
    include: {
      rider_profiles: true,
    },
  });

  if (!user) {
    throw new AppError("Rider not found. Check your email.", 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  const { password: _, ...userDto } = user;

  return {
    user: userDto,
    profile: user.rider_profiles || {},
  };
};

export const verifyUser = async (id) => {
  const user = await prisma.users.findUnique({
    where: {
      user_id: id,
    },
    include: {
      rider_profiles: true,
    },
  });

  if (!user || user.role_id !== "rider") {
    throw new AppError("Rider not found.", 404);
  }

  const { password: _, ...userDto } = user;

  return {
    user: userDto,
    profile: user.rider_profiles || {},
  };
};
