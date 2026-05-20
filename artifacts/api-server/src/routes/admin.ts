import { Router, type Request, type Response, type NextFunction } from "express";
import { db, waitlistTable, demoRequestsTable, calculatorSessionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminPassword) {
    res.status(503).json({ error: "ADMIN_PASSWORD is not configured." });
    return;
  }

  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  req.session.isAdmin = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error." });
      return;
    }
    res.json({ success: true });
  });
});

router.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/admin/waitlist", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(waitlistTable).orderBy(desc(waitlistTable.createdAt));
  res.json(rows);
});

router.get("/admin/demo-requests", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(demoRequestsTable).orderBy(desc(demoRequestsTable.createdAt));
  res.json(rows);
});

router.get("/admin/calculator-sessions", requireAdmin, async (req, res) => {
  const includeTest = req.query["includeTest"] === "true";

  const rows = await db
    .select()
    .from(calculatorSessionsTable)
    .orderBy(desc(calculatorSessionsTable.createdAt));

  const filtered = includeTest ? rows : rows.filter((r) => !r.isTest);
  res.json(filtered);
});

router.patch("/admin/calculator-sessions/:id/toggle-test", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"] ?? ""), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  const [existing] = await db
    .select()
    .from(calculatorSessionsTable)
    .where(eq(calculatorSessionsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const [updated] = await db
    .update(calculatorSessionsTable)
    .set({ isTest: !existing.isTest })
    .where(eq(calculatorSessionsTable.id, id))
    .returning();

  res.json(updated);
});

router.get("/admin/waitlist/export.csv", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(waitlistTable).orderBy(desc(waitlistTable.createdAt));

  const header = "id,email,name,child_age,created_at";
  const lines = rows.map((r) =>
    [r.id, csvEscape(r.email), csvEscape(r.name), csvEscape(r.childAge), r.createdAt?.toISOString()].join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="waitlist-${dateStamp()}.csv"`);
  res.send([header, ...lines].join("\n"));
});

router.get("/admin/demo-requests/export.csv", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(demoRequestsTable).orderBy(desc(demoRequestsTable.createdAt));

  const header = "id,name,email,institution,job_title,calculated_upside,created_at";
  const lines = rows.map((r) =>
    [
      r.id,
      csvEscape(r.name),
      csvEscape(r.email),
      csvEscape(r.institution),
      csvEscape(r.jobTitle),
      r.calculatedUpside?.toFixed(2),
      r.createdAt?.toISOString(),
    ].join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="demo-requests-${dateStamp()}.csv"`);
  res.send([header, ...lines].join("\n"));
});

router.get("/admin/calculator-sessions/export.csv", requireAdmin, async (req, res) => {
  const includeTest = req.query["includeTest"] === "true";

  const rows = await db
    .select()
    .from(calculatorSessionsTable)
    .orderBy(desc(calculatorSessionsTable.createdAt));

  const filtered = includeTest ? rows : rows.filter((r) => !r.isTest);

  const header = "id,email,waitlist,eligibility_pct,interp_fee,years,calculated_upside,is_test,created_at";
  const lines = filtered.map((r) => {
    const inp = (r.inputs ?? {}) as Record<string, number>;
    return [
      r.id,
      csvEscape(r.email),
      inp["waitlist"] ?? "",
      inp["eligibility"] ?? "",
      inp["interp_fee"] ?? "",
      inp["years"] ?? "",
      r.calculatedUpside?.toFixed(2),
      r.isTest ? "true" : "false",
      r.createdAt?.toISOString(),
    ].join(",");
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="calculator-sessions-${dateStamp()}.csv"`);
  res.send([header, ...lines].join("\n"));
});

function csvEscape(val: string | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export default router;
