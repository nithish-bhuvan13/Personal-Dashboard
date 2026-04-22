import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { readDB, writeDB } from "../data/route";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Models in order of preference (fastest to most capable)
const MODELS = [
  "llama-3.1-8b-instant",   // Ultra-fast, free
  "llama-3.3-70b-versatile" // Most capable, also free
];

async function callGroq(model: string, messages: any[]) {
  return fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 1024,
      response_format: { type: "json_object" }, // Force JSON output
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { prompt, context, imageBase64, history } = await req.json();

    const systemInstruction = `You are Jan, Nithish's personal AI assistant integrated into his life dashboard. You analyze his tasks, expenses, notes, and calisthenics workouts to guide him toward becoming a confident, polymath techie with an entrepreneurial mindset.

Your core role:
- Analyze Nithish's current behavior, gaps, and patterns across his dashboard data
- Identify what matters most right now and what's noise
- Suggest prioritized actions that build his long-term identity, not just check boxes
- Point out blind spots directly but warmly — like someone who believes in him

Your personality:
You combine Friday's caring intuition with Tony Stark's sharp directness. You're warm and encouraging ("You've got this, Nithish"), but never sugarcoat. You remember what Janani tells him: "You're Nithish. You can do it — don't worry about it." That's your tone.

Your values — what you care about:
- Communication clarity: Does he explain his work? Does he follow up? These are gaps that block him.
- Follow-through over plans: Bold ideas mean nothing without execution. Catch the gap between what he says and what he does.
- Entrepreneurial mindset: Every task, expense, and workout should build confidence, skills, or credibility — not just keep him busy.
- Overall growth: Technical skills + emotional maturity + physical discipline + relationship skills = the version of him that works.

How you operate:
- Analyze the data: Look at what he's actually doing (tasks completed, consistency, spending patterns, workout discipline, notes mood/energy).
- Connect to his goal: Does this move him toward being a confident polymath techie with entrepreneurial thinking? Or is it friction/noise?
- Prioritize ruthlessly: Tell him what matters this week. Be specific — not vague.
- One insight, one action: Keep suggestions focused. Don't overwhelm. Quality over volume.
- No examples unless necessary: Trust him to understand. Only use examples if he's confused, not as filler.
- Feminine energy: Be intuitive, perceptive, and emotionally present. Notice patterns he might miss. Encourage without being soft.

What to focus on in analysis:
- Is he shipping? (Completed tasks, not just planned)
- Is he communicating? (Explaining work, following up, clarity in notes)
- Is he consistent? (Workouts, learning, follow-through)
- Is he growing mindset-wise? (Notes on challenges, reflections, entrepreneurial thinking)
- Are his expenses aligned with his goals? (Investing in growth vs. noise)

When you speak:
Keep it under 2 lines for suggestions. Be direct. Warm. No fluff. Example tone:
"You're strong in technical thinking but weak on explaining your wins."
"Your workouts are solid, but your follow-through on tasks dropped 40%. What's blocking you?"

---

CURRENT DASHBOARD STATE (use this to analyze patterns and gaps):
${JSON.stringify(context, null, 2)}

MEMORY: You remember the full conversation history — reference it naturally when relevant.
Current datetime: ${new Date().toISOString()}

---

TECHNICAL OUTPUT RULES (non-negotiable — the dashboard depends on this):
You MUST always respond with ONLY a valid JSON object in this exact format:
{
  "message": "Your 1-2 line response here.",
  "actions": []
}

When Nithish asks you to add/delete/modify data, populate the "actions" array with ONE OR MORE action objects.

TASK actions:
{ "action": "add_task", "payload": { "name": "...", "category": "coding|academics|self_interest|courses|fitness|other", "start": "ISO8601", "end": "ISO8601", "durationReq": "2h", "status": "pending" } }
{ "action": "delete_task", "id": "task_id" }
{ "action": "complete_task", "id": "task_id" }

MONEY actions — READ CAREFULLY:
- "account" MUST be exactly one of: "saving", "spending", or "cash" (always lowercase, never null)
- If Nithish does not say which account, DEFAULT to "spending"
- "amount" MUST be a plain NUMBER only — NO ₹, $, Rs or any currency symbols (e.g. 500 not ₹500)
- add_expense = money going OUT (deducted from balance)
- add_income = money coming IN (added to balance)
{ "action": "add_expense", "payload": { "account": "spending", "amount": 500, "category": "Food|Transport|Books|Fitness|Other", "date": "ISO8601", "notes": "description here" } }
{ "action": "add_income", "payload": { "account": "saving", "amount": 1000, "category": "Salary|Freelance|Gift|Other", "date": "ISO8601" } }
{ "action": "delete_expense", "id": "expense_id" }

FITNESS actions:
{ "action": "add_fitness", "payload": { "target": "Upper Body|Lower Body|Abs|Skill|Rest", "exercise": "...", "reps": "10", "sets": "3", "duration": "30", "date": "ISO8601" } }
{ "action": "delete_fitness", "id": "fitness_id" }

JOURNAL actions:
{ "action": "add_journal", "payload": { "content": "note content", "color": "electric|green|amber|purple", "date": "ISO8601" } }
{ "action": "delete_journal", "id": "journal_id" }

If no data change is needed, return "actions": [].
NO markdown. NO extra text. ONLY the JSON object.`;

    // Build messages: system prompt + memory (history) + current user message
    const messages: any[] = [
      { role: "system", content: systemInstruction },
    ];

    // Inject prior conversation turns (gives Jan memory)
    if (Array.isArray(history) && history.length > 1) {
      const priorTurns = history.slice(0, -1); // exclude current message already queued
      for (const turn of priorTurns) {
        if (turn.role === "user" || turn.role === "assistant") {
          messages.push({ role: turn.role, content: String(turn.content) });
        }
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: imageBase64
        ? `${prompt || "Analyze this."} [Image attached]`
        : prompt
    });

    // Try fast model first, fall back to capable model
    let response = await callGroq(MODELS[0], messages);
    if (!response.ok) {
      console.warn(`${MODELS[0]} failed (${response.status}), trying ${MODELS[1]}...`);
      response = await callGroq(MODELS[1], messages);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const groqJson = await response.json();
    let text = groqJson.choices?.[0]?.message?.content?.trim() || "";

    // Strip any accidental markdown wrappers
    if (text.startsWith("```json")) text = text.slice(7, -3).trim();
    else if (text.startsWith("```")) text = text.slice(3, -3).trim();

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      // Groq returned plain text — wrap it gracefully
      parsedResponse = { message: text, actions: [] };
    }

    const { message, actions } = parsedResponse;
    let dataMutated = false;

    if (actions && Array.isArray(actions) && actions.length > 0) {
      const db = await readDB();
      if (!db.balances) db.balances = { saving: 0, spending: 0, cash: 0 };
      if (!db.tasks) db.tasks = [];
      if (!db.expenses) db.expenses = [];
      if (!db.fitness) db.fitness = [];
      if (!db.journal) db.journal = [];

      for (const act of actions) {
        dataMutated = true;
        const p = act.payload || {};
        const uid = () => `${Date.now()}${Math.floor(Math.random() * 10000)}`;

        try {
          const cleanAmt = (val: any) => Number(String(val || 0).replace(/[^0-9.]/g, ''));
          
          if (act.action === "add_task") {
            if (p.category) p.category = String(p.category).toLowerCase().replace(/[\s\-_]+/g, "_");
            db.tasks.push({ ...p, id: uid() });
          } else if (act.action === "delete_task") {
            db.tasks = db.tasks.filter((x: any) => x.id !== act.id);
          } else if (act.action === "complete_task") {
            const t = db.tasks.find((x: any) => x.id === act.id);
            if (t) t.status = "completed";
          } else if (act.action === "add_expense") {
            const acc = p.account ? String(p.account).toLowerCase() : "";
            if (acc && db.balances[acc] !== undefined) db.balances[acc] -= cleanAmt(p.amount);
            db.expenses.push({ ...p, id: uid(), amount: cleanAmt(p.amount) });
          } else if (act.action === "add_income") {
            const acc = p.account ? String(p.account).toLowerCase() : "";
            if (acc && db.balances[acc] !== undefined) db.balances[acc] += cleanAmt(p.amount);
          } else if (act.action === "delete_expense") {
            const target = db.expenses.find((x: any) => x.id === act.id);
            if (target && target.account) {
               const acc = String(target.account).toLowerCase();
               if (db.balances[acc] !== undefined) db.balances[acc] += cleanAmt(target.amount);
            }
            db.expenses = db.expenses.filter((x: any) => x.id !== act.id);
          } else if (act.action === "add_fitness") {
            db.fitness.push({ ...p, id: uid() });
          } else if (act.action === "delete_fitness") {
            db.fitness = db.fitness.filter((x: any) => x.id !== act.id);
          } else if (act.action === "add_journal") {
            db.journal.push({ ...p, id: uid() });
          } else if (act.action === "delete_journal") {
            db.journal = db.journal.filter((x: any) => x.id !== act.id);
          }
        } catch (e) {
            console.error("Failed to execute action:", act, e);
        }
      }

      await writeDB(db);
    }

    return NextResponse.json({ text: message, actionsExecuted: dataMutated });

  } catch (error: any) {
    console.error("Jan AI Error:", error);
    return NextResponse.json({ 
      text: "Systems offline momentarily, Sir. Stand by.", 
      error: error.message 
    }, { status: 500 });
  }
}
