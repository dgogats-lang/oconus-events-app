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
      name: "HOH Europe Summits 2026",
      description: "Annual European defense industry summits — Munich, Warsaw, London",
      startDate: new Date("2026-06-04"),
      endDate: new Date("2026-06-14"),
      isActive: true,
    },
  });
  console.log("  ✓ Trip");

  // ── Events ───────────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const munich = await db.event.create({
    data: { tripId: trip.id, name: "Munich Summit",  city: "Munich", country: "Germany",        date: today },
  });
  const warsaw = await db.event.create({
    data: { tripId: trip.id, name: "Warsaw Summit",  city: "Warsaw", country: "Poland",         date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000) },
  });
  const london = await db.event.create({
    data: { tripId: trip.id, name: "London Summit",  city: "London", country: "United Kingdom", date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000) },
  });
  console.log("  ✓ Events (Munich today, Warsaw +4d, London +8d)");

  // ── Attendees (with flat arrival/departure flight fields) ─────────────────
  // Arrivals = inbound to Munich today; Departures = outbound from London in ~10 days
  const now = new Date();
  const depBase = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

  const attendeeData = [
    { firstName: "James",    lastName: "Harrington", email: "j.harrington@lmt.com",     phone: "+1-571-555-0101", companyIdx: 0, hasDodId: true,  travelPackage: true,
      arrivalAirline: "Lufthansa",       arrivalFlightNumber: "LH 442",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),    arrivalActualAt: new Date(now.getTime() - 2.75 * 60 * 60 * 1000), arrivalStatus: "LANDED",
      departureAirline: "Lufthansa",     departureFlightNumber: "LH 101", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Sarah",    lastName: "Okafor",     email: "s.okafor@lmt.com",         phone: "+1-571-555-0102", companyIdx: 0, hasDodId: false, travelPackage: true,
      arrivalAirline: "Lufthansa",       arrivalFlightNumber: "LH 444",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),    arrivalActualAt: new Date(now.getTime() - 0.75 * 60 * 60 * 1000), arrivalStatus: "LANDED",
      departureAirline: "British Airways", departureFlightNumber: "BA 202", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 11 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Michael",  lastName: "Torres",     email: "m.torres@raytheon.com",    phone: "+1-781-555-0201", companyIdx: 1, hasDodId: true,  travelPackage: true,
      arrivalAirline: "Delta",           arrivalFlightNumber: "DL 404",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 0.5 * 60 * 60 * 1000),  arrivalStatus: "ON_TIME",
      departureAirline: "Delta",         departureFlightNumber: "DL 501", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 9 * 60 * 60 * 1000),  departureStatus: "SCHEDULED" },

    { firstName: "Patricia", lastName: "Nguyen",     email: "p.nguyen@raytheon.com",    phone: "+1-781-555-0202", companyIdx: 1, hasDodId: false, travelPackage: false,
      arrivalAirline: "United",          arrivalFlightNumber: "UA 986",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),   arrivalStatus: "DELAYED",
      departureAirline: "United",        departureFlightNumber: "UA 987", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 14 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Robert",   lastName: "Chen",       email: "r.chen@boeing.com",        phone: "+1-703-555-0301", companyIdx: 2, hasDodId: true,  travelPackage: true,
      arrivalAirline: "American",        arrivalFlightNumber: "AA 102",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "American",      departureFlightNumber: "AA 103", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Linda",    lastName: "Vasquez",    email: "l.vasquez@boeing.com",     phone: "+1-703-555-0302", companyIdx: 2, hasDodId: false, travelPackage: true,
      arrivalAirline: "British Airways", arrivalFlightNumber: "BA 914",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "British Airways", departureFlightNumber: "BA 915", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 15 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "William",  lastName: "Park",       email: "w.park@gd.com",            phone: "+1-703-555-0401", companyIdx: 3, hasDodId: true,  travelPackage: false,
      arrivalAirline: "Emirates",        arrivalFlightNumber: "EK 051",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Emirates",      departureFlightNumber: "EK 052", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 13 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Barbara",  lastName: "Kowalski",   email: "b.kowalski@gd.com",        phone: "+1-703-555-0402", companyIdx: 3, hasDodId: false, travelPackage: true,
      arrivalAirline: "KLM",             arrivalFlightNumber: "KL 1874",  arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "KLM",           departureFlightNumber: "KL 1875", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "David",    lastName: "Osei",       email: "d.osei@northrop.com",      phone: "+1-703-555-0501", companyIdx: 4, hasDodId: true,  travelPackage: true,
      arrivalAirline: "Air France",      arrivalFlightNumber: "AF 2240",  arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Air France",    departureFlightNumber: "AF 2241", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 11 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Jennifer", lastName: "Walsh",      email: "j.walsh@northrop.com",     phone: "+1-703-555-0502", companyIdx: 4, hasDodId: false, travelPackage: false,
      arrivalAirline: "Iberia",          arrivalFlightNumber: "IB 3782",  arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Iberia",        departureFlightNumber: "IB 3783", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 12 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Thomas",   lastName: "Reyes",      email: "t.reyes@l3harris.com",     phone: "+1-321-555-0601", companyIdx: 5, hasDodId: true,  travelPackage: true,
      arrivalAirline: "Lufthansa",       arrivalFlightNumber: "LH 450",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Lufthansa",     departureFlightNumber: "LH 102", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 10 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Margaret", lastName: "Johansson",  email: "m.johansson@l3harris.com", phone: "+1-321-555-0602", companyIdx: 5, hasDodId: false, travelPackage: true,
      arrivalAirline: "Swiss",           arrivalFlightNumber: "LX 1922",  arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 7 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Swiss",         departureFlightNumber: "LX 1923", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 14 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Charles",  lastName: "Abrams",     email: "c.abrams@lmt.com",         phone: "+1-571-555-0103", companyIdx: 0, hasDodId: true,  travelPackage: false,
      arrivalAirline: "Lufthansa",       arrivalFlightNumber: "LH 452",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Lufthansa",     departureFlightNumber: "LH 103", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 9 * 60 * 60 * 1000),  departureStatus: "SCHEDULED" },

    { firstName: "Susan",    lastName: "Brennan",    email: "s.brennan@raytheon.com",   phone: "+1-781-555-0203", companyIdx: 1, hasDodId: false, travelPackage: true,
      arrivalAirline: "Delta",           arrivalFlightNumber: "DL 408",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 9 * 60 * 60 * 1000),   arrivalStatus: "SCHEDULED",
      departureAirline: "Delta",         departureFlightNumber: "DL 502", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 11 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },

    { firstName: "Kevin",    lastName: "Matsuda",    email: "k.matsuda@boeing.com",     phone: "+1-703-555-0303", companyIdx: 2, hasDodId: true,  travelPackage: true,
      arrivalAirline: "United",          arrivalFlightNumber: "UA 990",   arrivalAirport: "MUC", arrivalScheduledAt: new Date(now.getTime() + 10 * 60 * 60 * 1000),  arrivalStatus: "SCHEDULED",
      departureAirline: "United",        departureFlightNumber: "UA 991", departureAirport: "LHR", departureScheduledAt: new Date(depBase.getTime() + 13 * 60 * 60 * 1000), departureStatus: "SCHEDULED" },
  ];

  const attendees = await Promise.all(
    attendeeData.map(({ companyIdx, ...a }) =>
      db.attendee.create({ data: { ...a, tripId: trip.id, companyId: companies[companyIdx].id } })
    )
  );
  console.log(`  ✓ ${attendees.length} Attendees (with arrival + departure flights)`);

  // ── Event Registrations ──────────────────────────────────────────────────
  // All 15 attend Munich; 12 attend Warsaw; 10 attend London
  const warsawAttendees = attendees.slice(0, 12);
  const londonAttendees = attendees.slice(0, 10);

  await Promise.all([
    ...attendees.map((a) =>
      db.eventRegistration.create({ data: { attendeeId: a.id, eventId: munich.id } })
    ),
    ...warsawAttendees.map((a) =>
      db.eventRegistration.create({ data: { attendeeId: a.id, eventId: warsaw.id } })
    ),
    ...londonAttendees.map((a) =>
      db.eventRegistration.create({ data: { attendeeId: a.id, eventId: london.id } })
    ),
  ]);
  console.log("  ✓ Event registrations (Munich: 15, Warsaw: 12, London: 10)");

  // ── Hotels ───────────────────────────────────────────────────────────────
  const hotelBayerischer = await db.hotel.create({
    data: { eventId: munich.id, name: "Hotel Bayerischer Hof",  address: "Promenadeplatz 2-6, 80333 Munich",                  phone: "+49 89 21200" },
  });
  const hotelMarriott = await db.hotel.create({
    data: { eventId: munich.id, name: "Munich Marriott Hotel",  address: "Berliner Strasse 93, 80805 Munich",                  phone: "+49 89 36002000" },
  });
  const hotelBristol = await db.hotel.create({
    data: { eventId: warsaw.id, name: "Hotel Bristol Warsaw",   address: "Krakowskie Przedmiescie 42/44, 00-325 Warsaw",       phone: "+48 22 551 1000" },
  });
  await db.hotel.create({
    data: { eventId: london.id, name: "The Savoy",              address: "Strand, London WC2R 0EZ",                           phone: "+44 20 7836 4343" },
  });
  console.log("  ✓ Hotels");

  // ── Hotel Manifest Entries ───────────────────────────────────────────────
  await Promise.all([
    ...attendees.slice(0, 9).map((a, i) =>
      db.hotelManifestEntry.create({
        data: { eventId: munich.id, attendeeId: a.id, hotelId: hotelBayerischer.id, roomNumber: `${201 + i}`, checkIn: today, checkOut: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000) },
      })
    ),
    ...attendees.slice(9).map((a, i) =>
      db.hotelManifestEntry.create({
        data: { eventId: munich.id, attendeeId: a.id, hotelId: hotelMarriott.id, roomNumber: `${301 + i}`, checkIn: today, checkOut: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000) },
      })
    ),
    ...warsawAttendees.map((a, i) =>
      db.hotelManifestEntry.create({
        data: { eventId: warsaw.id, attendeeId: a.id, hotelId: hotelBristol.id, roomNumber: `${401 + i}`, checkIn: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000) },
      })
    ),
  ]);
  console.log("  ✓ Hotel manifest entries");

  // ── Movements ────────────────────────────────────────────────────────────
  const inTwoHours   = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const inFiveHours  = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const inEightHours = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const bus1 = await db.movement.create({
    data: { eventId: munich.id, name: "Bus 1 — Airport to Hotels", mode: "BUS", departureLocation: "Munich Airport (MUC) — Terminal 2", arrivalLocation: "Hotel Bayerischer Hof", departureTime: inTwoHours, arrivalTime: new Date(inTwoHours.getTime() + 45 * 60 * 1000), notes: "Meet at arrivals hall exit, look for HOH sign" },
  });
  const bus2 = await db.movement.create({
    data: { eventId: munich.id, name: "Bus 2 — Hotels to Venue", mode: "BUS", departureLocation: "Hotel Bayerischer Hof", arrivalLocation: "Munich Conference Center (MCC)", departureTime: inFiveHours, arrivalTime: new Date(inFiveHours.getTime() + 20 * 60 * 1000) },
  });
  const flight1 = await db.movement.create({
    data: { eventId: munich.id, name: "Group Flight — Munich to Warsaw", mode: "FLIGHT", departureLocation: "Munich Airport (MUC)", arrivalLocation: "Warsaw Chopin Airport (WAW)", departureTime: inEightHours, arrivalTime: new Date(inEightHours.getTime() + 100 * 60 * 1000), notes: "LH 1682 — check in at Terminal 2, Lufthansa counters by 06:30" },
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
  console.log(`   Events:     Munich (today, 15), Warsaw (+4d, 12), London (+8d, 10)`);
  console.log(`   Attendees:  ${attendees.length} with arrival + departure flights`);
  console.log(`   Hotels:     Bayerischer Hof (9), Marriott (6), Bristol (12), Savoy (London — no assignments yet)`);
  console.log(`   Next move:  Bus 1 departs in ~2 hours`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
