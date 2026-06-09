/**
 * Seed script — populates the database with realistic test data.
 * Run with: node --env-file=.env.local scripts/seed.js
 */

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean up existing data ───────────────────────────────────────────────
  await db.movementManifestEntry.deleteMany();
  await db.hotelManifestEntry.deleteMany();
  await db.eventRegistration.deleteMany();
  await db.movement.deleteMany();
  await db.hotel.deleteMany();
  await db.attendee.deleteMany();
  await db.company.deleteMany();
  await db.event.deleteMany();
  await db.trip.deleteMany();
  console.log("  ✓ Cleared existing data");

  // ── Companies ────────────────────────────────────────────────────────────
  const companies = await Promise.all([
    db.company.create({ data: { name: "Lockheed Martin" } }),
    db.company.create({ data: { name: "Raytheon Technologies" } }),
    db.company.create({ data: { name: "Boeing Defense" } }),
    db.company.create({ data: { name: "General Dynamics" } }),
    db.company.create({ data: { name: "Northrop Grumman" } }),
    db.company.create({ data: { name: "L3Harris Technologies" } }),
  ]);
  console.log("  ✓ Companies");

  // ── Trip ─────────────────────────────────────────────────────────────────
  const trip = await db.trip.create({
    data: {
      name: "HOH East Coast Industry Forums 2026",
      description: "Annual US defense industry forums — New York, Washington DC, Boston",
      startDate: new Date("2026-06-08"),
      endDate: new Date("2026-06-18"),
      isActive: true,
    },
  });
  console.log("  ✓ Trip");

  // ── Events ───────────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newYork = await db.event.create({
    data: { tripId: trip.id, name: "New York Forum",      city: "New York",      country: "United States", date: today,                                                          timezone: "America/New_York" },
  });
  const dc = await db.event.create({
    data: { tripId: trip.id, name: "Washington DC Forum", city: "Washington DC", country: "United States", date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),           timezone: "America/New_York" },
  });
  const boston = await db.event.create({
    data: { tripId: trip.id, name: "Boston Forum",        city: "Boston",        country: "United States", date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000),           timezone: "America/New_York" },
  });
  console.log("  ✓ Events (New York today, DC +4d, Boston +8d)");

  // ── Attendees ─────────────────────────────────────────────────────────────
  // Arrivals = inbound to JFK today; Departures = outbound from BOS in ~10 days
  const now = new Date();
  const depBase = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

  const attendeeData = [
    { firstName: "James",    lastName: "Harrington", email: "j.harrington@lmt.com",     phone: "+1-571-555-0101", companyIdx: 0, hasDodId: true,  travelPackage: true,
      arrivalAirline: "American",        arrivalFlightNumber: "AA 301",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),    arrivalActualAt: new Date(now.getTime() - 2.75 * 60 * 60 * 1000), arrivalStatus: "LANDED",
      departureAirline: "American",      departureFlightNumber: "AA 488", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Sarah",    lastName: "Okafor",     email: "s.okafor@lmt.com",         phone: "+1-571-555-0102", companyIdx: 0, hasDodId: false, travelPackage: true,
      arrivalAirline: "Delta",           arrivalFlightNumber: "DL 507",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),    arrivalActualAt: new Date(now.getTime() - 0.75 * 60 * 60 * 1000), arrivalStatus: "LANDED",
      departureAirline: "Delta",         departureFlightNumber: "DL 802", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 11 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Michael",  lastName: "Torres",     email: "m.torres@raytheon.com",    phone: "+1-781-555-0201", companyIdx: 1, hasDodId: true,  travelPackage: true,
      arrivalAirline: "United",          arrivalFlightNumber: "UA 214",   arrivalAirport: "EWR", arrivalScheduledAt: new Date(now.getTime() + 0.5 * 60 * 60 * 1000),  arrivalStatus: "ON_TIME",
      departureAirline: "United",        departureFlightNumber: "UA 1543", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 9 * 60 * 60 * 1000),  departureStatus: "SCHEDULED" },

    { firstName: "Patricia", lastName: "Nguyen",     email: "p.nguyen@raytheon.com",    phone: "+1-781-555-0202", companyIdx: 1, hasDodId: false, travelPackage: false,
      arrivalAirline: "JetBlue",         arrivalFlightNumber: "B6 915",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),   arrivalStatus: "DELAYED",
      departureAirline: "JetBlue",       departureFlightNumber: "B6 916", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 14 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Robert",   lastName: "Chen",       email: "r.chen@boeing.com",        phone: "+1-703-555-0301", companyIdx: 2, hasDodId: true,  travelPackage: true,
      arrivalAirline: "American",        arrivalFlightNumber: "AA 305",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "American",      departureFlightNumber: "AA 490", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Linda",    lastName: "Vasquez",    email: "l.vasquez@boeing.com",     phone: "+1-703-555-0302", companyIdx: 2, hasDodId: false, travelPackage: true,
      arrivalAirline: "Southwest",       arrivalFlightNumber: "WN 3781",  arrivalAirport: "EWR", arrivalScheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Southwest",     departureFlightNumber: "WN 3782", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 15 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "William",  lastName: "Park",       email: "w.park@gd.com",            phone: "+1-703-555-0401", companyIdx: 3, hasDodId: true,  travelPackage: false,
      arrivalAirline: "Delta",           arrivalFlightNumber: "DL 511",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Delta",         departureFlightNumber: "DL 806", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 13 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Barbara",  lastName: "Kowalski",   email: "b.kowalski@gd.com",        phone: "+1-703-555-0402", companyIdx: 3, hasDodId: false, travelPackage: true,
      arrivalAirline: "United",          arrivalFlightNumber: "UA 220",   arrivalAirport: "EWR", arrivalScheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "United",        departureFlightNumber: "UA 1545", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "David",    lastName: "Osei",       email: "d.osei@northrop.com",      phone: "+1-703-555-0501", companyIdx: 4, hasDodId: true,  travelPackage: true,
      arrivalAirline: "American",        arrivalFlightNumber: "AA 309",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "American",      departureFlightNumber: "AA 492", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 11 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Jennifer", lastName: "Walsh",      email: "j.walsh@northrop.com",     phone: "+1-703-555-0502", companyIdx: 4, hasDodId: false, travelPackage: false,
      arrivalAirline: "JetBlue",         arrivalFlightNumber: "B6 921",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "JetBlue",       departureFlightNumber: "B6 922", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 12 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Thomas",   lastName: "Reyes",      email: "t.reyes@l3harris.com",     phone: "+1-321-555-0601", companyIdx: 5, hasDodId: true,  travelPackage: true,
      arrivalAirline: "Delta",           arrivalFlightNumber: "DL 515",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Delta",         departureFlightNumber: "DL 810", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Margaret", lastName: "Johansson",  email: "m.johansson@l3harris.com", phone: "+1-321-555-0602", companyIdx: 5, hasDodId: false, travelPackage: true,
      arrivalAirline: "United",          arrivalFlightNumber: "UA 228",   arrivalAirport: "EWR", arrivalScheduledAt: new Date(now.getTime() + 7 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "United",        departureFlightNumber: "UA 1549", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 14 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Charles",  lastName: "Abrams",     email: "c.abrams@lmt.com",         phone: "+1-571-555-0103", companyIdx: 0, hasDodId: true,  travelPackage: false,
      arrivalAirline: "American",        arrivalFlightNumber: "AA 313",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "American",      departureFlightNumber: "AA 494", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 9 * 60 * 60 * 1000),  departureStatus: "SCHEDULED" },

    { firstName: "Susan",    lastName: "Brennan",    email: "s.brennan@raytheon.com",   phone: "+1-781-555-0203", companyIdx: 1, hasDodId: false, travelPackage: true,
      arrivalAirline: "Delta",           arrivalFlightNumber: "DL 519",   arrivalAirport: "JFK", arrivalScheduledAt: new Date(now.getTime() + 9 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Delta",         departureFlightNumber: "DL 814", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 11 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Kevin",    lastName: "Matsuda",    email: "k.matsuda@boeing.com",     phone: "+1-703-555-0303", companyIdx: 2, hasDodId: true,  travelPackage: true,
      arrivalAirline: "United",          arrivalFlightNumber: "UA 232",   arrivalAirport: "EWR", arrivalScheduledAt: new Date(now.getTime() + 10 * 60 * 60 * 1000),  arrivalStatus: "SCHEDULED",
      departureAirline: "United",        departureFlightNumber: "UA 1553", departureAirport: "BOS", departureScheduledAt: new Date(depBase.getTime() + 13 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },
  ];

  const attendees = await Promise.all(
    attendeeData.map(({ companyIdx, ...a }) =>
      db.attendee.create({ data: { ...a, tripId: trip.id, companyId: companies[companyIdx].id } })
    )
  );
  console.log(`  ✓ ${attendees.length} Attendees (with arrival + departure flights)`);

  // ── Event Registrations ──────────────────────────────────────────────────
  // All 15 attend New York; 12 attend DC; 10 attend Boston
  const dcAttendees     = attendees.slice(0, 12);
  const bostonAttendees = attendees.slice(0, 10);

  await Promise.all([
    ...attendees.map((a) =>
      db.eventRegistration.create({ data: { attendeeId: a.id, eventId: newYork.id } })
    ),
    ...dcAttendees.map((a) =>
      db.eventRegistration.create({ data: { attendeeId: a.id, eventId: dc.id } })
    ),
    ...bostonAttendees.map((a) =>
      db.eventRegistration.create({ data: { attendeeId: a.id, eventId: boston.id } })
    ),
  ]);
  console.log("  ✓ Event registrations (New York: 15, DC: 12, Boston: 10)");

  // ── Hotels ───────────────────────────────────────────────────────────────
  const hotelPierre = await db.hotel.create({
    data: { eventId: newYork.id, tripId: trip.id, name: "The Pierre, A Taj Hotel",    address: "2 East 61st Street, New York, NY 10065",             phone: "+1 212-838-8000" },
  });
  const hotelMarriottNY = await db.hotel.create({
    data: { eventId: newYork.id, tripId: trip.id, name: "New York Marriott Marquis",  address: "1535 Broadway, New York, NY 10036",                   phone: "+1 212-398-1900" },
  });
  const hotelHayAdams = await db.hotel.create({
    data: { eventId: dc.id,      tripId: trip.id, name: "The Hay-Adams",              address: "800 16th Street NW, Washington, DC 20006",            phone: "+1 202-638-6600" },
  });
  await db.hotel.create({
    data: { eventId: boston.id,  tripId: trip.id, name: "Boston Marriott Copley Place", address: "110 Huntington Ave, Boston, MA 02116",             phone: "+1 617-236-5800" },
  });
  console.log("  ✓ Hotels");

  // ── Hotel Manifest Entries ───────────────────────────────────────────────
  await Promise.all([
    ...attendees.slice(0, 9).map((a, i) =>
      db.hotelManifestEntry.create({
        data: { attendeeId: a.id, hotelId: hotelPierre.id, roomNumber: `${201 + i}`, checkIn: today, checkOut: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000) },
      })
    ),
    ...attendees.slice(9).map((a, i) =>
      db.hotelManifestEntry.create({
        data: { attendeeId: a.id, hotelId: hotelMarriottNY.id, roomNumber: `${301 + i}`, checkIn: today, checkOut: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000) },
      })
    ),
    ...dcAttendees.map((a, i) =>
      db.hotelManifestEntry.create({
        data: { attendeeId: a.id, hotelId: hotelHayAdams.id, roomNumber: `${401 + i}`, checkIn: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000) },
      })
    ),
  ]);
  console.log("  ✓ Hotel manifest entries");

  // ── Movements ────────────────────────────────────────────────────────────
  const inTwoHours   = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const inFiveHours  = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const inEightHours = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const bus1 = await db.movement.create({
    data: {
      tripId: trip.id, eventId: newYork.id, timezone: "America/New_York",
      name: "Bus 1 — JFK to Hotels",
      mode: "BUS",
      departureLocation: "JFK Airport — Terminal 8 Arrivals",
      arrivalLocation: "The Pierre, 2 East 61st Street",
      departureTime: inTwoHours,
      arrivalTime: new Date(inTwoHours.getTime() + 60 * 60 * 1000),
      notes: "Meet at arrivals curb, look for HOH sign. Allow extra time for tunnel traffic.",
    },
  });

  const bus2 = await db.movement.create({
    data: {
      tripId: trip.id, eventId: newYork.id, timezone: "America/New_York",
      name: "Bus 2 — Hotels to Venue",
      mode: "BUS",
      departureLocation: "The Pierre, 2 East 61st Street",
      arrivalLocation: "Intrepid Sea, Air & Space Museum",
      departureTime: inFiveHours,
      arrivalTime: new Date(inFiveHours.getTime() + 30 * 60 * 1000),
      meetTime: new Date(inFiveHours.getTime() - 15 * 60 * 1000),
      meetLocation: "Hotel lobby",
    },
  });

  // NYC → DC: departure timezone = America/New_York (same city, but explicit)
  const flight1 = await db.movement.create({
    data: {
      tripId: trip.id, eventId: newYork.id, timezone: "America/New_York",
      name: "Group Flight — New York to Washington DC",
      mode: "FLIGHT",
      departureLocation: "LaGuardia Airport (LGA) — Terminal B",
      arrivalLocation: "Reagan National Airport (DCA)",
      departureTime: inEightHours,
      arrivalTime: new Date(inEightHours.getTime() + 80 * 60 * 1000),
      notes: "AA 1225 — check in at American counters by T-90 min. Shuttle from hotels departs 90 min prior.",
    },
  });
  console.log("  ✓ Movements");

  // ── Movement Manifest Entries ─────────────────────────────────────────────
  await Promise.all([
    ...attendees.slice(0, 9).map((a, i) =>
      db.movementManifestEntry.create({
        data: { movementId: bus1.id, attendeeId: a.id, status: i < 3 ? "CHECKED_IN" : "PENDING", checkedInAt: i < 3 ? now : null },
      })
    ),
    ...attendees.map((a) =>
      db.movementManifestEntry.create({ data: { movementId: bus2.id, attendeeId: a.id, status: "PENDING" } })
    ),
    ...attendees.map((a) =>
      db.movementManifestEntry.create({ data: { movementId: flight1.id, attendeeId: a.id, status: "PENDING" } })
    ),
  ]);
  console.log("  ✓ Movement manifest entries");

  console.log("\n✅ Seed complete!");
  console.log(`   Trip:       ${trip.name}`);
  console.log(`   Events:     New York (today, 15), DC (+4d, 12), Boston (+8d, 10)`);
  console.log(`   Attendees:  ${attendees.length} with arrival + departure flights`);
  console.log(`   Hotels:     The Pierre (9), Marriott Marquis (6), Hay-Adams (12), Boston Marriott (no assignments yet)`);
  console.log(`   Next move:  Bus 1 departs in ~2 hours`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
