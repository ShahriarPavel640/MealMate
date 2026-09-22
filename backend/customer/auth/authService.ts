import { Prisma } from '@prisma/client';
import prisma from '@/prismaClient.js';
import bcrypt from 'bcrypt';
import { AppError } from '@/middleware/errorHandler.js';
import { z } from 'zod';
import { signupSchema, loginSchema, changePasswordSchema, updateProfileSchema } from './authSchemas.js';

export const signup = async (data: z.infer<typeof signupSchema>) => {
  const { name, email, password, phone_number, latitude, longitude } = data;
  const role_id = 'customer';

  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('user already exist', 409);
  }

  const saltRound = 10;
  const salt = await bcrypt.genSalt(saltRound);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Use a Prisma transaction to insert both user and location
  const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        role_id,
      },
    });

    let addressData: {
      latitude: Prisma.Decimal | number | null;
      longitude: Prisma.Decimal | number | null;
      street: string;
      city: string;
      postal_code: string;
    } = {
      latitude: null,
      longitude: null,
      street: '',
      city: '',
      postal_code: '',
    };

    if (latitude !== null && longitude !== null) {
      const location = await tx.user_locations.create({
        data: {
          user_id: user.user_id,
          latitude,
          longitude,
          is_primary: true,
        },
      });
      addressData.latitude = location.latitude;
      addressData.longitude = location.longitude;
    }

    return { user, addressData };
  });

  // Return DTO without password
  const { password: _, ...userDto } = newUser.user;

  return {
    user: userDto,
    location: {
      latitude: newUser.addressData.latitude,
      longitude: newUser.addressData.longitude,
    },
    address: {
      street: newUser.addressData.street,
      city: newUser.addressData.city,
      postal_code: newUser.addressData.postal_code,
    },
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.users.findFirst({
    where: {
      email,
      role_id: 'customer',
    },
    include: {
      user_locations: {
        where: { is_primary: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new AppError('User not found. Please check your email or sign up.', 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new AppError('Invalid email or password.', 401);
  }

  const address = user.user_locations[0] || {};

  // Return DTO without password
  const { password: _, ...userDto } = user;

  return {
    user: userDto,
    location: {
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
    },
    address: {
      street: address.street ?? '',
      city: address.city ?? '',
      postal_code: address.postal_code ?? '',
    },
  };
};

export const changePassword = async (id: number, prevPassword: string, newPassword: string) => {
  const user = await prisma.users.findUnique({
    where: { user_id: id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const validPassword = await bcrypt.compare(prevPassword, user.password);
  if (!validPassword) {
    throw new AppError('invalid previous password', 401);
  }

  const saltRound = 10;
  const salt = await bcrypt.genSalt(saltRound);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.users.update({
    where: { user_id: id },
    data: { password: hashedPassword },
  });

  return { message: 'Password changed successfully..' };
};

export const verifyUser = async (id: number) => {
  const user = await prisma.users.findUnique({
    where: { user_id: id },
    include: {
      user_locations: {
        where: { is_primary: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.user_locations[0] || {};

  // DTO
  const { password: _, ...userDto } = user;

  return {
    user: userDto,
    location: {
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
    },
    address: {
      street: address.street ?? '',
      city: address.city ?? '',
      postal_code: address.postal_code ?? '',
    },
  };
};

export const getProfile = async (id: number) => {
  const user = await prisma.users.findUnique({
    where: { user_id: id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password: _, ...userDto } = user;
  return [userDto]; // The old controller returned an array [result.rows]
};

export const updateProfile = async (id: number, data: z.infer<typeof updateProfileSchema>) => {
  const { name, phone, location, address } = data;

  const latitude = location?.lat;
  const longitude = location?.lng;

  const street = address?.street ?? '';
  const city = address?.city ?? '';
  const postal_code = address?.postal_code ?? '';

  const updatedData = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update Name and Phone
    const user = await tx.users.update({
      where: { user_id: id },
      data: {
        name,
        phone_number: phone,
      },
    });

    // 2. Handle Location (Upsert logic from before)
    let locResult;
    if (latitude != null && longitude != null) {
      // Find existing primary location to update
      const existing = await tx.user_locations.findFirst({
        where: { user_id: id },
      });

      if (existing) {
        locResult = await tx.user_locations.update({
          where: { location_id: existing.location_id },
          data: { latitude, longitude, street, city, postal_code },
        });
      } else {
        locResult = await tx.user_locations.create({
          data: { user_id: id, latitude, longitude, street, city, postal_code, is_primary: true },
        });
      }
    } else if (street || city || postal_code) {
      const existing = await tx.user_locations.findFirst({
        where: { user_id: id },
      });

      if (existing) {
        locResult = await tx.user_locations.update({
          where: { location_id: existing.location_id },
          data: { street, city, postal_code },
        });
      } else {
        locResult = await tx.user_locations.create({
          data: { user_id: id, street, city, postal_code, is_primary: true },
        });
      }
    }

    return { user, locResult };
  });

  const { password: _, ...userDto } = updatedData.user;
  return {
    user: userDto,
    location: {
      latitude,
      longitude,
    },
    address: {
      street,
      city,
      postal_code,
    },
  };
};
