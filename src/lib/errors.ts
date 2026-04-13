export function isDatabaseUnavailableError(error: unknown) {
  const asError = error instanceof Error ? error : new Error(String(error));
  const message = asError.message || "";

  return (
    message.includes("P1001") ||
    message.includes("P1002") ||
    message.includes("P2024") ||
    message.includes("Can't reach database server") ||
    message.includes("PrismaClientInitializationError") ||
    message.includes("DATABASE_TIMEOUT")
  );
}
