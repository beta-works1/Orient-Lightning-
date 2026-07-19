/**
 * One-time seed: writes data/dealers.json and upserts into Postgres when DATABASE_URL is set.
 *
 * Usage: npx tsx scripts/seed-dealers.ts
 *
 * WARNING: Includes 24 unverified placeholders. Do not ship to production without
 * replacing verified:false rows with real dealer data (or deleting them).
 */
import "dotenv/config";
import { buildDealerSeed } from "../src/lib/seed-dealers";
import { writeDealersJson } from "../src/lib/dealers-data";
import { getDb } from "../src/db";
import { dealers } from "../src/db/schema";

async function main() {
  const rows = buildDealerSeed();
  const file = writeDealersJson(rows);
  console.log(`Wrote ${rows.length} dealers → ${file}`);
  console.log(
    `  verified: ${rows.filter((d) => d.verified).length}, placeholders: ${rows.filter((d) => !d.verified).length}`,
  );

  const db = getDb();
  if (!db) {
    console.log("DATABASE_URL not set — skipped DB upsert (JSON seed is enough for local).");
    return;
  }

  for (const row of rows) {
    await db
      .insert(dealers)
      .values({
        id: row.id,
        name: row.name,
        type: row.type,
        address: row.address,
        city: row.city,
        latitude: row.latitude,
        longitude: row.longitude,
        phone: row.phone,
        whatsapp: row.whatsapp,
        hours: row.hours,
        verified: row.verified,
        isWalkIn: row.isWalkIn,
      })
      .onConflictDoUpdate({
        target: dealers.id,
        set: {
          name: row.name,
          type: row.type,
          address: row.address,
          city: row.city,
          latitude: row.latitude,
          longitude: row.longitude,
          phone: row.phone,
          whatsapp: row.whatsapp,
          hours: row.hours,
          verified: row.verified,
          isWalkIn: row.isWalkIn,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Upserted ${rows.length} dealers into Postgres.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
