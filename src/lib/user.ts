import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { isDatabaseUnavailableError } from "@/lib/errors";

const DB_OPERATION_TIMEOUT_MS = 8000;

function databaseTimeoutError() {
  return new Error("DATABASE_TIMEOUT");
}

async function withDbTimeout<T>(operation: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(databaseTimeoutError()), DB_OPERATION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function emailFromClaims(claims: unknown) {
  if (!claims || typeof claims !== "object") {
    return null;
  }

  const record = claims as Record<string, unknown>;
  const raw = record.email ?? record.email_address ?? record.primary_email_address;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function requireDbUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return null;
  }

  let primaryEmail = emailFromClaims(sessionClaims);

  try {
    const clerkUser = await currentUser();
    const currentUserEmail = clerkUser?.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (currentUserEmail) {
      primaryEmail = currentUserEmail;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Clerk currentUser() failed, falling back to session claims.", error);
    }
  }

  if (!primaryEmail) {
    try {
      const existingUser = await withDbTimeout(db.user.findUnique({ where: { clerkId: userId } }));
      if (existingUser) {
        return existingUser;
      }

      primaryEmail = `${userId}@clerk.local`;
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        throw new Error("DATABASE_UNAVAILABLE");
      }
      throw error;
    }
  }

  try {
    const existingByClerkId = await withDbTimeout(db.user.findUnique({ where: { clerkId: userId } }));

    if (existingByClerkId) {
      if (existingByClerkId.email === primaryEmail) {
        return existingByClerkId;
      }

      try {
        return await withDbTimeout(db.user.update({
          where: { id: existingByClerkId.id },
          data: { email: primaryEmail },
        }));
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          // Keep auth flow working when email is already linked to another row.
          return existingByClerkId;
        }
        throw error;
      }
    }

    try {
      return await withDbTimeout(db.user.create({
        data: {
          clerkId: userId,
          email: primaryEmail,
        },
      }));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingByEmail = await withDbTimeout(db.user.findUnique({ where: { email: primaryEmail } }));
        if (existingByEmail) {
          return await withDbTimeout(db.user.update({
            where: { id: existingByEmail.id },
            data: { clerkId: userId },
          }));
        }
      }
      throw error;
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("DATABASE_UNAVAILABLE");
    }
    throw error;
  }
}
