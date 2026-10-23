import postgres from "postgres";

// One pool per server process. Next dev hot-reloads modules, so keep it on globalThis.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    // Supabase requires SSL; the local dev cluster does not have it.
    ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
    max: 5,
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
