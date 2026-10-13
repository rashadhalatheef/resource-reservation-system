import { prisma } from "./prisma";

export function logActivity(userId: string | null, action: string, details: string) {
  return prisma.activityLog.create({ data: { userId, action, details } });
}
