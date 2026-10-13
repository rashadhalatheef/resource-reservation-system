import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { parseLocalInput, dayRange, todayInTz } from "../src/lib/time";

const prisma = new PrismaClient();

async function main() {
  const types: Record<string, string> = {};
  for (const name of ["Meeting Room", "Equipment", "Vehicle", "Lab"]) {
    const t = await prisma.resourceType.upsert({ where: { name }, update: {}, create: { name } });
    types[name] = t.id;
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash: hashPassword("admin123"), role: "ADMIN" },
    create: { name: "Admin User", email: "admin@example.com", role: "ADMIN", passwordHash: hashPassword("admin123") },
  });
  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: { passwordHash: hashPassword("member123") },
    create: { name: "Sample Member", email: "member@example.com", passwordHash: hashPassword("member123") },
  });

  const resources = [
    { name: "Boardroom", type: "Meeting Room", location: "Floor 2", capacity: 12, amenities: "Projector, Whiteboard, Video call" },
    { name: "Small Meeting Room", type: "Meeting Room", location: "Floor 1", capacity: 4, amenities: "Whiteboard, TV screen" },
    { name: "Portable Projector", type: "Equipment", location: "IT store", capacity: null, amenities: "HDMI, Carry case" },
    { name: "Company Van", type: "Vehicle", location: "Parking bay 3", capacity: 8, amenities: "Air conditioning" },
  ];
  for (const r of resources) {
    const existing = await prisma.resource.findFirst({ where: { name: r.name } });
    if (existing) {
      await prisma.resource.update({ where: { id: existing.id }, data: { amenities: r.amenities } });
    } else {
      await prisma.resource.create({
        data: { name: r.name, location: r.location, capacity: r.capacity, amenities: r.amenities, resourceTypeId: types[r.type] },
      });
    }
  }

  // A few sample reservations so the calendar and dashboard are not empty on first run
  if ((await prisma.reservation.count()) === 0) {
    const tomorrow = new Date(dayRange(todayInTz()).start.getTime() + 36 * 3_600_000)
      .toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
    const dayAfter = new Date(dayRange(todayInTz()).start.getTime() + 60 * 3_600_000)
      .toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
    const board = await prisma.resource.findFirstOrThrow({ where: { name: "Boardroom" } });
    const small = await prisma.resource.findFirstOrThrow({ where: { name: "Small Meeting Room" } });
    const proj = await prisma.resource.findFirstOrThrow({ where: { name: "Portable Projector" } });
    const samples = [
      { r: board.id, u: admin.id, t: "Management meeting", s: `${tomorrow}T09:00`, e: `${tomorrow}T10:30` },
      { r: board.id, u: member.id, t: "Sprint planning", s: `${tomorrow}T11:00`, e: `${tomorrow}T12:00` },
      { r: small.id, u: member.id, t: "Client call", s: `${tomorrow}T14:00`, e: `${tomorrow}T15:30` },
      { r: proj.id, u: admin.id, t: "Training session", s: `${dayAfter}T10:00`, e: `${dayAfter}T13:00` },
    ];
    for (const s of samples) {
      await prisma.reservation.create({
        data: { resourceId: s.r, userId: s.u, title: s.t, startTime: parseLocalInput(s.s)!, endTime: parseLocalInput(s.e)! },
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
