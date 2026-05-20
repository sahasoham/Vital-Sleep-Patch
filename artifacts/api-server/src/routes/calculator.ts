import { Router } from "express";
import { db, calculatorSessionsTable } from "@workspace/db";
import { SaveCalculatorSessionBody } from "@workspace/api-zod";

const router = Router();

router.post("/calculator/session", async (req, res) => {
  const parsed = SaveCalculatorSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, calculatedUpside, inputs, isTest } = parsed.data;

  try {
    const [row] = await db
      .insert(calculatorSessionsTable)
      .values({
        email: email ?? null,
        calculatedUpside,
        inputs: inputs as Record<string, unknown>,
        isTest: isTest ?? false,
      })
      .returning();

    res.status(201).json({ success: true, id: row!.id });
  } catch (err) {
    req.log.error({ err }, "Failed to save calculator session");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;
