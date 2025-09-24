import { Pool } from '@neondatabase/serverless';

async function main() {
  const conn = process.argv[2] || process.env.DATABASE_URL;
  if (!conn) {
    console.error('Usage: tsx scripts/check-stats.ts <postgres-connection-url>');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: conn });
  const client = await pool.connect();
  try {
    // Detect message time column
    const colRes = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='messages' AND column_name in ('created_at','timestamp') ORDER BY case when column_name='created_at' then 0 else 1 end LIMIT 1;"
    );
    const msgTimeCol = (colRes.rows[0]?.column_name as string) || 'created_at';

    const sql = `
      WITH bounds AS (
        SELECT
          (date_trunc('day', (now() AT TIME ZONE 'Asia/Kolkata'))) AT TIME ZONE 'Asia/Kolkata' AS ist_start,
          (date_trunc('day', (now() AT TIME ZONE 'Asia/Kolkata')) + interval '1 day') AT TIME ZONE 'Asia/Kolkata' AS ist_end
      )
      SELECT 'bookings_today' AS k, count(*)::text AS v
      FROM bookings b, bounds
      WHERE b.created_at >= (bounds.ist_start AT TIME ZONE 'Asia/Kolkata')
        AND b.created_at <  (bounds.ist_end   AT TIME ZONE 'Asia/Kolkata')
      UNION ALL
      SELECT 'revenue_today', coalesce(sum(CASE WHEN status='confirmed' THEN amount ELSE 0 END),0)::text
      FROM bookings b, bounds
      WHERE b.created_at >= (bounds.ist_start AT TIME ZONE 'Asia/Kolkata')
        AND b.created_at <  (bounds.ist_end   AT TIME ZONE 'Asia/Kolkata')
      UNION ALL
      SELECT 'messages_today', count(*)::text
      FROM messages m, bounds
      WHERE m."${msgTimeCol}" >= (bounds.ist_start AT TIME ZONE 'Asia/Kolkata')
        AND m."${msgTimeCol}" <  (bounds.ist_end   AT TIME ZONE 'Asia/Kolkata')
      UNION ALL
      SELECT 'bot_today', count(*)::text
      FROM messages m, bounds
      WHERE is_from_bot = true
        AND m."${msgTimeCol}" >= (bounds.ist_start AT TIME ZONE 'Asia/Kolkata')
        AND m."${msgTimeCol}" <  (bounds.ist_end   AT TIME ZONE 'Asia/Kolkata')
    `;

    const res = await client.query(sql);
    const rows = res.rows as Array<{ k: string; v: string }>;
    const map: Record<string, string> = {};
    for (const r of rows) map[r.k] = r.v;
    console.log(JSON.stringify(map));

    const latestMessages = await client.query(
      `SELECT id, conversation_id, is_from_bot, "${msgTimeCol}" as created_at\n       FROM messages\n       ORDER BY "${msgTimeCol}" DESC\n       LIMIT 10;`
    );
    console.log('\nLatest messages:');
    for (const r of latestMessages.rows) console.log(r);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


