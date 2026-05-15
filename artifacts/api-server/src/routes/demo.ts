import { Router } from "express";
import { db, demoRequestsTable } from "@workspace/db";
import { RequestDemoBody } from "@workspace/api-zod";
import { sendDemoRequestNotification } from "../lib/email";

const router = Router();

router.post("/demo", async (req, res) => {
  const parsed = RequestDemoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, email, institution, jobTitle, calculatedUpside, inputs } = parsed.data;

  try {
    await db.insert(demoRequestsTable).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      institution: institution.trim(),
      jobTitle: jobTitle ?? null,
      calculatedUpside,
      inputs: inputs as Record<string, unknown>,
    });

    sendDemoRequestNotification(
      name,
      email,
      institution,
      jobTitle,
      calculatedUpside,
      inputs as Record<string, unknown>,
    ).catch(() => {});

    res.status(201).json({ success: true, message: "Thanks! We'll be in touch shortly." });
  } catch (err) {
    req.log.error({ err }, "Failed to save demo request");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;
