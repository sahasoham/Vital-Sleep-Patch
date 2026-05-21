import { Router } from "express";
import { randomUUID } from "crypto";
import { db, conversations, messages } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { CalcAiInterpretBody, CalcAiChatBody, CalcAiPitchMemoBody } from "@workspace/api-zod";
import { eq, asc } from "drizzle-orm";

const router = Router();

function buildCalculatorContext(inputs: Record<string, unknown>, results: Record<string, unknown>): string {
  const i = inputs as Record<string, number>;
  const r = results as Record<string, number>;
  return `
You are an expert healthcare finance advisor helping a hospital administrator understand the revenue opportunity from deploying Vital Sleep Patch — a wire-free, at-home pediatric sleep apnea screening patch that creates a parallel diagnostic pathway alongside in-lab PSG studies. This is an investigational device.

CURRENT CALCULATOR INPUTS:
- Annual pediatric PSG volume (in-lab): ${i.psg_volume ?? "N/A"}
- Current waitlist length: ${i.waitlist ?? "N/A"} patients
- Home-test eligibility rate: ${i.eligibility ?? "N/A"}%
- Interpretation fee per test: $${i.interp_fee ?? "N/A"}
- Follow-up consult revenue per patient: $${i.consult_fee ?? "N/A"}
- Downstream treatment referral rate: ${i.referral_rate ?? "N/A"}%
- Average downstream revenue per referred patient: $${i.treatment_rev ?? "N/A"}
- Annual monitoring revenue per patient: $${i.monitoring_rev ?? "N/A"}
- Years of follow-up modeled: ${i.years ?? "N/A"}

CALCULATED RESULTS:
- Eligible patients from waitlist: ${Math.round((r.vitalTests as number) ?? 0)}
- Interpretation revenue: $${Math.round((r.interpRevenue as number) ?? 0).toLocaleString()}
- Follow-up consult revenue: $${Math.round((r.consultRevenue as number) ?? 0).toLocaleString()}
- Downstream treatment revenue: $${Math.round((r.treatRevenue as number) ?? 0).toLocaleString()}
- Monitoring revenue: $${Math.round((r.monitorRevenue as number) ?? 0).toLocaleString()}
- Total revenue upside over ${i.years ?? "N/A"} year(s): $${Math.round((r.total as number) ?? 0).toLocaleString()}

IMPORTANT GUIDELINES:
- Always refer to revenue as "estimated" or "potential" — this is a modeling tool, not a guarantee
- Refer to Vital Sleep Patch as an "investigational device" when relevant
- Be concise and conversational — you're talking to a busy hospital administrator
- Use specific numbers from the calculator above in your answers
- Do not make up clinical data or peer institution numbers unless clearly framed as illustrative estimates
  `.trim();
}

router.post("/calculator/ai/interpret", async (req, res) => {
  const parsed = CalcAiInterpretBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { inputs, results } = parsed.data;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: buildCalculatorContext(inputs, results),
      messages: [
        {
          role: "user",
          content: "Give me a 2-3 sentence plain-English summary of what these numbers mean for my institution. Be specific with the dollar figures and frame this as the revenue I'm currently leaving on the table by not having a home-test pathway. Keep it punchy and executive-level."
        }
      ]
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text : "";
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI interpretation");
    res.status(500).json({ error: "AI interpretation failed" });
  }
});

router.post("/calculator/ai/chat", async (req, res) => {
  const parsed = CalcAiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { sessionToken: clientToken, message: userMessage, inputs, results } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let convId: number;
    let sessionToken: string;

    if (clientToken) {
      // Look up conversation by the opaque session token — never trust a raw ID
      const [existing] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.sessionToken, clientToken));

      if (!existing) {
        res.write(`data: ${JSON.stringify({ error: "Conversation not found", done: true })}\n\n`);
        res.end();
        return;
      }

      convId = existing.id;
      sessionToken = clientToken;
    } else {
      // Create a new conversation with an unguessable session token
      sessionToken = randomUUID();
      const [conv] = await db
        .insert(conversations)
        .values({ title: "Calculator Chat", sessionToken })
        .returning();
      convId = conv!.id;
    }

    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content: userMessage,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(asc(messages.createdAt));

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: buildCalculatorContext(inputs, results),
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text, sessionToken })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true, sessionToken })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to stream AI chat response");
    res.write(`data: ${JSON.stringify({ error: "AI chat failed", done: true })}\n\n`);
    res.end();
  }
});

router.post("/calculator/ai/pitch-memo", async (req, res) => {
  const parsed = CalcAiPitchMemoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { institution, inputs, results } = parsed.data;
  const i = inputs as Record<string, number>;
  const r = results as Record<string, number>;
  const institutionName = institution || "Your Institution";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: buildCalculatorContext(inputs, results),
      messages: [
        {
          role: "user",
          content: `Generate a professional one-page pitch memo for ${institutionName} that I can share with hospital leadership and administrators. 

The memo should:
1. Start with a compelling headline
2. Include an "Executive Summary" section (2-3 sentences)
3. Include a "The Opportunity" section explaining the waitlist problem and at-home testing solution
4. Include a "Revenue Model" section with the specific numbers from the calculator in a clear breakdown
5. Include "Key Talking Points" as a bulleted list (4-5 bullets)
6. Include a "Next Steps" section
7. End with a brief "About Vital Sleep Patch" paragraph (mention it's an investigational device)

Total length: about 400-500 words. Use markdown formatting with ## headers. Institution name: ${institutionName}. Use $${Math.round((r.total as number) ?? 0).toLocaleString()} as the total estimated upside over ${i.years ?? 3} year(s).`
        }
      ]
    });

    const block = message.content[0];
    const memo = block.type === "text" ? block.text : "";
    res.json({ memo });
  } catch (err) {
    req.log.error({ err }, "Failed to generate pitch memo");
    res.status(500).json({ error: "Pitch memo generation failed" });
  }
});

export default router;
