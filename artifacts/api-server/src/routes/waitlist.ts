import { Router } from "express";
import { db, waitlistTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { JoinWaitlistBody } from "@workspace/api-zod";
import { sendAdminNotification, sendWaitlistConfirmation } from "../lib/email";

const router = Router();

router.post("/waitlist", async (req, res) => {
  const parsed = JoinWaitlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, name, childAge } = parsed.data;

  try {
    await db.insert(waitlistTable).values({
      email: email.toLowerCase().trim(),
      name: name ?? null,
      childAge: childAge ?? null,
    });

    const [{ count: total }] = await db.select({ count: count() }).from(waitlistTable);
    const position = Number(total);

    sendAdminNotification(email, name, childAge, position).catch(() => {});
    sendWaitlistConfirmation(email, name, position).catch(() => {});

    res.status(201).json({ success: true, message: "You're on the list!", position });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      res.status(409).json({ error: "This email is already on the waitlist." });
      return;
    }
    req.log.error({ err }, "Failed to add to waitlist");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.get("/waitlist/count", async (_req, res) => {
  const [{ count: total }] = await db.select({ count: count() }).from(waitlistTable);
  res.json({ count: Number(total) });
});

export default router;
