import { useState } from "react";

const weeks = [
  {
    id: 1, theme: "FOUNDATION", sub: "Build consistency. Own the movement.",
    color: "#f97316", glow: "rgba(249,115,22,0.3)",
    days: [
      { day: 1, label: "PUSH", tag: "Upper Body", isRest: false,
        warmup: ["Arm circles × 20", "Wrist rolls × 20", "Cat-cow × 10", "Shoulder shrugs × 15"],
        work: [
          { name: "Push-ups", sets: "4 × 10", note: "Full ROM · chest to floor · 60s rest" },
          { name: "Diamond Push-ups", sets: "3 × 6", note: "Elbows tight, hands in triangle · 60s rest" },
          { name: "Pike Push-ups", sets: "3 × 8", note: "Hips high, head toward floor · 60s rest" },
          { name: "Floor Tricep Dips", sets: "3 × 12", note: "Hands behind, elbows back · 45s rest" },
        ],
        cooldown: ["Chest stretch 30s each side", "Shoulder cross-body stretch 30s", "Child's pose 1 min"],
        tip: "Your PR is 40 — today do 10 reps × 4 sets. Leave 10 in the tank. Quality over quantity."
      },
      { day: 2, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Hip circles × 20", "Leg swings × 15 each", "Good mornings × 10", "Ankle rolls × 15"],
        work: [
          { name: "Bodyweight Squats", sets: "4 × 15", note: "Full depth · 2s pause at bottom · 60s rest" },
          { name: "Reverse Lunges", sets: "3 × 10 each", note: "Rear knee hovers above floor · 60s rest" },
          { name: "Glute Bridges", sets: "3 × 15", note: "Squeeze hard at top · 45s rest" },
          { name: "Plank Hold", sets: "3 × 45s", note: "Hips level, no sagging · 45s rest" },
          { name: "Hollow Body Hold", sets: "3 × 20s", note: "Lower back pressed flat · 45s rest" },
        ],
        cooldown: ["Quad stretch 30s each", "Hip flexor lunge stretch 30s each", "Seated forward fold 1 min"],
        tip: "Squats feel easy — add a 2-second pause at the bottom to make it real work."
      },
      { day: 3, label: "SKILL", tag: "Balance & Control", isRest: false,
        warmup: ["Wrist circles × 20", "Shoulder rotations × 15", "Cat-cow × 10", "Deep squat hold 1 min"],
        work: [
          { name: "Frog Stand", sets: "5 × 5s hold", note: "Knees pressing into elbows · 30s rest" },
          { name: "L-Sit (floor)", sets: "6 × 1-2s hold", note: "Legs as straight as possible · 30s rest" },
          { name: "Wall Handstand", sets: "4 × 10s", note: "Belly-to-wall facing wall · 45s rest" },
          { name: "Bear Crawl", sets: "3 × 30 steps", note: "Knees hover 1 inch off floor · 45s rest" },
          { name: "Shoulder Taps", sets: "3 × 10 each side", note: "From plank position, stay stable · 45s rest" },
        ],
        cooldown: ["Downward dog 1 min", "Child's pose 1 min", "Seated wrist stretch 30s"],
        tip: "Skill days are low ego. 5 seconds of clean frog stand beats 30 sloppy seconds."
      },
      { day: 4, label: "PUSH", tag: "Upper Body", isRest: false,
        warmup: ["Arm circles × 20", "Wrist rolls × 20", "Cat-cow × 10"],
        work: [
          { name: "Push-ups", sets: "4 × 12", note: "Up 2 reps from Day 1 · 60s rest" },
          { name: "Wide Push-ups", sets: "3 × 10", note: "Hands wider than shoulder-width · 60s rest" },
          { name: "Pike Push-ups", sets: "3 × 10", note: "Slower 3s descent · 60s rest" },
          { name: "Floor Dips", sets: "3 × 12", note: "1s pause at bottom · 45s rest" },
        ],
        cooldown: ["Chest stretch 30s each", "Tricep stretch 30s each", "Child's pose 1 min"],
        tip: "4 × 12 = 48 reps total vs your PR of 40. Volume builds the base."
      },
      { day: 5, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Hip circles × 20", "Leg swings × 15", "Squat pulses 30s", "Ankle rolls × 15"],
        work: [
          { name: "Jump Squats", sets: "4 × 10", note: "Land soft with bent knees · 60s rest" },
          { name: "Side Lunges", sets: "3 × 10 each", note: "Push hips back, inner thigh stretch · 60s rest" },
          { name: "Single-Leg Glute Bridge", sets: "3 × 12 each", note: "Non-working leg extended · 45s rest" },
          { name: "Plank Hip Dips", sets: "3 × 10 each side", note: "Hip rotation in forearm plank · 45s rest" },
          { name: "Dead Bug", sets: "3 × 8 each side", note: "Opposite arm + leg, slow and controlled · 45s rest" },
        ],
        cooldown: ["Standing quad stretch 30s each", "Figure-4 glute stretch 30s each", "Forward fold 1 min"],
        tip: "First time doing jump squats — land with soft knees every single rep."
      },
      { day: 6, label: "ACTIVE", tag: "Recovery + Skill", isRest: false,
        warmup: ["Full body light flow 2 min"],
        work: [
          { name: "Frog Stand", sets: "5 × 6s hold", note: "+1 second from Day 3 · 30s rest" },
          { name: "L-Sit", sets: "6 × 2s hold", note: "Slightly longer than Day 3 · 30s rest" },
          { name: "Slow Negative Push-ups", sets: "3 × 5", note: "4s down, 1s pause, fast up · 75s rest" },
          { name: "Deep Squat Hold", sets: "3 × 30s", note: "Chest up, heels down · 45s rest" },
          { name: "Hollow Body Rocks", sets: "3 × 10", note: "Controlled rocking motion · 45s rest" },
        ],
        cooldown: ["Full body stretch flow — no rush · 5 min"],
        tip: "Active recovery. Move, breathe, don't push. This is maintenance, not training."
      },
      { day: 7, label: "REST", tag: "Full Recovery", isRest: true,
        warmup: [], work: [], cooldown: [],
        tip: "Complete rest. Walk if you want. Sleep 8 hours. Your body gets stronger now, not during training."
      },
    ]
  },
  {
    id: 2, theme: "VOLUME", sub: "More reps. More sets. Build endurance.",
    color: "#10b981", glow: "rgba(16,185,129,0.3)",
    days: [
      { day: 8, label: "PUSH", tag: "Upper Body", isRest: false,
        warmup: ["Arm circles × 20", "Wrist rolls × 20", "Cat-cow × 10", "3 slow activation push-ups"],
        work: [
          { name: "Push-ups", sets: "5 × 10", note: "5 sets now · 60s rest" },
          { name: "Diamond Push-ups", sets: "3 × 8", note: "+2 reps from Week 1 · 60s rest" },
          { name: "Archer Push-ups", sets: "3 × 6 each side", note: "NEW: shift weight sideways, one arm loads · 75s rest" },
          { name: "Pike Push-ups", sets: "3 × 10", note: "2s descent every rep · 60s rest" },
        ],
        cooldown: ["Chest stretch 30s", "Doorframe stretch 30s", "Child's pose 1 min"],
        tip: "Archer push-ups are the hardest new movement. Go slow — the loaded arm does 80% of the work."
      },
      { day: 9, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Hip circles × 20", "Squat pulses × 20", "Leg swings × 15", "Calf raises × 20"],
        work: [
          { name: "Bulgarian Split Squat", sets: "3 × 10 each", note: "Rear foot on bed edge · 75s rest" },
          { name: "Squat Hold", sets: "3 × 30s", note: "Full depth, chest up · 45s rest" },
          { name: "Calf Raises (slow)", sets: "3 × 20", note: "2s up, 2s down · 30s rest" },
          { name: "Plank Hold", sets: "3 × 1 min", note: "Match your current 1 min PR · 45s rest" },
          { name: "Leg Raises", sets: "3 × 10", note: "Lying flat, legs straight, slow lower · 45s rest" },
        ],
        cooldown: ["Quad stretch 30s each", "Pigeon pose 30s each", "Seated forward fold 1 min"],
        tip: "Bulgarian split squats will be hard. Bed edge is perfect height. Front knee tracks over toes."
      },
      { day: 10, label: "SKILL", tag: "Balance & Control", isRest: false,
        warmup: ["Wrist prep 2 min", "Shoulder rotations × 15", "Deep squat 1 min"],
        work: [
          { name: "Frog Stand → Crow Pose", sets: "6 × 6s hold", note: "Try to transfer into crow · 30s rest" },
          { name: "L-Sit", sets: "6 × 2-3s hold", note: "Push floor away, hips forward · 30s rest" },
          { name: "Wall Handstand", sets: "4 × 15s", note: "+5s from Week 1 · 45s rest" },
          { name: "Elevated Pike Push-ups", sets: "3 × 6", note: "Hands on books/small platform · 75s rest" },
          { name: "Bear Crawl", sets: "3 × 40 steps", note: "+10 steps · 45s rest" },
        ],
        cooldown: ["Downward dog 1 min", "Child's pose 1 min", "Wrist stretch 30s"],
        tip: "Goal this week: transition frog stand → crow pose. You're one lean away from it."
      },
      { day: 11, label: "PUSH", tag: "Upper Body", isRest: false,
        warmup: ["Arm circles × 20", "Wrist rolls × 20", "Cat-cow × 10"],
        work: [
          { name: "Push-ups", sets: "5 × 12", note: "Building toward PR zone · 75s rest" },
          { name: "Decline Push-ups", sets: "3 × 8", note: "NEW: feet on bed · 75s rest" },
          { name: "Diamond Push-ups", sets: "3 × 8", note: "1s hold at bottom · 60s rest" },
          { name: "Pseudo Planche Lean", sets: "3 × 20s", note: "Hands by hips, lean forward, arms straight · 45s rest" },
        ],
        cooldown: ["Chest stretch 30s", "Tricep overhead stretch 30s each", "Child's pose 1 min"],
        tip: "Decline push-ups shift load to upper chest. Your bed is the perfect platform."
      },
      { day: 12, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Hip circles × 20", "Leg swings × 15", "Jumping jacks × 20"],
        work: [
          { name: "Jump Squats", sets: "4 × 12", note: "+2 reps from Week 1 · 60s rest" },
          { name: "Assisted Pistol Squat", sets: "3 × 6 each", note: "Hold doorframe · 75s rest" },
          { name: "Glute Bridge", sets: "3 × 20", note: "High rep · 45s rest" },
          { name: "Plank to Downward Dog", sets: "3 × 10", note: "Flow between positions · 45s rest" },
          { name: "V-Ups", sets: "3 × 8", note: "Hands and feet meet at top · 60s rest" },
        ],
        cooldown: ["Quad stretch 30s each", "Hip flexor stretch 30s each", "Seated twist 30s each"],
        tip: "Assisted pistol squats are your next big goal. Use doorframe lightly — try to depend on it less each rep."
      },
      { day: 13, label: "ACTIVE", tag: "Recovery + Skill", isRest: false,
        warmup: ["Light full body flow 2 min"],
        work: [
          { name: "Crow Pose", sets: "5 × max hold", note: "Best effort each set · 30s rest" },
          { name: "L-Sit", sets: "5 × 3s", note: "Consistent quality reps · 30s rest" },
          { name: "Slow Negative Push-ups", sets: "3 × 5", note: "5s down, fast up · 90s rest" },
          { name: "Wall Sit", sets: "3 × 40s", note: "Back flat on wall · 45s rest" },
          { name: "Core Tri-set", sets: "2 rounds", note: "30s plank → 20s hollow body → 20s side plank each · min rest" },
        ],
        cooldown: ["Full stretch flow 5 min"],
        tip: "Active recovery. Quality of movement — don't rush, don't skip."
      },
      { day: 14, label: "REST", tag: "Full Recovery", isRest: true,
        warmup: [], work: [], cooldown: [],
        tip: "Rest day. Hydrate well. Sleep 8 hours. You've done 2 full weeks. Your body is adapting."
      },
    ]
  },
  {
    id: 3, theme: "INTENSITY", sub: "Harder variations. Slower tempo. Real strength.",
    color: "#ef4444", glow: "rgba(239,68,68,0.3)",
    days: [
      { day: 15, label: "PUSH", tag: "Upper Body", isRest: false,
        warmup: ["Arm circles × 20", "Wrist prep × 20", "3 slow activation push-ups"],
        work: [
          { name: "Tempo Push-ups (3-1-1)", sets: "4 × 10", note: "3s down · 1s hold · 1s up · 90s rest" },
          { name: "Archer Push-ups", sets: "4 × 6 each", note: "+1 set from Week 2 · 90s rest" },
          { name: "Pike Push-ups", sets: "4 × 8", note: "Head actually touches floor · 75s rest" },
          { name: "Pseudo Planche Lean", sets: "4 × 25s", note: "Lean harder, protract shoulders · 45s rest" },
        ],
        cooldown: ["Chest stretch 30s", "Doorframe stretch 30s", "Child's pose 1 min"],
        tip: "Tempo push-ups are brutal. 3 full seconds down is the entire point — don't cheat the descent."
      },
      { day: 16, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Hip circles × 20", "Squat flow × 10", "Leg swings × 15"],
        work: [
          { name: "Bulgarian Split Squat", sets: "4 × 10 each", note: "+1 set from Week 2 · 75s rest" },
          { name: "Assisted Pistol Squat", sets: "4 × 6 each", note: "Less wall support than last week · 90s rest" },
          { name: "Jump Squats", sets: "3 × 10", note: "Explosive, full extension at top · 60s rest" },
          { name: "L-Sit", sets: "5 × 3-5s", note: "Core compression · 30s rest" },
          { name: "Leg Raises", sets: "3 × 12", note: "Slow 3s lower · 45s rest" },
        ],
        cooldown: ["Pigeon pose 1 min each", "Quad stretch 30s each", "Forward fold 1 min"],
        tip: "Aim to reduce doorframe support on pistols by 50%. Trust your leg."
      },
      { day: 17, label: "SKILL PEAK", tag: "Balance & Control", isRest: false,
        warmup: ["Wrist prep 2 min", "Shoulder rotations × 15", "Deep squat hold 1 min"],
        work: [
          { name: "Crow Pose", sets: "6 × 5-8s hold", note: "Full crow — not frog stand · 30s rest" },
          { name: "L-Sit", sets: "6 × 4-5s hold", note: "Press hard into floor · 30s rest" },
          { name: "Wall Handstand", sets: "5 × 20s", note: "Toes barely touching wall · 45s rest" },
          { name: "Freestanding Handstand Kick-up", sets: "5 × 3 attempts", note: "Kick up, catch balance for 1-2s · 45s rest" },
          { name: "Planche Lean", sets: "3 × 30s", note: "Longest lean yet · 45s rest" },
        ],
        cooldown: ["Downward dog 1 min", "Child's pose 1 min", "Wrist stretch 1 min"],
        tip: "Crow pose is yours by now. 10 seconds of crow this week is a real achievement."
      },
      { day: 18, label: "PUSH MAX TEST", tag: "Mid-Month Check", isRest: false,
        warmup: ["Full arm + shoulder warm-up 4 min"],
        work: [
          { name: "Push-ups — MAX SET", sets: "1 × absolute max", note: "One shot · aim 35+ · rest 3 min after" },
          { name: "Diamond Push-ups", sets: "4 × 8", note: "After max set · 75s rest" },
          { name: "Decline Push-ups", sets: "3 × 10", note: "Feet elevated · 75s rest" },
          { name: "Floor Dips", sets: "3 × 15", note: "High rep finish · 45s rest" },
        ],
        cooldown: ["Deep chest + shoulder stretch 5 min"],
        tip: "The max set is a mid-month check-in. Go steady, don't sprint — sustainable pace beats burning out at rep 20."
      },
      { day: 19, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Dynamic flow 3 min"],
        work: [
          { name: "Squat Hold", sets: "3 × 1 min", note: "Full depth · 45s rest" },
          { name: "Pistol Squat (free)", sets: "3 × 3 each", note: "No wall · any reps you can manage · 90s rest" },
          { name: "Single-Leg Calf Raises", sets: "3 × 15 each", note: "Slow and controlled · 45s rest" },
          { name: "Dragon Flag (bent knees)", sets: "3 × 3-5", note: "NEW: grip bed frame or floor edge · 90s rest" },
          { name: "Plank Hold", sets: "2 × 75s", note: "Beat your 1 min PR by 15s · 45s rest" },
        ],
        cooldown: ["Full leg stretch flow 5 min"],
        tip: "Dragon flag with bent knees is completely valid. The eccentric lowering is where the strength comes from."
      },
      { day: 20, label: "ACTIVE", tag: "Recovery + Skill", isRest: false,
        warmup: ["Light flow 2 min"],
        work: [
          { name: "Crow Pose", sets: "5 × best hold", note: "Quality holds · 30s rest" },
          { name: "L-Sit", sets: "5 × 5s", note: "Hold the compression · 30s rest" },
          { name: "Slow Negative Push-ups", sets: "3 × 5", note: "5s down · 90s rest" },
          { name: "Full Mobility Flow", sets: "1 × 10 min", note: "Hip, shoulder, wrist — full rotation, no rush" },
        ],
        cooldown: ["Full body stretch 5 min"],
        tip: "Week 3 is the hardest. Your body is working. Recover with intent."
      },
      { day: 21, label: "REST", tag: "Full Recovery", isRest: true,
        warmup: [], work: [], cooldown: [],
        tip: "Rest. You've done 3 full weeks of real work. You're already a different version. Sleep well tonight."
      },
    ]
  },
  {
    id: 4, theme: "PEAK", sub: "Everything together. Test your limits.",
    color: "#a855f7", glow: "rgba(168,85,247,0.3)",
    days: [
      { day: 22, label: "PUSH", tag: "Upper Body", isRest: false,
        warmup: ["Full warm-up 3 min"],
        work: [
          { name: "Push-ups — 3 Max Sets", sets: "3 × absolute max each", note: "2 min rest between · aim 25-30+ per set" },
          { name: "Archer Push-ups", sets: "4 × 8 each", note: "Full commitment · 90s rest" },
          { name: "Pike Push-ups", sets: "4 × 10", note: "Head to floor every rep · 75s rest" },
          { name: "Planche Lean", sets: "4 × 30s", note: "Hardest lean yet · 45s rest" },
        ],
        cooldown: ["Deep chest + shoulder stretch 5 min"],
        tip: "3 max sets with 2 min rest between. This is endurance test territory."
      },
      { day: 23, label: "LEGS + CORE", tag: "Lower Body", isRest: false,
        warmup: ["Dynamic squat flow 3 min"],
        work: [
          { name: "Pistol Squat (free)", sets: "4 × 5 each", note: "No wall · aim for 5 clean reps · 90s rest" },
          { name: "Jump Squat Burnout", sets: "3 × 15", note: "Explosive · 60s rest" },
          { name: "Nordic Curl (attempt)", sets: "3 × 3-5", note: "NEW: knees on floor, feet under bed · 90s rest" },
          { name: "Dragon Flag", sets: "3 × 5", note: "Straighten legs if possible · 90s rest" },
          { name: "Hollow Body Hold", sets: "3 × 30s", note: "Longest hold of the month · 45s rest" },
        ],
        cooldown: ["Full leg stretch 5 min"],
        tip: "Nordic curls + dragon flag in the same session = you're playing a different game now."
      },
      { day: 24, label: "SKILL FINAL", tag: "Balance & Control", isRest: false,
        warmup: ["Wrist prep 2 min", "Shoulder activation 2 min"],
        work: [
          { name: "Crow Pose", sets: "6 × 10s hold", note: "Goal: 10s clean · 30s rest" },
          { name: "L-Sit", sets: "6 × 5-7s hold", note: "Goal: 5s minimum every set · 30s rest" },
          { name: "Wall Handstand", sets: "5 × 25-30s", note: "Lightest wall touch possible · 45s rest" },
          { name: "Freestanding Handstand Attempt", sets: "5 × max balance", note: "Kick up and find the balance · 60s rest" },
          { name: "Planche Lean", sets: "3 × 35s", note: "Final push on this month · 45s rest" },
        ],
        cooldown: ["Downward dog 1 min", "Child's pose 1 min", "Wrist stretch 1 min"],
        tip: "This is your skill PR day. One month of practice shows up right here. Trust the work."
      },
      { day: 25, label: "PUSH PR DAY", tag: "Beat Your Record", isRest: false,
        warmup: ["Full warm-up 4 min — don't skip a second"],
        work: [
          { name: "Push-ups — ABSOLUTE MAX", sets: "1 × all out", note: "BEAT 40. Rest fully. Sleep well the night before." },
          { name: "Rest", sets: "5 min complete rest", note: "" },
          { name: "Diamond Push-ups MAX", sets: "1 × max", note: "Your personal record here" },
          { name: "Pike Push-ups MAX", sets: "1 × max", note: "Your personal record here" },
          { name: "Slow Negatives (finisher)", sets: "2 × 5", note: "5s descent · 90s rest" },
        ],
        cooldown: ["Deep shoulder + chest stretch 5 min"],
        tip: "Sleep well. Eat well. Warm up fully. Then beat 40. You've built for this exact moment."
      },
      { day: 26, label: "LEGS + CORE PR", tag: "Beat Your Record", isRest: false,
        warmup: ["Dynamic flow 4 min"],
        work: [
          { name: "Squats — ABSOLUTE MAX", sets: "1 × all out", note: "BEAT 25. No pauses, no stopping." },
          { name: "Rest", sets: "5 min complete rest", note: "" },
          { name: "Pistol Squat MAX (each leg)", sets: "1 × max per side", note: "Your personal record" },
          { name: "Plank — MAX TIME", sets: "1 × all out", note: "Beat 1 min · aim for 90s+" },
          { name: "V-Ups (finisher)", sets: "3 × 10", note: "45s rest" },
        ],
        cooldown: ["Full body stretch 5 min"],
        tip: "You said squats were easy at 25. Today you prove how far easy has come."
      },
      { day: 27, label: "REFLECT", tag: "Final Active Day", isRest: false,
        warmup: ["Light flow 2 min"],
        work: [
          { name: "Crow Pose", sets: "5 × best hold", note: "Where did you start? Day 1: 5s frog stand." },
          { name: "L-Sit", sets: "5 × best hold", note: "Where did you start? Day 1: 1 second." },
          { name: "Full Body Movement Flow", sets: "1 × 15 min", note: "Slow. Intentional. No rush. Your movement." },
        ],
        cooldown: ["10 min full stretch — head to toe. No timer. Just breathe."],
        tip: "Last active day of the month. Reflect. What changed? What moved inside you, not just physically?"
      },
      { day: 28, label: "REST", tag: "Month Complete", isRest: true,
        warmup: [], work: [], cooldown: [],
        tip: "Month complete. Rest fully. Next month begins with a higher baseline. You've earned this rest."
      },
    ]
  }
];

const dayTypeColors: Record<string, string> = {
  "PUSH": "#f97316",
  "LEGS + CORE": "#10b981",
  "SKILL": "#3b82f6",
  "ACTIVE": "#8b5cf6",
  "REST": "#6b7280",
  "SKILL PEAK": "#3b82f6",
  "PUSH MAX TEST": "#ef4444",
  "PUSH PR DAY": "#ef4444",
  "LEGS + CORE PR": "#ef4444",
  "SKILL FINAL": "#3b82f6",
  "REFLECT": "#a855f7",
};

export default function CalisthenicsPlan() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  const week = weeks[activeWeek];
  const dayData = week.days[activeDay];
  const dayColor = dayTypeColors[dayData.label] || week.color;

  return (
    <div style={{
      minHeight: "auto",
      background: "transparent",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: "#e2e8f0",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .week-tab { cursor: pointer; transition: all 0.2s; }
        .week-tab:hover { opacity: 1 !important; }
        .day-btn { cursor: pointer; transition: all 0.2s; border: none; }
        .day-btn:hover { transform: translateY(-1px); }
        .exercise-row { transition: background 0.15s; }
        .exercise-row:hover { background: rgba(255,255,255,0.04); }
        .tip-box { border-left: 3px solid; padding: 12px 16px; border-radius: 0 8px 8px 0; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "28px 24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.4)",
      }}>
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, color: "#555", fontWeight: 600, textTransform: "uppercase" }}>
              30-DAY PROGRAM
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(36px, 6vw, 52px)",
            letterSpacing: 3,
            color: "#fff",
            lineHeight: 1,
            marginBottom: 6,
          }}>MORNING CALISTHENICS</h1>
          <p style={{ fontSize: 13, color: "#666", fontWeight: 400 }}>
            30 min · No equipment · Room-only · Progressive overload
          </p>

          {/* Baseline stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {[
              { label: "Push-ups PR", val: "40" },
              { label: "Squats", val: "25 easy" },
              { label: "Plank", val: "1 min easy" },
              { label: "Frog Stand", val: "5s" },
              { label: "L-Sit", val: "1s" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                color: "#aaa",
                fontWeight: 500,
              }}>
                <span style={{ color: "#666" }}>{s.label}: </span>
                <span style={{ color: "#e2e8f0" }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "100%", margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Week selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {weeks.map((w, i) => (
            <button
              key={w.id}
              className="week-tab"
              onClick={() => { setActiveWeek(i); setActiveDay(0); }}
              style={{
                flex: 1,
                background: activeWeek === i ? w.color : "rgba(0,0,0,0.4)",
                border: `1px solid ${activeWeek === i ? w.color : "rgba(255,255,255,0.05)"}`,
                borderRadius: 8,
                padding: "10px 4px",
                cursor: "pointer",
                opacity: activeWeek === i ? 1 : 0.6,
                transition: "all 0.2s",
              }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 13,
                letterSpacing: 1.5,
                color: activeWeek === i ? "#000" : "#aaa",
                fontWeight: activeWeek === i ? 700 : 400,
              }}>WK {w.id}</div>
              <div style={{
                fontSize: 9,
                letterSpacing: 1.5,
                color: activeWeek === i ? "rgba(0,0,0,0.6)" : "#555",
                marginTop: 2,
                textTransform: "uppercase",
              }}>{w.theme}</div>
            </button>
          ))}
        </div>

        {/* Week theme */}
        <div style={{
          background: `linear-gradient(135deg, ${week.glow} 0%, transparent 60%)`,
          border: `1px solid ${week.color}30`,
          borderRadius: 10,
          padding: "14px 18px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 4, height: 40, borderRadius: 2,
            background: week.color, flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20, letterSpacing: 2, color: week.color,
            }}>WEEK {week.id}: {week.theme}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{week.sub}</div>
          </div>
        </div>

        {/* Day selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {week.days.map((d, i) => {
            const dc = dayTypeColors[d.label] || week.color;
            return (
              <button
                key={d.day}
                className="day-btn"
                onClick={() => setActiveDay(i)}
                style={{
                  background: activeDay === i ? dc : "rgba(0,0,0,0.4)",
                  border: `1px solid ${activeDay === i ? dc : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 7,
                  padding: "8px 10px",
                  cursor: "pointer",
                  minWidth: 52,
                  textAlign: "center",
                }}>
                <div style={{
                  fontSize: 10, letterSpacing: 1,
                  color: activeDay === i ? (d.isRest ? "#fff" : "#000") : "#666",
                  textTransform: "uppercase", fontWeight: 600,
                }}>D{d.day}</div>
                <div style={{
                  fontSize: 8, letterSpacing: 0.5, marginTop: 2,
                  color: activeDay === i ? (d.isRest ? "#ddd" : "rgba(0,0,0,0.6)") : "#444",
                  textTransform: "uppercase",
                }}>{d.isRest ? "REST" : d.label.split(" ")[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Day card */}
        <div style={{
          background: "rgba(0,0,0,0.2)",
          border: `1px solid ${dayColor}25`,
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {/* Day header */}
          <div style={{
            background: `linear-gradient(135deg, ${dayColor}20 0%, transparent 50%)`,
            borderBottom: `1px solid ${dayColor}20`,
            padding: "18px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
                Day {dayData.day} · {dayData.tag}
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 32, letterSpacing: 2,
                color: dayData.isRest ? "#6b7280" : dayColor,
              }}>{dayData.label}</div>
            </div>
            {!dayData.isRest && (
              <div style={{
                background: `${dayColor}15`,
                border: `1px solid ${dayColor}30`,
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 11, color: dayColor,
                letterSpacing: 1, textTransform: "uppercase", fontWeight: 600,
              }}>30 MIN</div>
            )}
          </div>

          {dayData.isRest ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛌</div>
              <div style={{ fontSize: 16, color: "#888", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
                {dayData.tip}
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 20px 20px" }}>

              {/* Tip */}
              <div className="tip-box" style={{
                borderLeftColor: dayColor,
                background: `${dayColor}08`,
                marginBottom: 18,
              }}>
                <div style={{ fontSize: 10, color: dayColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>
                  COACH NOTE
                </div>
                <div style={{ fontSize: 13, color: "#b0b0c0", lineHeight: 1.6 }}>{dayData.tip}</div>
              </div>

              {/* Warm-up */}
              <Section title="WARM-UP" color="#555" emoji="🔥">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {dayData.warmup.map((w, i) => (
                    <span key={i} style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 5,
                      padding: "4px 10px",
                      fontSize: 12, color: "#888",
                    }}>{w}</span>
                  ))}
                </div>
              </Section>

              {/* Exercises */}
              <Section title="WORKOUT" color={dayColor} emoji="⚡">
                <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
                  {dayData.work.map((ex, i) => (
                    ex.name === "Rest" ? (
                      <div key={i} style={{
                        padding: "10px 14px",
                        background: "rgba(0,0,0,0.4)",
                        borderBottom: i < dayData.work.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                        <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>— {ex.sets} —</span>
                      </div>
                    ) : (
                      <div key={i} className="exercise-row" style={{
                        padding: "13px 14px",
                        borderBottom: i < dayData.work.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: `${dayColor}15`,
                          border: `1px solid ${dayColor}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: dayColor, fontWeight: 700,
                          flexShrink: 0, marginTop: 1,
                        }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 14, color: "#ddd", fontWeight: 600 }}>{ex.name}</span>
                            <span style={{
                              fontSize: 13, color: dayColor, fontWeight: 700,
                              fontFamily: "'Bebas Neue', sans-serif",
                              letterSpacing: 1, flexShrink: 0,
                            }}>{ex.sets}</span>
                          </div>
                          {ex.note && (
                            <div style={{ fontSize: 11, color: "#555", marginTop: 3, lineHeight: 1.5 }}>{ex.note}</div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </Section>

              {/* Cool-down */}
              <Section title="COOL DOWN" color="#555" emoji="🧊">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {dayData.cooldown.map((c, i) => (
                    <span key={i} style={{
                      background: "#1c1c28",
                      border: "1px solid #2a2a3a",
                      borderRadius: 5,
                      padding: "4px 10px",
                      fontSize: 12, color: "#888",
                    }}>{c}</span>
                  ))}
                </div>
              </Section>

            </div>
          )}
        </div>

        {/* Month overview pills */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            MONTH AT A GLANCE
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {weeks.flatMap(w => w.days).map((d, i) => {
              const dc = dayTypeColors[d.label] || "#555";
              const isActive = weeks[activeWeek].days[activeDay].day === d.day;
              return (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: 5,
                  background: d.isRest ? "rgba(0,0,0,0.4)" : `${dc}25`,
                  border: `1px solid ${isActive ? dc : (d.isRest ? "rgba(255,255,255,0.05)" : `${dc}40`)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: isActive ? dc : "#444",
                  fontWeight: isActive ? 700 : 400,
                  outline: isActive ? `2px solid ${dc}` : "none",
                  outlineOffset: 1,
                }}>
                  {d.day}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "Push", color: "#f97316" },
              { label: "Legs + Core", color: "#10b981" },
              { label: "Skill", color: "#3b82f6" },
              { label: "Active", color: "#8b5cf6" },
              { label: "Rest", color: "#6b7280" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, color: "#555" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function Section({ title, color, emoji, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 12 }}>{emoji}</span>
        <span style={{
          fontSize: 10, letterSpacing: 2, fontWeight: 700,
          color: color, textTransform: "uppercase",
        }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
