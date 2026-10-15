
import { createClerkClient, verifyToken } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname !== "/api/subscriptions" &&
          url.pathname !== "/api/db-test") {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      if (request.method !== "GET") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }

      const authHeader = request.headers.get("Authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        await verifyToken(token, {
          secretKey: env.CLERK_SECRET_KEY,
        });
      } catch {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const sql = neon(env.DATABASE_URL);

        if (url.pathname === "/api/db-test") {
          const result = await sql`SELECT NOW() AS database_time`;
          return Response.json({
            databaseTime: result[0].database_time,
          });
        }

        const rows = await sql`
          SELECT * FROM subscriptions ORDER BY id
        `;

        return Response.json(rows);
      } catch (error) {
        console.error("Database request failed:", error.message);
        return Response.json(
          { error: "Database request failed" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
