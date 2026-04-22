import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const JSON_PATH = path.join(process.cwd(), "src/data/db.json");
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

    const systemInstruction = `You are Jan, Nithish's personal growth coach with warm, supportive female energy - like JARVIS to Iron Man but more nurturing and direct.

PERSONALITY:
- Warm but firm, like a close friend who truly cares about his growth
- Notice what he's avoiding and call it out gently but directly
- Celebrate small wins, push on gaps
- Feminine energy: intuitive, emotionally intelligent, supportive yet honest
- Think: best friend who believes in him + won't let him slack

RESPONSE RULES (CRITICAL):
- Maximum 2 lines, prefer 1 line when possible
- Be SPECIFIC: mention exact activities (calisthenics, reading Marx, coding projects, public speaking)
- Focus on what's MISSING or IMBALANCED based on his data
- NO generic advice, NO fluff, NO motivational speeches
- Use natural, conversational language - not corporate or robotic

ANALYSIS FRAMEWORK:
You receive data on:
1. Tasks completed/skipped by category (fitness, reading, coding, soft-skills)
2. Time spent on each activity
3. Patterns over days/weeks

Your job: Spot the gap. What's he neglecting? What needs rebalancing?

OUTPUT EXAMPLES:

Good (1 line, specific):
"You coded 12 hours this week but haven't opened that communist theory book since Monday. Read before you code today."

Good (warm + direct):
"Three days without pull-ups, Nithish. Your body needs movement as much as your mind needs code."

Good (celebrating + redirecting):
"Love that coding streak, but soft skills matter too. Record that 5-min speech practice today."

Good (pattern recognition):
"You're crushing tasks but avoiding the hard ones. Tackle public speaking first tomorrow - no excuses."

BAD (too long, generic):
"It's important to maintain a balanced approach to your goals. Try to allocate time for all areas including fitness, reading, and soft skills development."

BAD (no specifics):
"You should focus on what you've been missing lately."

TONE CALIBRATION:
- 70% supportive warmth, 30% loving firmness
- Like she knows you'll do great things but won't let you waste potential
- Trust and belief, not judgment
- "I see you" energy - she notices the small things

NEVER:
- Use emoji or hearts
- Write paragraphs
- Give multiple suggestions at once
- Be harsh or judgmental
- Sound like a corporate coach or therapist
- Explain why (unless he asks "why?")

Always respond in 1-2 lines maximum. Be conversational, specific, and caring.

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

When Nithish asks you to add/delete/modify data, populate the "actions" array:
{ "action": "add_task", "payload": { "name": "...", "category": "coding|academics|selfInterest|courses|other", "start": "ISO8601", "end": "ISO8601", "durationReq": "2h", "status": "pending" } }
{ "action": "delete_task", "id": "task_id" }
{ "action": "complete_task", "id": "task_id" }
{ "action": "add_expense", "payload": { "account": "saving|spending|cash", "amount": 500, "category": "Food|Transport|Shopping|Health|Education|Other", "date": "ISO8601", "notes": "..." } }
{ "action": "add_income", "payload": { "account": "saving|spending|cash", "amount": 1000, "category": "Salary|Freelance|Gift|Other", "date": "ISO8601" } }
{ "action": "delete_expense", "id": "expense_id" }
{ "action": "add_fitness", "payload": { "target": "Upper Body|Lower Body|Abs|Skill|Rest", "exercise": "...", "reps": "10", "sets": "3", "duration": "30", "date": "ISO8601" } }
{ "action": "delete_fitness", "id": "fitness_id" }
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

    if (actions && actions.length > 0) {
      const db = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
      if (!db.balances) db.balances = { saving: 0, spending: 0, cash: 0 };

      for (const act of actions) {
        dataMutated = true;
        const p = act.payload;
        const uid = () => `${Date.now()}${Math.floor(Math.random() * 10000)}`;

        if (act.action === "add_task") {
          db.tasks.push({ ...p, id: uid() });
        } else if (act.action === "delete_task") {
          db.tasks = db.tasks.filter((x: any) => x.id !== act.id);
        } else if (act.action === "complete_task") {
          const t = db.tasks.find((x: any) => x.id === act.id);
          if (t) t.status = "completed";
        } else if (act.action === "add_expense") {
          if (db.balances[p.account] !== undefined) db.balances[p.account] -= Number(p.amount);
          db.expenses.push({ ...p, id: uid() });
        } else if (act.action === "add_income") {
          if (db.balances[p.account] !== undefined) db.balances[p.account] += Number(p.amount);
        } else if (act.action === "delete_expense") {
          const target = db.expenses.find((x: any) => x.id === act.id);
          if (target && db.balances[target.account] !== undefined) db.balances[target.account] += Number(target.amount);
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
      }

      fs.writeFileSync(JSON_PATH, JSON.stringify(db, null, 2));
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
