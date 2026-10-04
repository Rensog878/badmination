import "server-only";
import type { Filter } from "mongodb";
import { addRegistered } from "@/lib/data/tournaments";
import { collection, dbConfigured } from "@/lib/db/mongo";
import type { RegistrationValues } from "@/lib/registration";

export type RegistrationStatus = "pending_payment" | "paid";

export interface RegistrationDoc {
  reference: string;
  tournamentSlug: string;
  tournamentName: string;
  player: RegistrationValues["player"];
  events: string[];
  partners: Record<string, string>;
  emergency: RegistrationValues["emergency"];
  guardianName: string;
  mediaConsent: boolean;
  /** INR. */
  total: number;
  status: RegistrationStatus;
  razorpayOrderId?: string;
  paymentId?: string;
  createdAt: Date;
  paidAt?: Date;
  /** Tournament Day Morning Desk Check-in */
  checkedIn?: boolean;
  checkedInAt?: Date | null;
}

// In-memory store for fallback when no MongoDB is configured (e.g. preview/demo)
const inMemoryDemoRegistrations: RegistrationDoc[] = [
  {
    reference: "REG-2026-001",
    tournamentSlug: "autumn-open-2026",
    tournamentName: "Autumn Open",
    player: {
      fullName: "Arjun Verma",
      email: "arjun.verma@example.com",
      phone: "+91 98765 43210",
      gender: "male",
      dateOfBirth: "2008-04-12",
      city: "Bengaluru",
      club: "Whitefield Badminton Academy",
      isStudent: true,
      institution: "Delhi Public School",
      studentId: "DPS-2026-88",
    },
    events: ["Boys Singles U-17"],
    partners: {},
    emergency: {
      name: "Ramesh Verma",
      phone: "+91 98765 43211",
    },
    guardianName: "Ramesh Verma",
    mediaConsent: true,
    total: 600,
    status: "paid",
    checkedIn: true,
    checkedInAt: new Date(Date.now() - 3600000 * 2),
    createdAt: new Date(Date.now() - 86400000 * 5),
    paidAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    reference: "REG-2026-002",
    tournamentSlug: "autumn-open-2026",
    tournamentName: "Autumn Open",
    player: {
      fullName: "Pooja Nair",
      email: "pooja.nair@example.com",
      phone: "+91 98111 22334",
      gender: "female",
      dateOfBirth: "2009-08-20",
      city: "Kochi",
      club: "Kochi Shuttlers Club",
      isStudent: true,
      institution: "Bhavans Vidya Mandir",
      studentId: "BVM-5412",
    },
    events: ["Girls Singles U-15"],
    partners: {},
    emergency: {
      name: "Latha Nair",
      phone: "+91 98111 22335",
    },
    guardianName: "Latha Nair",
    mediaConsent: true,
    total: 600,
    status: "paid",
    checkedIn: false,
    createdAt: new Date(Date.now() - 86400000 * 4),
    paidAt: new Date(Date.now() - 86400000 * 4),
  },
  {
    reference: "REG-2026-003",
    tournamentSlug: "autumn-open-2026",
    tournamentName: "Autumn Open",
    player: {
      fullName: "Dhruv Saxena",
      email: "dhruv.saxena@example.com",
      phone: "+91 97234 56789",
      gender: "male",
      dateOfBirth: "2007-01-15",
      city: "Pune",
      club: "Pune Smashers Club",
      isStudent: true,
      institution: "Symbiosis Junior College",
      studentId: "SYM-9921",
    },
    events: ["Boys Singles U-19", "Boys Doubles U-19"],
    partners: { "Boys Doubles U-19": "Karan Mehra" },
    emergency: {
      name: "Sunil Saxena",
      phone: "+91 97234 56780",
    },
    guardianName: "Sunil Saxena",
    mediaConsent: true,
    total: 1200,
    status: "paid",
    checkedIn: true,
    checkedInAt: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000 * 3),
    paidAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    reference: "REG-2026-004",
    tournamentSlug: "autumn-open-2026",
    tournamentName: "Autumn Open",
    player: {
      fullName: "Sanya Reddy",
      email: "sanya.reddy@example.com",
      phone: "+91 99887 76655",
      gender: "female",
      dateOfBirth: "2008-11-05",
      city: "Hyderabad",
      club: "Hyderabad Badminton Academy",
      isStudent: true,
      institution: "Oakridge International",
      studentId: "OAK-772",
    },
    events: ["Girls Singles U-17"],
    partners: {},
    emergency: {
      name: "Vikram Reddy",
      phone: "+91 99887 76650",
    },
    guardianName: "Vikram Reddy",
    mediaConsent: true,
    total: 600,
    status: "paid",
    checkedIn: false,
    createdAt: new Date(Date.now() - 86400000 * 2),
    paidAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    reference: "REG-2026-005",
    tournamentSlug: "autumn-open-2026",
    tournamentName: "Autumn Open",
    player: {
      fullName: "Rohan Iyer",
      email: "rohan.iyer@example.com",
      phone: "+91 94455 66778",
      gender: "male",
      dateOfBirth: "2006-03-22",
      city: "Chennai",
      club: "Chennai Shuttles",
      isStudent: false,
      institution: "",
      studentId: "",
    },
    events: ["Men's Singles Open"],
    partners: {},
    emergency: {
      name: "Anand Iyer",
      phone: "+91 94455 66770",
    },
    guardianName: "",
    mediaConsent: true,
    total: 600,
    status: "pending_payment",
    checkedIn: false,
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
];

export async function createRegistration(doc: RegistrationDoc): Promise<void> {
  if (!dbConfigured()) {
    inMemoryDemoRegistrations.unshift(doc);
    return;
  }
  await (await collection<RegistrationDoc>("registrations")).insertOne(doc);
}

export async function attachOrder(reference: string, orderId: string): Promise<void> {
  if (!dbConfigured()) {
    const item = inMemoryDemoRegistrations.find((r) => r.reference === reference);
    if (item) item.razorpayOrderId = orderId;
    return;
  }
  await (await collection<RegistrationDoc>("registrations")).updateOne({ reference }, { $set: { razorpayOrderId: orderId } });
}

/**
 * Idempotent: only the first caller (checkout verification or webhook) flips
 * the status and counts the entries against capacity.
 */
export async function markPaid(orderId: string, paymentId: string): Promise<RegistrationDoc | null> {
  if (!dbConfigured()) {
    const item = inMemoryDemoRegistrations.find((r) => r.razorpayOrderId === orderId);
    if (item) {
      item.status = "paid";
      item.paymentId = paymentId;
      item.paidAt = new Date();
      await addRegistered(item.tournamentSlug, item.events.length);
    }
    return item ?? null;
  }
  const col = await collection<RegistrationDoc>("registrations");
  const updated = await col.findOneAndUpdate(
    { razorpayOrderId: orderId, status: { $ne: "paid" } },
    { $set: { status: "paid", paymentId, paidAt: new Date() } },
    { returnDocument: "after" },
  );
  if (updated) await addRegistered(updated.tournamentSlug, updated.events.length);
  return updated;
}

export async function toggleCheckIn(reference: string, checkedIn: boolean): Promise<RegistrationDoc | null> {
  if (!dbConfigured()) {
    const item = inMemoryDemoRegistrations.find((r) => r.reference === reference);
    if (item) {
      item.checkedIn = checkedIn;
      item.checkedInAt = checkedIn ? new Date() : null;
    }
    return item ?? null;
  }
  const col = await collection<RegistrationDoc>("registrations");
  const update: Record<string, unknown> = {
    checkedIn,
    checkedInAt: checkedIn ? new Date() : null,
  };
  return await col.findOneAndUpdate(
    { reference },
    { $set: update },
    { returnDocument: "after" }
  );
}

export async function listRegistrations(filter: {
  tournament?: string;
  status?: RegistrationStatus;
  checkInStatus?: "checked_in" | "pending";
  search?: string;
} = {}) {
  if (!dbConfigured()) {
    let result = [...inMemoryDemoRegistrations];
    if (filter.tournament) {
      result = result.filter((r) => r.tournamentSlug === filter.tournament);
    }
    if (filter.status) {
      result = result.filter((r) => r.status === filter.status);
    }
    if (filter.checkInStatus === "checked_in") {
      result = result.filter((r) => Boolean(r.checkedIn));
    } else if (filter.checkInStatus === "pending") {
      result = result.filter((r) => !r.checkedIn);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.reference.toLowerCase().includes(q) ||
          r.player.fullName.toLowerCase().includes(q) ||
          r.player.phone.includes(q) ||
          (r.player.club && r.player.club.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const query: Filter<RegistrationDoc> = {};
  if (filter.tournament) query.tournamentSlug = filter.tournament;
  if (filter.status) query.status = filter.status;
  if (filter.checkInStatus === "checked_in") {
    query.checkedIn = true;
  } else if (filter.checkInStatus === "pending") {
    query.checkedIn = { $ne: true };
  }
  if (filter.search) {
    const s = filter.search.trim();
    query.$or = [
      { reference: { $regex: s, $options: "i" } },
      { "player.fullName": { $regex: s, $options: "i" } },
      { "player.phone": { $regex: s, $options: "i" } },
      { "player.club": { $regex: s, $options: "i" } },
    ];
  }

  return (await collection<RegistrationDoc>("registrations"))
    .find(query, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(2000)
    .toArray();
}

export async function registrationStats(tournamentSlug?: string) {
  if (!dbConfigured()) {
    let list = inMemoryDemoRegistrations;
    if (tournamentSlug) list = list.filter((r) => r.tournamentSlug === tournamentSlug);
    const paid = list.filter((r) => r.status === "paid").length;
    const pending = list.filter((r) => r.status === "pending_payment").length;
    const revenue = list.filter((r) => r.status === "paid").reduce((acc, r) => acc + r.total, 0);
    const checkedIn = list.filter((r) => Boolean(r.checkedIn)).length;
    return { paid, pending, revenue, checkedIn };
  }

  const col = await collection<RegistrationDoc>("registrations");
  const matchStage = tournamentSlug ? [{ $match: { tournamentSlug } }] : [];
  const [row] = await col
    .aggregate<{ paid: number; pending: number; revenue: number; checkedIn: number }>([
      ...matchStage,
      {
        $group: {
          _id: null,
          paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending_payment"] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] } },
          checkedIn: { $sum: { $cond: [{ $eq: ["$checkedIn", true] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  return row ?? { paid: 0, pending: 0, revenue: 0, checkedIn: 0 };
}
