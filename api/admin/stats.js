import { prisma } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";

const TREND_MONTHS = 6;

function monthBuckets() {
  const buckets = [];
  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("de-DE", { month: "short" }), count: 0 });
  }
  return buckets;
}

export default async function handler(req, res) {
  const session = await requireAdmin(req, res, { fullOnly: true });
  if (!session) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const trendStart = new Date();
  trendStart.setDate(1);
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setMonth(trendStart.getMonth() - (TREND_MONTHS - 1));

  const [
    totalEvents,
    externalEvents,
    comingSoonEvents,
    totalRegistrations,
    paidRegistrations,
    unpaidRegistrations,
    totalInterests,
    totalSubscribers,
    newsletterOptIns,
    paidOwnRegistrations,
    topEvents,
    recentRegistrations,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { isExternal: true } }),
    prisma.event.count({ where: { comingSoon: true } }),
    prisma.registration.count(),
    prisma.registration.count({ where: { paid: true } }),
    prisma.registration.count({ where: { paid: false } }),
    prisma.eventInterest.count(),
    prisma.newsletterSubscriber.count(),
    prisma.registration.count({ where: { newsletterOptIn: true } }),
    prisma.registration.findMany({
      where: { paid: true, event: { isExternal: false } },
      select: { event: { select: { pricePerPerson: true } } },
    }),
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        isExternal: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { registrations: { _count: "desc" } },
      take: 5,
    }),
    prisma.registration.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
  ]);

  const totalRevenue = paidOwnRegistrations.reduce((sum, r) => sum + Number(r.event.pricePerPerson || 0), 0);

  const buckets = monthBuckets();
  for (const r of recentRegistrations) {
    const d = new Date(r.createdAt);
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (bucket) bucket.count += 1;
  }

  return res.status(200).json({
    totalEvents,
    ourEvents: totalEvents - externalEvents,
    externalEvents,
    comingSoonEvents,
    totalRegistrations,
    paidRegistrations,
    unpaidRegistrations,
    totalRevenue,
    totalInterests,
    totalSubscribers,
    newsletterOptIns,
    topEvents: topEvents
      .filter((e) => e._count.registrations > 0)
      .map((e) => ({ id: e.id, title: e.title, isExternal: e.isExternal, registrations: e._count.registrations })),
    monthlyRegistrations: buckets.map(({ label, count }) => ({ label, count })),
  });
}
