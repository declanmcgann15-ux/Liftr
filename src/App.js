

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY  = "workout_tracker_data";
const WEIGHT_KEY   = "liftr_weight";
const MEASURES_KEY = "liftr_measurements";
const THEME_KEY    = "liftr_theme"; // "auto" | "dark" | "light"
const CUSTOM_EX_KEY = "liftr_custom_exercises"; // [name, ...]

const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Legs","Core","Full Body"];
const CARDIO_TYPES  = ["Run","Bike","Row","Swim","Elliptical","Stair Climber","Walk"];

const STRENGTH_MET = { light:[2.5,3.5], moderate:[3.5,5.0], hard:[5.0,6.5] };
const CARDIO_MET = {
  Run:            { light:[7.0,8.5],  moderate:[9.0,10.5],  hard:[11.0,13.0] },
  Bike:           { light:[5.5,7.0],  moderate:[7.5,9.5],   hard:[10.0,12.0] },
  Row:            { light:[4.5,6.0],  moderate:[6.5,8.0],   hard:[8.5,10.5]  },
  Swim:           { light:[5.0,6.5],  moderate:[7.0,8.5],   hard:[9.0,11.0]  },
  Elliptical:     { light:[4.5,6.0],  moderate:[6.5,8.0],   hard:[8.5,10.0]  },
  "Stair Climber":{ light:[4.0,5.5],  moderate:[6.0,7.5],   hard:[8.0,9.5]   },
  Walk:           { light:[2.5,3.5],  moderate:[3.5,4.5],   hard:[4.5,5.5]   },
};

const EXERCISE_MUSCLE_MAP = {
  "Ab Wheel":           "Core",
  "Arnold Press":       "Shoulders",
  "Barbell Curl":       "Biceps",
  "Barbell Row":        "Back",
  "Bench Press":        "Chest",
  "Burpee":             "Full Body",
  "Cable Fly":          "Chest",
  "Cable Row":          "Back",
  "Calf Raise":         "Legs",
  "Clean":              "Full Body",
  "Close Grip Bench":   "Triceps",
  "Crunch":             "Core",
  "Deadlift":           "Back",
  "Dips":               "Chest",
  "Dumbbell Curl":      "Biceps",
  "Face Pull":          "Shoulders",
  "Front Raise":        "Shoulders",
  "Hammer Curl":        "Biceps",
  "Incline Press":      "Chest",
  "Kettlebell Swing":   "Full Body",
  "Lat Pulldown":       "Back",
  "Lateral Raise":      "Shoulders",
  "Leg Curl":           "Legs",
  "Leg Extension":      "Legs",
  "Leg Press":          "Legs",
  "Leg Raise":          "Core",
  "Lunges":             "Legs",
  "Overhead Extension": "Triceps",
  "Overhead Press":     "Shoulders",
  "Plank":              "Core",
  "Preacher Curl":      "Biceps",
  "Pull-Up":            "Back",
  "Push-Up":            "Chest",
  "Romanian Deadlift":  "Legs",
  "Russian Twist":      "Core",
  "Skull Crusher":      "Triceps",
  "Snatch":             "Full Body",
  "Squat":              "Legs",
  "Thruster":           "Full Body",
  "Tricep Pushdown":    "Triceps",
};

const DEFAULT_EXERCISES = Object.keys(EXERCISE_MUSCLE_MAP).sort();



// Light mode: 6am–8pm  |  Dark mode: 8pm–6am
function shouldUseDark() {
  const h = new Date().getHours();
  return h < 6 || h >= 20;
}

// ── Theme tokens ──────────────────────────────────────────────────────────────
function buildTheme(dark) {
  const accent       = "#2563eb";
  const accentDim    = dark ? "rgba(37,99,235,0.15)"  : "rgba(37,99,235,0.1)";
  const accentBorder = dark ? "rgba(37,99,235,0.35)"  : "rgba(37,99,235,0.3)";
  const accentDark   = dark ? "rgba(37,99,235,0.08)"  : "rgba(37,99,235,0.06)";
  const accentText   = dark ? "#93c5fd" : "#1d4ed8";
  const danger       = "#ef4444";
  const dangerDim    = dark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)";
  const dangerBorder = dark ? "rgba(239,68,68,0.2)"  : "rgba(239,68,68,0.2)";
  const cardio       = dark ? "#7dd3fc" : "#38bdf8";
  const cardioDim    = dark ? "rgba(125,211,252,0.12)"  : "rgba(56,189,248,0.1)";
  const cardioText   = dark ? "#bae6fd" : "#0284c7";

  return {
    dark,
    accent, accentDim, accentBorder, accentDark, accentText,
    danger, dangerDim, dangerBorder,
    cardio, cardioDim, cardioText,

    // Backgrounds
    bg:         dark ? "#0a0a0f" : "#f5f5f0",
    bgCard:     dark ? "rgba(255,255,255,0.04)" : "#ffffff",
    bgCardBorder:dark? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    bgInput:    dark ? "rgba(255,255,255,0.05)" : "#ffffff",
    bgInputBorder:dark? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)",
    bgNav:      dark ? "rgba(10,10,15,0.96)"    : "rgba(245,245,240,0.96)",
    bgNavBorder:dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    bgModal:    dark ? "#13131a"                : "#f9f9f6",
    bgSm:       dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    bgSmBorder: dark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.12)",
    bgSecondary:dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    bgSecBorder:dark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)",
    bgGhost:    dark ? "none"                   : "none",
    bgGhostBorder:dark?"rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    divider:    dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    overlay:    dark ? "rgba(0,0,0,0.75)"       : "rgba(0,0,0,0.4)",

    // Text
    textPrimary: dark ? "#f9fafb"  : "#111827",
    textBody:    dark ? "#f3f4f6"  : "#1f2937",
    textMuted:   dark ? "#9ca3af"  : "#6b7280",
    textFaint:   dark ? "#6b7280"  : "#9ca3af",
    textVeryFaint:dark? "#4b5563"  : "#d1d5db",
    textSub:     dark ? "#4b5563"  : "#9ca3af",
    logoText:    dark ? accentText : accentText,

    // Nav
    navIconActive: accent,
    navIconInactive: dark ? "#4b5563" : "#9ca3af",
    navLabelActive: dark ? "#93c5fd" : "#1d4ed8",
    navLabelInactive: dark ? "#4b5563" : "#9ca3af",

    // Scrollbar
    scrollThumb: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcCalorieRange(type, subtype, intensity, durationMins, weightLbs) {
  if (!weightLbs || !durationMins) return null;
  const kg = parseFloat(weightLbs) * 0.453592;
  const hrs = durationMins / 60;
  const met = type === "strength"
    ? (STRENGTH_MET[intensity] || STRENGTH_MET.moderate)
    : ((CARDIO_MET[subtype] || CARDIO_MET.Run)[intensity] || CARDIO_MET.Run.moderate);
  return { low: Math.round(met[0]*kg*hrs), high: Math.round(met[1]*kg*hrs) };
}
function formatDate(iso) { return new Date(iso).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }); }
function formatShortDate(iso) { return new Date(iso).toLocaleDateString("en-US",{ month:"short", day:"numeric" }); }
function formatDuration(mins) {
  if (!mins) return "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins/60), m = mins%60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, T }) {
  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.bgCardBorder}`, borderRadius:12, padding:"16px 20px", flex:1, minWidth:0 }}>
      <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textFaint, marginBottom:6, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:T.textPrimary, fontFamily:"'DM Mono',monospace" }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textMuted, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{sub}</div>}
    </div>
  );
}

function IntensityPicker({ value, onChange, T }) {
  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:T.textFaint, marginBottom:10, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Intensity</div>
      <div style={{ display:"flex", gap:8 }}>
        {["light","moderate","hard"].map(lvl => (
          <button key={lvl} onClick={() => onChange(lvl)} style={{
            flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
            fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif", textTransform:"capitalize", transition:"all 0.15s",
            background: value===lvl ? T.accent : T.bgSm,
            color: value===lvl ? "#fff" : T.textMuted,
          }}>{lvl}</button>
        ))}
      </div>
    </div>
  );
}

// Global so RestTimerBar can read theme without prop drilling
let effectiveDarkGlobal = false;

const REST_PRESETS = [30, 60, 90, 120, 180, 240];

function RestTimerBar({ T, remaining, restDuration, done, onSkip, onRestart }) {
  if (remaining === null) return null;

  const pct = done ? 0 : remaining / restDuration;

  return (
    <div style={{
      position:"fixed", bottom:66, left:"50%", transform:"translateX(-50%)",
      width:"calc(100% - 24px)", maxWidth:456, zIndex:90,
    }}>
      <div style={{
        background: T.bgModal,
        border: `1px solid ${done ? T.dangerBorder : T.accentBorder}`,
        borderRadius:16, padding:"12px 16px",
        boxShadow: effectiveDarkGlobal ? "0 -4px 28px rgba(0,0,0,0.55)" : "0 -4px 20px rgba(0,0,0,0.13)",
        transition:"border-color 0.3s",
      }}>
        <div style={{ height:3, background:T.bgSm, borderRadius:3, marginBottom:12, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct*100}%`, background:done?T.danger:T.accent, borderRadius:3, transition:"width 1s linear, background 0.3s" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            {done ? (
              <div style={{ fontSize:15, fontWeight:700, color:T.danger, fontFamily:"'DM Sans',sans-serif" }}>Next set time! 💪</div>
            ) : (
              <div>
                <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:2 }}>Resting</div>
                <div style={{ fontSize:26, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.accent, lineHeight:1 }}>
                  {remaining >= 60
                    ? `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`
                    : `${remaining}s`}
                </div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onRestart} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${T.bgSmBorder}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background:done?T.accent:T.bgSm, color:done?"#fff":T.textMuted }}>Restart</button>
            <button onClick={onSkip}    style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${T.bgSmBorder}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background:T.bgSm, color:T.textMuted }}>Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Theme

  const [themePref, setThemePref] = useState("auto"); // "auto" | "dark" | "light"
  const [isDark, setIsDark]       = useState(shouldUseDark());

  // Resolve effective dark/light based on pref + time
  const effectiveDark = themePref === "auto" ? isDark : themePref === "dark";
  const T = buildTheme(effectiveDark);

  // Re-evaluate time-based theme every minute and on tab focus
  useEffect(() => {
    const tick = () => setIsDark(shouldUseDark());
    const interval = setInterval(tick, 60000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(interval); window.removeEventListener("focus", tick); };
  }, []);

  // Persist theme pref
  useEffect(() => { try { localStorage.setItem(THEME_KEY, themePref); } catch {} }, [themePref]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) setThemePref(saved);
    } catch {}
  }, []);

  // App state
  const [workouts, setWorkouts]         = useState([]);
  const [view, setView]                 = useState("dashboard");
  const [logStep, setLogStep]           = useState("type");
  const [workoutType, setWorkoutType]   = useState(null);
  const [elapsed, setElapsed]           = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  
  const [exercises, setExercises]           = useState([]);
  const [customExercise, setCustomExercise] = useState("");
  const [restInterval, setRestInterval]     = useState(90);
  const [restRemaining, setRestRemaining]   = useState(null);
  const [restDone, setRestDone]             = useState(false);
  const restTimerRef                        = useRef(null);

  function startRestTimer(secs) {
    clearInterval(restTimerRef.current);
    setRestDone(false);
    setRestRemaining(secs);
    restTimerRef.current = setInterval(() => {
      setRestRemaining(r => {
        if (r <= 1) {
          clearInterval(restTimerRef.current);
          setRestDone(true);
          try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch {}
          try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("LIFTR", { body:"Rest complete — time for your next set! 💪" }); } catch {}
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function skipRestTimer() {
    clearInterval(restTimerRef.current);
    setRestRemaining(null);
    setRestDone(false);
  }
  const [customExercises, setCustomExercises] = useState([]); // flat list of user-saved names
  const [exSearchQuery, setExSearchQuery]   = useState("");
  const [exDropdownOpen, setExDropdownOpen] = useState(false);
  const [exMuscleFilter, setExMuscleFilter] = useState(null); // null = all
  const searchRef = useRef(null);

  const [cardioType, setCardioType]         = useState(CARDIO_TYPES[0]);
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioDuration, setCardioDuration] = useState("");
  const [cardioNotes, setCardioNotes]       = useState("");
  const [intensity, setIntensity]           = useState("moderate");

  const [historyFilter, setHistoryFilter]     = useState("all");
  const [historyView, setHistoryView]         = useState("sessions"); // sessions | exercises | muscles
  const [historyExercise, setHistoryExercise] = useState("");
  const [historyExSearch, setHistoryExSearch] = useState("");
  const [editingWorkout, setEditingWorkout]   = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [measurements, setMeasurements]       = useState([]);
  const [measWeightDraft, setMeasWeightDraft] = useState("");
  const [measDateDraft, setMeasDateDraft]     = useState(() => new Date().toISOString().slice(0,10));
  const [measSaved, setMeasSaved]             = useState(false);
  const [measView, setMeasView]               = useState("log");

  const [manualWeight, setManualWeight] = useState("");
  const [weightDraft, setWeightDraft]   = useState("");
  const [weightSaved, setWeightSaved]   = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setWorkouts(JSON.parse(s));
      const w = localStorage.getItem(WEIGHT_KEY);
      if (w) { setManualWeight(w); setWeightDraft(w); }
      const m = localStorage.getItem(MEASURES_KEY);
      if (m) setMeasurements(JSON.parse(m));
      const cx = localStorage.getItem(CUSTOM_EX_KEY);
      if (cx) setCustomExercises(JSON.parse(cx));
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts)); } catch {} }, [workouts]);
  useEffect(() => { try { localStorage.setItem(MEASURES_KEY, JSON.stringify(measurements)); } catch {} }, [measurements]);
  useEffect(() => { try { localStorage.setItem(CUSTOM_EX_KEY, JSON.stringify(customExercises)); } catch {} }, [customExercises]);

  const effectiveWeight = measurements.length > 0
    ? String(measurements[measurements.length-1].weight)
    : manualWeight;

  useEffect(() => {
    if (logStep === "details") {
      startRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [logStep]);

  function startWorkout(type) {
    setWorkoutType(type); setElapsed(0); setExercises([]);
    setCardioType(CARDIO_TYPES[0]);
    setCardioDistance(""); setCardioDuration(""); setCardioNotes("");
    setIntensity("moderate");
    setExSearchQuery(""); setExDropdownOpen(false); setExMuscleFilter(null);
    // Request notification permission for rest timer alerts (best-effort)
    try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch {}
    setLogStep("details");
  }
  function resetLog() {
    clearInterval(timerRef.current);
    clearInterval(restTimerRef.current);
    setRestRemaining(null); setRestDone(false);
    setLogStep("type"); setView("dashboard"); setElapsed(0);
  }

  // Derive muscle groups hit from the exercise list, preserving order of first appearance
  function detectMuscleGroups(exList) {
    const seen = [];
    exList.forEach(e => {
      const g = EXERCISE_MUSCLE_MAP[e.name];
      if (g && !seen.includes(g)) seen.push(g);
    });
    return seen; // e.g. ["Chest","Triceps"]
  }

  function muscleGroupLabel(exList) {
    const groups = detectMuscleGroups(exList);
    if (groups.length === 0) return "Strength";
    if (groups.length <= 3) return groups.join(" + ");
    return groups.slice(0, 2).join(" + ") + ` +${groups.length - 2}`;
  }

  // Auto-detect intensity from exercises, sets, and rest interval
  function detectIntensity(exList, restSecs) {
    const HEAVY_COMPOUNDS = ["Squat","Deadlift","Clean","Snatch","Thruster","Barbell Row","Overhead Press","Bench Press","Romanian Deadlift","Leg Press"];
    let score = 0; // 0–10 scale → light <4, moderate 4–7, hard >7

    // 1. Heavy compound presence
    const hasCompound = exList.some(e => HEAVY_COMPOUNDS.includes(e.name));
    if (hasCompound) score += 3;

    // 2. Average sets per exercise
    const totalSets = exList.reduce((s, e) => s + e.sets.filter(st => st.weight || st.reps).length, 0);
    const avgSets = exList.length > 0 ? totalSets / exList.length : 0;
    if (avgSets >= 4) score += 2;
    else if (avgSets >= 3) score += 1;

    // 3. Rest interval — shorter rest = higher intensity
    if (restSecs <= 60)  score += 3;
    else if (restSecs <= 90)  score += 2;
    else if (restSecs <= 120) score += 1;
    // 180+ adds nothing

    // 4. Exercise variety — more muscle groups hit = fuller session
    const groups = detectMuscleGroups(exList);
    if (groups.length >= 3) score += 1;

    if (score >= 7) return "hard";
    if (score >= 4) return "moderate";
    return "light";
  }

  function addExercise(name) {
    if (exercises.some(e => e.name === name)) return;
    setExercises(p => [...p, { name, sets:[{ weight:"", reps:"" }] }]);
  }

  function saveCustomExercise(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Save if not already in defaults or customs
    const allDefaults = DEFAULT_EXERCISES.map(e => e.toLowerCase());
    if (!allDefaults.includes(trimmed.toLowerCase()) && !customExercises.map(e=>e.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomExercises(prev => [...prev, trimmed].sort());
    }
  }

  function deleteCustomExercise(name) {
    setCustomExercises(prev => prev.filter(e => e !== name));
  }

  // All exercises = defaults + customs, deduped and sorted
  const allExercises = [...new Set([...DEFAULT_EXERCISES, ...customExercises])].sort();

  // Filtered dropdown list — apply muscle group filter then text search
  const exDropdownItems = allExercises.filter(e => {
    const muscleMatch = !exMuscleFilter || (EXERCISE_MUSCLE_MAP[e] === exMuscleFilter) || customExercises.includes(e);
    const textMatch = exSearchQuery.trim() === "" || e.toLowerCase().includes(exSearchQuery.toLowerCase());
    return muscleMatch && textMatch;
  });

  function handleExerciseSelect(name) {
    addExercise(name);
    setExSearchQuery("");
    setExDropdownOpen(false);
  }

  function handleExerciseAdd() {
    const trimmed = exSearchQuery.trim();
    if (!trimmed) return;
    saveCustomExercise(trimmed);
    addExercise(trimmed);
    setExSearchQuery("");
    setExDropdownOpen(false);
  }
  function addSet(ei)           { setExercises(p => p.map((e,i) => i===ei ? { ...e, sets:[...e.sets,{ weight:"", reps:"" }] } : e)); }
  function removeSet(ei,si)     { setExercises(p => p.map((e,i) => i===ei ? { ...e, sets:e.sets.filter((_,j)=>j!==si) } : e)); }
  function updateSet(ei,si,f,v) { setExercises(p => p.map((e,i) => i===ei ? { ...e, sets:e.sets.map((s,j)=>j===si?{...s,[f]:v}:s) } : e)); }
  function removeExercise(idx)  { setExercises(p => p.filter((_,i) => i!==idx)); }

  function finishWorkout() {
    clearInterval(timerRef.current);
    const dur = Math.max(1, Math.round(elapsed/60));
    let w;
    if (workoutType === "strength") {
      const finishedExercises = exercises.map(e=>({ name:e.name, sets:e.sets.filter(s=>s.weight||s.reps) })).filter(e=>e.sets.length);
      const autoIntensity = detectIntensity(finishedExercises, restInterval);
      w = { id:Date.now(), type:"strength", date:new Date().toISOString(), duration:dur,
            muscleGroups: detectMuscleGroups(finishedExercises),
            intensity: autoIntensity,
            calories: calcCalorieRange("strength", null, autoIntensity, dur, effectiveWeight),
            exercises: finishedExercises };
    } else {
      const d = parseInt(cardioDuration)||dur;
      w = { id:Date.now(), type:"cardio", date:new Date().toISOString(), duration:d, cardioType, intensity,
            calories: calcCalorieRange("cardio", cardioType, intensity, d, effectiveWeight),
            distance: parseFloat(cardioDistance)||null, notes:cardioNotes };
    }
    setWorkouts(p => [w,...p]);
    setLogStep("complete");
  }

  function getPriorSessions(name) {
    return workouts
      .filter(w => w.type==="strength" && w.exercises?.some(e=>e.name===name))
      .slice(0,2)
      .map(w => {
        const ex = w.exercises.find(e=>e.name===name);
        const valid = ex.sets.filter(s=>parseFloat(s.weight)>0 && parseFloat(s.reps)>0);
        if (!valid.length) return null;
        return { date:w.date, setCount:valid.length,
          avgWeight: Math.round(valid.reduce((s,x)=>s+parseFloat(x.weight),0)/valid.length),
          avgReps:   Math.round(valid.reduce((s,x)=>s+parseFloat(x.reps),0)/valid.length) };
      }).filter(Boolean);
  }

  function saveEdit() { setWorkouts(p=>p.map(w=>w.id===editingWorkout.id?editingWorkout:w)); setEditingWorkout(null); }
  function updateEditSet(ei,si,f,v) { setEditingWorkout(p=>({ ...p, exercises:p.exercises.map((e,i)=>i===ei?{ ...e, sets:e.sets.map((s,j)=>j===si?{...s,[f]:v}:s) }:e) })); }
  function addEditSet(ei)           { setEditingWorkout(p=>({ ...p, exercises:p.exercises.map((e,i)=>i===ei?{ ...e, sets:[...e.sets,{ weight:"", reps:"" }] }:e) })); }
  function removeEditSet(ei,si)     { setEditingWorkout(p=>({ ...p, exercises:p.exercises.map((e,i)=>i===ei?{ ...e, sets:e.sets.filter((_,j)=>j!==si) }:e) })); }

  function saveManualWeight() {
    const val = weightDraft.trim();
    setManualWeight(val);
    try { localStorage.setItem(WEIGHT_KEY, val); } catch {}
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  }

  function addMeasurement() {
    const w = parseFloat(measWeightDraft);
    if (!w || !measDateDraft) return;
    const entry = { id:Date.now(), date:new Date(measDateDraft).toISOString(), weight:w };
    setMeasurements(p => [...p, entry].sort((a,b)=>new Date(a.date)-new Date(b.date)));
    setMeasWeightDraft("");
    setMeasSaved(true);
    setTimeout(() => setMeasSaved(false), 1800);
  }
  function deleteMeasurement(id) { setMeasurements(p=>p.filter(m=>m.id!==id)); }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const strengthWorkouts = workouts.filter(w=>w.type==="strength");
  const cardioWorkouts   = workouts.filter(w=>w.type==="cardio");
  const totalMins        = workouts.reduce((s,w)=>s+(w.duration||0),0);
  const filteredHistory  = historyFilter==="all" ? workouts : workouts.filter(w=>w.type===historyFilter);
  const timerDisplay     = `${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`;
  const now              = Date.now();

  // 7-day strip — each day gets a volume score for bar height
  // Strength: total reps across all sets  |  Cardio: duration minutes (scaled ×3 to be comparable)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const dayWorkouts = workouts.filter(w => new Date(w.date).toDateString() === dateStr);
    const strengthVol = dayWorkouts.filter(w=>w.type==="strength")
      .reduce((s,w)=>(w.exercises||[]).reduce((ss,e)=>ss+e.sets.reduce((sss,st)=>sss+(parseFloat(st.reps)||0),0),s),0);
    const cardioMins  = dayWorkouts.filter(w=>w.type==="cardio").reduce((s,w)=>s+(w.duration||0),0);
    const totalVol    = strengthVol + cardioMins * 3; // normalise cardio mins to rep-scale
    const hasStrength = dayWorkouts.some(w=>w.type==="strength");
    const hasCardio   = dayWorkouts.some(w=>w.type==="cardio");
    const sessions    = dayWorkouts.length;
    return { date:d, label:d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,1), totalVol, hasStrength, hasCardio, sessions, dayWorkouts };
  });
  const maxDayVol = Math.max(...last7Days.map(d=>d.totalVol), 1);

  // Today summary
  const todayData = last7Days[6];
  const todayMins = todayData.dayWorkouts.reduce((s,w)=>s+(w.duration||0),0);
  const todayCals = todayData.dayWorkouts.reduce((s,w)=>s+(w.calories?.low||0),0);
  const todayCalsHigh = todayData.dayWorkouts.reduce((s,w)=>s+(w.calories?.high||0),0);

  // This week vs last week
  const thisWeekSets = workouts.filter(w=>(now-new Date(w.date))/86400000<=7 && w.type==="strength")
    .reduce((s,w)=>s+(w.exercises||[]).reduce((ss,e)=>ss+e.sets.length,0),0);
  const lastWeekSets = workouts.filter(w=>{ const d=(now-new Date(w.date))/86400000; return d>7&&d<=14&&w.type==="strength"; })
    .reduce((s,w)=>s+(w.exercises||[]).reduce((ss,e)=>ss+e.sets.length,0),0);
  const volumeChange = lastWeekSets > 0 ? Math.round(((thisWeekSets-lastWeekSets)/lastWeekSets)*100) : null;

  const thisWeekMins = workouts.filter(w=>(now-new Date(w.date))/86400000<=7).reduce((s,w)=>s+(w.duration||0),0);
  const thisWeekSessions = workouts.filter(w=>(now-new Date(w.date))/86400000<=7).length;

  // Personal records — within last 7 days
  const recentPRs = (() => {
    const prs = [];
    const allExNames = [...new Set(strengthWorkouts.flatMap(w=>(w.exercises||[]).map(e=>e.name)))];
    allExNames.forEach(name => {
      const sessions = strengthWorkouts.filter(w=>w.exercises?.some(e=>e.name===name)).sort((a,b)=>new Date(b.date)-new Date(a.date));
      if (sessions.length < 2) return;
      const latest = sessions[0];
      const latestEx = latest.exercises.find(e=>e.name===name);
      const latestMax = Math.max(...latestEx.sets.map(s=>parseFloat(s.weight)||0));
      const prevMax = Math.max(...sessions.slice(1).flatMap(w=>w.exercises.find(e=>e.name===name)?.sets.map(s=>parseFloat(s.weight)||0)||[0]));
      const daysAgo = (now-new Date(latest.date))/86400000;
      if (latestMax > prevMax && daysAgo <= 7 && latestMax > 0) prs.push({ name, weight:latestMax });
    });
    return prs.slice(0,3);
  })();

  // Status line — no streak, activity-focused
  const statusLine = (() => {
    if (!workouts.length) return { text:"Log your first workout to get started", emoji:"👟" };
    const daysAgo = (now-new Date(workouts[0].date))/86400000;
    if (todayData.sessions >= 2) return { text:`${todayData.sessions} sessions today — serious work`, emoji:"⚡" };
    if (todayData.sessions === 1) return { text:"One session in — ready for more?", emoji:"💪" };
    if (daysAgo < 2) return { text:"Yesterday's work is paying off", emoji:"🏆" };
    if (daysAgo < 4) return { text:"Ready to train? Let's go", emoji:"🎯" };
    return { text:"Time to get back at it", emoji:"💡" };
  })();

  // Mini sparkline for body weight
  const recentMeasurements = measurements.slice(-8);
  const sparkMin   = recentMeasurements.length ? Math.min(...recentMeasurements.map(m=>m.weight)) : 0;
  const sparkMax   = recentMeasurements.length ? Math.max(...recentMeasurements.map(m=>m.weight)) : 0;
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkW=80, sparkH=28;
  const sparkPts = recentMeasurements.map((m,i)=>({
    x: recentMeasurements.length===1 ? sparkW/2 : (i/(recentMeasurements.length-1))*sparkW,
    y: sparkH - ((m.weight-sparkMin)/sparkRange)*(sparkH-4) - 2,
  }));
  const sparkPath = sparkPts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");

  // Measurements chart
  const measMin   = measurements.length ? Math.min(...measurements.map(m=>m.weight)) : 0;
  const measMax   = measurements.length ? Math.max(...measurements.map(m=>m.weight)) : 0;
  const measRange = measMax - measMin || 1;
  const measW=300, measH=120;
  const measPts = measurements.map((m,i) => ({
    x: measurements.length===1 ? measW/2 : (i/(measurements.length-1))*measW,
    y: measH - ((m.weight-measMin)/measRange)*(measH-20) - 10, ...m,
  }));
  const measPath = measPts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");

  const navItems = [
    { id:"dashboard", icon:"⬡", label:"Home"    },
    { id:"log",       icon:"＋", label:"Log"     },
    { id:"history",   icon:"≡",  label:"History" },
    { id:"body",      icon:"◉",  label:"Body"    },
    { id:"settings",  icon:"◎",  label:"Settings"},
  ];

  // Style helpers
  const btn = (v) => {
    const base = { border:"none", cursor:"pointer", fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" };
    if (v==="sm")        return { ...base, padding:"8px 14px",  borderRadius:20, fontSize:13, background:T.bgSm,        color:T.textBody,    border:`1px solid ${T.bgSmBorder}` };
    if (v==="secondary") return { ...base, padding:"13px 24px", borderRadius:10, fontSize:15, background:T.bgSecondary, color:T.textBody,    border:`1px solid ${T.bgSecBorder}` };
    if (v==="danger")    return { ...base, padding:"8px 12px",  borderRadius:8,  fontSize:13, background:T.dangerDim,   color:T.danger,      border:`1px solid ${T.dangerBorder}` };
    if (v==="ghost")     return { ...base, padding:"7px 12px",  borderRadius:8,  fontSize:12, background:T.bgGhost,     color:T.textFaint,   border:`1px solid ${T.bgGhostBorder}` };
    return { ...base, padding:"13px 24px", borderRadius:10, fontSize:15, background:T.accent, color:"#fff" };
  };

  const card  = { background:T.bgCard, border:`1px solid ${T.bgCardBorder}`, borderRadius:14, padding:16, marginBottom:12 };
  const input = { background:T.bgInput, border:`1px solid ${T.bgInputBorder}`, borderRadius:8, padding:"10px 14px", color:T.textBody, fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", boxSizing:"border-box", outline:"none" };
  const sel   = { ...input, cursor:"pointer" };
  const lbl   = { fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:T.textFaint, marginBottom:10, fontWeight:600, fontFamily:"'DM Sans',sans-serif" };
  const div_  = { height:1, background:T.divider, margin:"12px 0" };
  const tag   = (type) => ({ display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", background:type==="strength"?T.accentDim:T.cardioDim, color:type==="strength"?T.accentText:T.cardioText });
  const calBadge = { display:"inline-flex", alignItems:"center", gap:5, background:T.accentDark, border:`1px solid ${T.accentBorder}`, borderRadius:8, padding:"4px 10px", marginTop:8 };

  const titles = { dashboard:"Overview", log:"Log Workout", history:"History", body:"Body", settings:"Settings" };

  const themeLabel = themePref === "auto"
    ? `Auto (${effectiveDark ? "Dark" : "Light"} — switches at ${effectiveDark ? "6am" : "8pm"})`
    : themePref === "dark" ? "Dark" : "Light";

  // Keep global theme flag in sync for RestTimerBar
  effectiveDarkGlobal = effectiveDark;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.textBody, fontFamily:"'Playfair Display','Georgia',serif", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", transition:"background 0.4s, color 0.4s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        select option { background:${effectiveDark?"#1a1a2e":"#fff"}; color:${T.textBody}; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${T.scrollThumb}; border-radius:4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${effectiveDark?"invert(0.5)":"invert(0.3)"}; }
        input::placeholder, textarea::placeholder { color:${T.textVeryFaint}; }
        input:focus, select:focus, textarea:focus { border-color:rgba(37,99,235,0.6) !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding:"24px 20px 14px", borderBottom:`1px solid ${T.divider}` }}>
        <div style={{ fontSize:12, letterSpacing:"0.3em", textTransform:"uppercase", color:T.accentText, fontWeight:400, fontFamily:"'DM Sans',sans-serif" }}>LIFTR</div>
        <div style={{ fontSize:26, fontWeight:700, marginTop:4, color:T.textPrimary, letterSpacing:"-0.01em" }}>{titles[view]}</div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:20, paddingBottom:80, overflowY:"auto" }}>

        {/* ── DASHBOARD ── */}
        {view==="dashboard" && (
          <div>

            {/* Hero — today summary + status */}
            <div style={{ ...card, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:T.textMuted, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>
                    {statusLine.emoji} {statusLine.text}
                  </div>
                  {todayData.sessions > 0 ? (
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary, lineHeight:1 }}>{todayData.sessions}</div>
                        <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>sessions</div>
                      </div>
                      <div>
                        <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary, lineHeight:1 }}>{formatDuration(todayMins)}</div>
                        <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>today</div>
                      </div>
                      {todayCals > 0 && (
                        <div>
                          <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary, lineHeight:1 }}>{todayCals}–{todayCalsHigh}</div>
                          <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>kcal</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>
                      {workouts.length > 0 ? `${thisWeekSessions} sessions this week · ${formatDuration(thisWeekMins)}` : "No sessions logged yet"}
                    </div>
                  )}
                </div>
                <button style={{ ...btn("primary"), padding:"10px 16px", fontSize:13, borderRadius:12, flexShrink:0, marginLeft:12 }}
                  onClick={()=>{ setView("log"); }}>
                  + Log
                </button>
              </div>
            </div>

            {/* 7-day volume bar strip */}
            <div style={{ ...card, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
                <div style={lbl}>7-Day Activity</div>
                <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginRight:10 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:T.accent, display:"inline-block" }} /> Strength
                  </span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:T.cardio, display:"inline-block" }} /> Cardio
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:72 }}>
                {last7Days.map((d,i)=>{
                  const isToday = i===6;
                  const barHeight = d.totalVol > 0 ? Math.max(6, Math.round((d.totalVol/maxDayVol)*56)) : 0;
                  const barColor = d.hasStrength && d.hasCardio
                    ? T.accent
                    : d.hasStrength ? T.accent
                    : d.hasCardio ? T.cardio
                    : T.bgSm;
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, height:"100%", justifyContent:"flex-end" }}>
                      <div style={{
                        width:"60%", margin:"0 auto",
                        height: d.totalVol > 0 ? barHeight : 3,
                        borderRadius:4,
                        overflow:"hidden",
                        opacity: d.totalVol > 0 ? 1 : 0.2,
                        display:"flex", flexDirection:"column",
                      }}>
                        {d.hasStrength && <div style={{ flex: d.hasCardio ? 1 : "none", height: d.hasCardio ? undefined : "100%", background: T.accent }} />}
                        {d.hasCardio   && <div style={{ flex: d.hasStrength ? 1 : "none", height: d.hasStrength ? undefined : "100%", background: T.cardio }} />}
                        {!d.hasStrength && !d.hasCardio && <div style={{ flex:1, background: T.bgSm }} />}
                      </div>
                      <div style={{ fontSize:10, fontFamily:"'DM Sans',sans-serif", fontWeight:isToday?700:400, color:isToday?T.accentText:T.textFaint }}>{d.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* This week stats row */}
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <div style={{ ...card, flex:1, marginBottom:0 }}>
                <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:6 }}>Sets This Week</div>
                <div style={{ fontSize:24, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary, lineHeight:1, marginBottom:4 }}>{thisWeekSets}</div>
                {volumeChange !== null && (
                  <div style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color:volumeChange>0?T.accent:volumeChange<0?T.danger:T.textFaint, fontWeight:600 }}>
                    {volumeChange>0?`↑ ${volumeChange}%`:volumeChange<0?`↓ ${Math.abs(volumeChange)}%`:"→ same"} vs last week
                  </div>
                )}
              </div>
              <div style={{ ...card, flex:1, marginBottom:0 }}>
                <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:6 }}>Time This Week</div>
                <div style={{ fontSize:24, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary, lineHeight:1, marginBottom:4 }}>{formatDuration(thisWeekMins)}</div>
                <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>{thisWeekSessions} session{thisWeekSessions!==1?"s":""}</div>
              </div>
            </div>

            {/* PRs */}
            {recentPRs.length > 0 && (
              <div style={{ ...card, marginBottom:16, background:effectiveDark?"rgba(79,142,247,0.06)":"rgba(79,142,247,0.04)", border:`1px solid ${T.accentBorder}` }}>
                <div style={{ ...lbl, marginBottom:10 }}>New PRs This Week 🏆</div>
                {recentPRs.map((pr,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:i<recentPRs.length-1?10:0, marginBottom:i<recentPRs.length-1?10:0, borderBottom:i<recentPRs.length-1?`1px solid ${T.divider}`:"none" }}>
                    <div style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:T.textBody, fontWeight:500 }}>{pr.name}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:15, color:T.accent }}>{pr.weight} lbs</div>
                  </div>
                ))}
              </div>
            )}

            {/* Today's sessions */}
            {todayData.sessions > 0 && (
              <div style={{ marginBottom:4 }}>
                <div style={{ ...lbl, marginBottom:10 }}>Today's Sessions</div>
                {todayData.dayWorkouts.map(w=>(
                  <div key={w.id} style={card}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:15, color:T.textPrimary, marginBottom:3 }}>
                          {w.type==="strength"?(w.muscleGroups?.length?w.muscleGroups.join(" + "):"Strength"):w.cardioType}
                        </div>
                        <div style={{ fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>{formatDuration(w.duration)}</div>
                      </div>
                      <span style={tag(w.type)}>{w.type}</span>
                    </div>
                    {w.type==="strength" && w.exercises?.length>0 && (
                      <div style={{ fontSize:12, color:T.textMuted, fontFamily:"'DM Sans',sans-serif", marginTop:6 }}>{w.exercises.map(e=>e.name).join(" · ")}</div>
                    )}
                    {w.type==="cardio" && w.distance && <div style={{ fontSize:12, color:T.textMuted, fontFamily:"'DM Sans',sans-serif", marginTop:6 }}>{w.distance} mi</div>}
                    {w.calories && <div style={calBadge}><span>🔥</span><span style={{ fontFamily:"'DM Mono',monospace", fontWeight:600, fontSize:12, color:T.textPrimary }}>{w.calories.low}–{w.calories.high}</span><span style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>kcal</span></div>}
                  </div>
                ))}
              </div>
            )}

            {/* Last workout (if nothing today) */}
            {todayData.sessions === 0 && workouts.length > 0 && (() => {
              const w = workouts[0];
              const daysAgo = Math.floor((now-new Date(w.date))/86400000);
              const daysLabel = daysAgo===1?"Yesterday":`${daysAgo} days ago`;
              return (
                <div>
                  <div style={{ ...lbl, marginBottom:10 }}>Last Session</div>
                  <div style={card}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:15, color:T.textPrimary, marginBottom:3 }}>
                          {w.type==="strength"?(w.muscleGroups?.length?w.muscleGroups.join(" + "):"Strength"):w.cardioType}
                        </div>
                        <div style={{ fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>{daysLabel} · {formatDuration(w.duration)}</div>
                      </div>
                      <span style={tag(w.type)}>{w.type}</span>
                    </div>
                    {w.type==="strength" && w.exercises?.length>0 && <div style={{ fontSize:12, color:T.textMuted, fontFamily:"'DM Sans',sans-serif" }}>{w.exercises.map(e=>e.name).join(" · ")}</div>}
                    {w.calories && <div style={calBadge}><span>🔥</span><span style={{ fontFamily:"'DM Mono',monospace", fontWeight:600, fontSize:12, color:T.textPrimary }}>{w.calories.low}–{w.calories.high}</span><span style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>kcal</span></div>}
                  </div>
                </div>
              );
            })()}

            {/* Body weight sparkline */}
            {recentMeasurements.length >= 2 && (
              <div style={{ ...card, marginTop:4 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:4 }}>Body Weight</div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary }}>{recentMeasurements[recentMeasurements.length-1].weight} <span style={{ fontSize:13, color:T.textFaint, fontWeight:400 }}>lbs</span></div>
                    {(()=>{ const diff=(recentMeasurements[recentMeasurements.length-1].weight-recentMeasurements[0].weight).toFixed(1); const sign=diff>0?"+":""; const col=diff<0?T.accent:diff>0?T.danger:T.textFaint; return <div style={{ fontSize:12, color:col, fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginTop:2 }}>{sign}{diff} lbs</div>; })()}
                  </div>
                  <svg width={sparkW} height={sparkH} style={{ overflow:"visible" }}>
                    <defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity="0.3"/><stop offset="100%" stopColor={T.accent} stopOpacity="0"/></linearGradient></defs>
                    <path d={`${sparkPath} L ${sparkPts[sparkPts.length-1].x} ${sparkH} L ${sparkPts[0].x} ${sparkH} Z`} fill="url(#sparkGrad)" />
                    <path d={sparkPath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinejoin="round" />
                    <circle cx={sparkPts[sparkPts.length-1].x} cy={sparkPts[sparkPts.length-1].y} r="3" fill={T.accent} />
                  </svg>
                </div>
              </div>
            )}

            {workouts.length===0 && (
              <div style={{ textAlign:"center", padding:"32px 0 0", color:T.textFaint, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                Log your first session to see your stats here.
              </div>
            )}

          </div>
        )}

        {/* ── LOG ── */}
        {view==="log" && (
          <div>
            {logStep==="type" && (
              <div>
                <div style={lbl}>Choose Type</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[["🏋️","Strength Training","Track sets, reps & weight","strength"],["🏃","Cardio","Run, bike, row & more","cardio"]].map(([icon,title,sub,type])=>(
                    <button key={type} style={{ ...btn("secondary"), padding:20, borderRadius:14, display:"flex", alignItems:"center", gap:16, textAlign:"left" }} onClick={()=>startWorkout(type)}>
                      <span style={{ fontSize:32 }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:17, fontFamily:"'Playfair Display',serif", color:T.textPrimary }}>{title}</div>
                        <div style={{ fontSize:12, color:T.textFaint, marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {logStep==="details" && workoutType==="strength" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, background:T.accentDark, border:`1px solid ${T.accentBorder}`, borderRadius:12, padding:"12px 16px" }}>
                  <div style={{ fontSize:12, color:T.accentText, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Active</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {exercises.length > 0 && (
                      <div style={{ fontSize:12, color:T.accentText, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                        {muscleGroupLabel(exercises)}
                      </div>
                    )}
                    <div style={{ fontSize:22, fontFamily:"'DM Mono',monospace", color:T.accent, fontWeight:500 }}>{timerDisplay}</div>
                  </div>
                </div>



                <div style={{ marginBottom:16 }}>
                  <div style={lbl}>Add Exercise</div>

                  {/* Muscle group filter chips */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    <button
                      onClick={()=>setExMuscleFilter(null)}
                      style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                        background: exMuscleFilter===null ? T.accent : T.bgSm,
                        color: exMuscleFilter===null ? "#fff" : T.textMuted,
                      }}>All</button>
                    {MUSCLE_GROUPS.map(g => (
                      <button key={g}
                        onClick={()=>setExMuscleFilter(exMuscleFilter===g ? null : g)}
                        style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                          background: exMuscleFilter===g ? T.accent : T.bgSm,
                          color: exMuscleFilter===g ? "#fff" : T.textMuted,
                        }}>{g}</button>
                    ))}
                  </div>

                  <div style={{ position:"relative" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <input
                        ref={searchRef}
                        style={{ ...input, flex:1 }}
                        placeholder={exMuscleFilter ? `Search ${exMuscleFilter} exercises…` : "Search or add exercise…"}
                        value={exSearchQuery}
                        onChange={e=>{ setExSearchQuery(e.target.value); setExDropdownOpen(true); }}
                        onFocus={()=>setExDropdownOpen(true)}
                        onKeyDown={e=>{
                          if (e.key==="Enter") {
                            if (exDropdownItems.length===1) handleExerciseSelect(exDropdownItems[0]);
                            else if (exDropdownItems.length===0) handleExerciseAdd();
                            else handleExerciseAdd();
                          }
                          if (e.key==="Escape") setExDropdownOpen(false);
                        }}
                      />
                      <button style={btn("primary")} onClick={handleExerciseAdd}>Add</button>
                    </div>

                    {/* Dropdown */}
                    {exDropdownOpen && (
                      <div style={{
                        position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
                        background:T.bgModal, border:`1px solid ${T.bgCardBorder}`,
                        borderRadius:12, zIndex:50, maxHeight:220, overflowY:"auto",
                        boxShadow: effectiveDark
                          ? "0 8px 32px rgba(0,0,0,0.5)"
                          : "0 8px 24px rgba(0,0,0,0.12)",
                      }}>
                        {exDropdownItems.length === 0 ? (
                          <div style={{ padding:"12px 16px", fontSize:13, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>
                            No match — press Add or Enter to save "<strong style={{ color:T.textBody }}>{exSearchQuery}</strong>"
                          </div>
                        ) : (
                          exDropdownItems.map((ex, i) => {
                            const isCustom = customExercises.includes(ex);
                            const alreadyAdded = exercises.some(e=>e.name===ex);
                            const muscleLabel = EXERCISE_MUSCLE_MAP[ex];
                            return (
                              <div key={ex} onClick={()=>!alreadyAdded && handleExerciseSelect(ex)} style={{
                                display:"flex", alignItems:"center", justifyContent:"space-between",
                                padding:"11px 16px", cursor:alreadyAdded?"default":"pointer",
                                borderBottom: i < exDropdownItems.length-1 ? `1px solid ${T.divider}` : "none",
                                background: alreadyAdded ? (effectiveDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)") : "transparent",
                              }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                                  <span style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color: alreadyAdded ? T.textFaint : T.textBody }}>{ex}</span>
                                  {isCustom && <span style={{ fontSize:10, background:T.accentDim, color:T.accentText, borderRadius:10, padding:"1px 7px", fontFamily:"'DM Sans',sans-serif", fontWeight:600, flexShrink:0 }}>custom</span>}
                                  {alreadyAdded && <span style={{ fontSize:10, color:T.textFaint, fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>added</span>}
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                                  {muscleLabel && !exMuscleFilter && (
                                    <span style={{ fontSize:10, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>{muscleLabel}</span>
                                  )}
                                  {isCustom && !alreadyAdded && (
                                    <button onClick={e=>{ e.stopPropagation(); deleteCustomExercise(ex); }} style={{ background:"none", border:"none", color:T.textFaint, cursor:"pointer", fontSize:14, padding:"0 4px", lineHeight:1 }}>×</button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dismiss dropdown on outside click */}
                  {exDropdownOpen && (
                    <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={()=>setExDropdownOpen(false)} />
                  )}
                </div>

                {exercises.map((ex,ei)=>{
                  const prior = getPriorSessions(ex.name);
                  return (
                    <div key={ei} style={{ ...card, marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:prior.length?10:12 }}>
                        <div style={{ fontWeight:600, fontSize:16, color:T.textPrimary }}>{ex.name}</div>
                        <button style={btn("danger")} onClick={()=>removeExercise(ei)}>Remove</button>
                      </div>
                      {prior.length>0 && (
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, color:T.textFaint, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}>Previous Sessions</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {prior.map((p,pi)=>(
                              <div key={pi} style={{ background:pi===0?T.accentDark:T.bgSm, border:`1px solid ${pi===0?T.accentBorder:T.bgSmBorder}`, borderRadius:10, padding:"10px 12px" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                                  <span style={{ fontSize:11, fontWeight:700, color:pi===0?T.accentText:T.textFaint, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'DM Sans',sans-serif" }}>{pi===0?"Last Session":"2 Sessions Ago"}</span>
                                  <span style={{ fontSize:11, color:T.textVeryFaint, fontFamily:"'DM Sans',sans-serif" }}>{formatDate(p.date)}</span>
                                </div>
                                <div style={{ background:effectiveDark?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.05)", borderRadius:6, padding:"4px 12px", fontFamily:"'DM Mono',monospace", fontSize:13, display:"inline-block" }}>
                                  <span style={{ color:T.textMuted }}>{p.setCount} sets · </span>
                                  <span style={{ color:T.textPrimary, fontWeight:600 }}>{p.avgWeight}</span>
                                  <span style={{ color:T.textFaint, fontSize:11 }}> lbs</span>
                                  <span style={{ color:T.textFaint, margin:"0 4px" }}>×</span>
                                  <span style={{ color:T.textPrimary, fontWeight:600 }}>{p.avgReps}</span>
                                  <span style={{ color:T.textFaint, fontSize:11 }}> reps</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={div_} />
                        </div>
                      )}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 32px", gap:8, marginBottom:8 }}>
                        <div style={{ fontSize:11, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Sans',sans-serif" }}>Weight (lbs)</div>
                        <div style={{ fontSize:11, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Sans',sans-serif" }}>Reps</div>
                        <div />
                      </div>
                      {ex.sets.map((set,si)=>(
                        <div key={si} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 32px", gap:8, marginBottom:8 }}>
                          <input style={input} type="number" placeholder="135" value={set.weight} onChange={e=>updateSet(ei,si,"weight",e.target.value)} />
                          <input style={input} type="number" placeholder="8"   value={set.reps}
                            onChange={e=>updateSet(ei,si,"reps",e.target.value)}
                            onBlur={e=>{ if(e.target.value) startRestTimer(restInterval); }}
                          />
                          <button style={{ background:T.dangerDim, border:"none", borderRadius:6, color:T.danger, cursor:"pointer", fontSize:14 }} onClick={()=>removeSet(ei,si)}>×</button>
                        </div>
                      ))}
                      <button style={{ ...btn("sm"), marginTop:4, width:"100%", textAlign:"center" }} onClick={()=>addSet(ei)}>+ Set</button>
                    </div>
                  );
                })}

                {/* Rest interval setting */}
                {exercises.length>0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:T.textFaint, marginBottom:10, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                      Rest Interval — auto-starts after each set
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {REST_PRESETS.map(s=>(
                        <button key={s} onClick={()=>setRestInterval(s)} style={{
                          padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer",
                          fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                          background: restInterval===s ? T.accent : T.bgSm,
                          color: restInterval===s ? "#fff" : T.textMuted,
                        }}>{s < 60 ? `${s}s` : `${s/60}m`}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", gap:10, marginTop:20 }}>
                  <button style={{ ...btn("secondary"), flex:1 }} onClick={resetLog}>Cancel</button>
                  <button style={{ ...btn("primary"), flex:2, opacity:exercises.length===0?0.4:1 }} onClick={finishWorkout} disabled={exercises.length===0}>Finish Workout</button>
                </div>
              </div>
            )}

            {logStep==="details" && workoutType==="cardio" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, background:T.cardioDim, border:`1px solid ${T.cardio}40`, borderRadius:12, padding:"12px 16px" }}>
                  <div style={{ fontSize:12, color:T.cardioText, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Active</div>
                  <div style={{ fontSize:22, fontFamily:"'DM Mono',monospace", color:T.cardio, fontWeight:500 }}>{timerDisplay}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div><div style={lbl}>Activity</div>
                    <select style={sel} value={cardioType} onChange={e=>setCardioType(e.target.value)}>
                      {CARDIO_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div><div style={lbl}>Distance (mi)</div><input style={input} type="number" step="0.1" placeholder="3.1" value={cardioDistance} onChange={e=>setCardioDistance(e.target.value)} /></div>
                    <div><div style={lbl}>Duration (min)</div><input style={input} type="number" placeholder="30" value={cardioDuration} onChange={e=>setCardioDuration(e.target.value)} /></div>
                  </div>
                  <div><div style={lbl}>Notes</div><textarea style={{ ...input, resize:"vertical", minHeight:72 }} placeholder="Avg pace, route, how it felt..." value={cardioNotes} onChange={e=>setCardioNotes(e.target.value)} /></div>
                  <IntensityPicker T={T} value={intensity} onChange={setIntensity} />
                </div>
                <div style={{ display:"flex", gap:10, marginTop:20 }}>
                  <button style={{ ...btn("secondary"), flex:1 }} onClick={resetLog}>Cancel</button>
                  <button style={{ ...btn("primary"), flex:2 }} onClick={finishWorkout}>Finish Workout</button>
                </div>
              </div>
            )}

            {logStep==="complete" && (()=>{
              const last = workouts[0];
              const cal  = last?.calories;
              return (
                <div style={{ textAlign:"center", padding:"48px 0" }}>
                  <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
                  <div style={{ fontSize:26, fontWeight:700, marginBottom:16, color:T.textPrimary }}>Workout Saved!</div>
                  {cal ? (
                    <div style={{ display:"inline-block", background:T.accentDark, border:`1px solid ${T.accentBorder}`, borderRadius:14, padding:"14px 32px", marginBottom:28 }}>
                      <div style={{ fontSize:11, color:T.accentText, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Est. Calories Burned</div>
                      <div style={{ fontSize:34, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary }}>{cal.low}–{cal.high}</div>
                      <div style={{ fontSize:12, color:T.textFaint, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>
                        kcal · {last.intensity} intensity {last.type==="strength" && <span style={{ color:T.textVeryFaint }}>· auto-detected</span>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color:T.textFaint, fontSize:13, marginBottom:28, fontFamily:"'DM Sans',sans-serif" }}>
                      Log your body weight in the{" "}
                      <span style={{ color:T.accentText, cursor:"pointer" }} onClick={()=>{ resetLog(); setView("body"); }}>Body tab</span>
                      {" "}to see calorie estimates.
                    </div>
                  )}
                  <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                    <button style={btn("secondary")} onClick={()=>{ setLogStep("type"); setView("history"); }}>View History</button>
                    <button style={btn("primary")} onClick={resetLog}>Done</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── HISTORY ── */}
        {view==="history" && (
          <div>
            {/* View toggle */}
            <div style={{ display:"flex", gap:6, marginBottom:20, background:T.bgSm, borderRadius:12, padding:4 }}>
              {[["sessions","Sessions"],["exercises","Exercises"],["muscles","Muscles"]].map(([id,label])=>(
                <button key={id} onClick={()=>setHistoryView(id)} style={{
                  flex:1, padding:"8px 0", borderRadius:9, border:"none", cursor:"pointer",
                  fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                  background: historyView===id ? T.bgCard : "transparent",
                  color: historyView===id ? T.textPrimary : T.textFaint,
                  boxShadow: historyView===id ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}>{label}</button>
              ))}
            </div>

            {/* ── SESSIONS VIEW ── */}
            {historyView==="sessions" && (()=>{
              // Group by week
              const getWeekKey = (iso) => {
                const d = new Date(iso);
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay());
                return startOfWeek.toDateString();
              };
              const weeks = {};
              workouts.forEach(w => {
                const k = getWeekKey(w.date);
                if (!weeks[k]) weeks[k] = { key:k, date: new Date(k), workouts:[] };
                weeks[k].workouts.push(w);
              });
              const weekList = Object.values(weeks).sort((a,b)=>b.date-a.date);

              // Type filter chips
              const filtered = (list) => historyFilter==="all" ? list : list.filter(w=>w.type===historyFilter);

              return (
                <div>
                  <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                    {["all","strength","cardio"].map(f=>(
                      <button key={f} style={{ ...btn("sm"), background:historyFilter===f?T.accent:T.bgSm, color:historyFilter===f?"#fff":T.textBody, border:historyFilter===f?"none":`1px solid ${T.bgSmBorder}`, textTransform:"capitalize" }}
                        onClick={()=>setHistoryFilter(f)}>{f}</button>
                    ))}
                  </div>

                  {weekList.length===0 && <div style={{ color:T.textFaint, fontSize:14, textAlign:"center", padding:"40px 0", fontFamily:"'DM Sans',sans-serif" }}>No sessions logged yet.</div>}

                  {weekList.map(week=>{
                    const weekWorkouts = filtered(week.workouts);
                    if (!weekWorkouts.length) return null;
                    const weekMins = weekWorkouts.reduce((s,w)=>s+(w.duration||0),0);
                    const weekSessions = weekWorkouts.length;
                    const muscleSet = [...new Set(weekWorkouts.flatMap(w=>w.muscleGroups||[]))];
                    const weekStart = week.date;
                    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
                    const isThisWeek = (now - weekStart) / 86400000 <= 7;

                    return (
                      <div key={week.key} style={{ marginBottom:24 }}>
                        {/* Week header */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.textPrimary, fontFamily:"'DM Sans',sans-serif" }}>
                              {isThisWeek ? "This Week" : `${formatShortDate(weekStart.toISOString())} – ${formatShortDate(weekEnd.toISOString())}`}
                            </div>
                            <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>
                              {weekSessions} session{weekSessions!==1?"s":""} · {formatDuration(weekMins)}
                              {muscleSet.length>0 && ` · ${muscleSet.slice(0,3).join(", ")}`}
                            </div>
                          </div>
                          {isThisWeek && <span style={{ fontSize:10, background:T.accentDim, color:T.accentText, borderRadius:10, padding:"2px 8px", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Current</span>}
                        </div>

                        {weekWorkouts.map(w=>(
                          <div key={w.id} style={card}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                              <div>
                                <div style={{ fontWeight:600, fontSize:15, color:T.textPrimary }}>{w.type==="strength"?(w.muscleGroups?.length?w.muscleGroups.join(" + "):"Strength"):w.cardioType}</div>
                                <div style={{ fontSize:12, color:T.textFaint, marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{formatDate(w.date)} · {formatDuration(w.duration)}</div>
                              </div>
                              <span style={tag(w.type)}>{w.type}</span>
                            </div>
                            {w.type==="strength" && w.exercises?.map((ex,i)=>(
                              <div key={i} style={{ marginTop:8, paddingTop:8, borderTop:i===0?`1px solid ${T.divider}`:"none" }}>
                                <div style={{ fontSize:13, fontWeight:600, color:T.textBody, marginBottom:3 }}>{ex.name}</div>
                                <div style={{ fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>{ex.sets.map(s=>`${s.weight?s.weight+" lbs":"BW"} × ${s.reps||"—"}`).join("  ·  ")}</div>
                              </div>
                            ))}
                            {w.type==="cardio" && (
                              <div style={{ fontSize:13, color:T.textMuted, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>
                                {w.distance?`${w.distance} mi · `:""}{formatDuration(w.duration)}
                                {w.distance && w.duration ? ` · ${(w.duration/w.distance).toFixed(1)} min/mi` : ""}
                                {w.notes && <div style={{ marginTop:4, fontSize:12, color:T.textFaint }}>{w.notes}</div>}
                              </div>
                            )}
                            {w.calories && <div style={calBadge}><span>🔥</span><span style={{ fontFamily:"'DM Mono',monospace", fontWeight:600, fontSize:13, color:T.textPrimary }}>{w.calories.low}–{w.calories.high}</span><span style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>kcal</span></div>}
                            <div style={div_} />
                            <div style={{ display:"flex", gap:8 }}>
                              <button style={{ ...btn("sm"), flex:1 }} onClick={()=>setEditingWorkout(JSON.parse(JSON.stringify(w)))}>Edit</button>
                              {deleteConfirmId===w.id ? (
                                <>
                                  <button style={{ ...btn("danger"), flex:1 }} onClick={()=>{ setWorkouts(p=>p.filter(x=>x.id!==w.id)); setDeleteConfirmId(null); }}>Confirm Delete</button>
                                  <button style={{ ...btn("secondary"), padding:"8px 12px", fontSize:13 }} onClick={()=>setDeleteConfirmId(null)}>Cancel</button>
                                </>
                              ) : (
                                <button style={{ ...btn("danger"), flex:1 }} onClick={()=>setDeleteConfirmId(w.id)}>Delete</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── EXERCISES VIEW ── */}
            {historyView==="exercises" && (()=>{
              const allExNames = [...new Set(strengthWorkouts.flatMap(w=>(w.exercises||[]).map(e=>e.name)))].sort();
              const filtered = historyExSearch ? allExNames.filter(n=>n.toLowerCase().includes(historyExSearch.toLowerCase())) : allExNames;

              // Build chart data for selected exercise
              const exHistory = historyExercise ? strengthWorkouts
                .filter(w=>w.exercises?.some(e=>e.name===historyExercise))
                .map(w=>{
                  const ex = w.exercises.find(e=>e.name===historyExercise);
                  const valid = ex.sets.filter(s=>parseFloat(s.weight)>0);
                  const maxW = valid.length ? Math.max(...valid.map(s=>parseFloat(s.weight))) : 0;
                  const avgR = valid.length ? Math.round(valid.reduce((s,x)=>s+parseFloat(x.reps||0),0)/valid.length) : 0;
                  const totalSets = valid.length;
                  return { date:w.date, maxWeight:maxW, avgReps:avgR, totalSets };
                }).filter(d=>d.maxWeight>0).reverse() : [];

              const chartMax = exHistory.length ? Math.max(...exHistory.map(d=>d.maxWeight)) : 0;
              const chartMin = exHistory.length ? Math.min(...exHistory.map(d=>d.maxWeight)) : 0;
              const chartRange = chartMax - chartMin || 1;
              const cW=300, cH=100;
              const pts = exHistory.map((d,i)=>({
                x: exHistory.length===1 ? cW/2 : (i/(exHistory.length-1))*cW,
                y: cH - ((d.maxWeight-chartMin)/chartRange)*(cH-16) - 8,
                ...d,
              }));
              const chartPath = pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");

              return (
                <div>
                  {/* Search */}
                  <input style={{ ...input, marginBottom:12 }} placeholder="Search exercises…" value={historyExSearch}
                    onChange={e=>{ setHistoryExSearch(e.target.value); setHistoryExercise(""); }} />

                  {allExNames.length===0 && <div style={{ color:T.textFaint, fontSize:14, textAlign:"center", padding:"40px 0", fontFamily:"'DM Sans',sans-serif" }}>Log some strength sessions to see exercise history.</div>}

                  {/* Exercise list */}
                  {!historyExercise && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {filtered.map(name=>{
                        const sessions = strengthWorkouts.filter(w=>w.exercises?.some(e=>e.name===name));
                        const allWeights = sessions.flatMap(w=>w.exercises.find(e=>e.name===name)?.sets.map(s=>parseFloat(s.weight)||0)||[]);
                        const maxW = allWeights.length ? Math.max(...allWeights) : 0;
                        return (
                          <div key={name} onClick={()=>{ setHistoryExercise(name); setHistoryExSearch(""); }} style={{ ...card, marginBottom:0, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div>
                              <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, fontFamily:"'DM Sans',sans-serif" }}>{name}</div>
                              <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{sessions.length} session{sessions.length!==1?"s":""}</div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              {maxW > 0 && <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:16, color:T.accent }}>{maxW} <span style={{ fontSize:11, color:T.textFaint }}>lbs PR</span></div>}
                              <div style={{ fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>›</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Exercise detail + chart */}
                  {historyExercise && (
                    <div>
                      <button onClick={()=>setHistoryExercise("")} style={{ ...btn("sm"), marginBottom:16 }}>← All Exercises</button>
                      <div style={{ fontSize:20, fontWeight:700, color:T.textPrimary, marginBottom:16 }}>{historyExercise}</div>

                      {exHistory.length >= 2 && (
                        <div style={{ ...card, marginBottom:16 }}>
                          <div style={{ display:"flex", gap:16, marginBottom:14 }}>
                            <div>
                              <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>PR</div>
                              <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.accent }}>{chartMax} <span style={{ fontSize:12, color:T.textFaint }}>lbs</span></div>
                            </div>
                            <div>
                              <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Sessions</div>
                              <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:T.textPrimary }}>{exHistory.length}</div>
                            </div>
                            <div>
                              <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Trend</div>
                              <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color: exHistory[exHistory.length-1].maxWeight >= exHistory[0].maxWeight ? T.accent : T.danger }}>
                                {exHistory[exHistory.length-1].maxWeight >= exHistory[0].maxWeight ? "↑" : "↓"}
                              </div>
                            </div>
                          </div>
                          <svg width="100%" viewBox={`0 0 ${cW} ${cH}`} style={{ overflow:"visible" }}>
                            <defs><linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity="0.25"/><stop offset="100%" stopColor={T.accent} stopOpacity="0"/></linearGradient></defs>
                            <path d={`${chartPath} L ${pts[pts.length-1].x} ${cH} L ${pts[0].x} ${cH} Z`} fill="url(#exGrad)" />
                            <path d={chartPath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinejoin="round" />
                            {pts.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="4" fill={p.maxWeight===chartMax?"#fff":T.accent} stroke={T.accent} strokeWidth="2"/><text x={p.x} y={p.y-10} fill={T.textMuted} fontSize="9" textAnchor="middle">{p.maxWeight}</text></g>)}
                          </svg>
                        </div>
                      )}

                      <div style={lbl}>All Sessions</div>
                      {[...exHistory].reverse().map((d,i)=>(
                        <div key={i} style={{ ...card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:13, color:T.textBody, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{formatDate(d.date)}</div>
                            <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{d.totalSets} sets · avg {d.avgReps} reps</div>
                          </div>
                          <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:16, color:d.maxWeight===chartMax?T.accent:T.textPrimary }}>
                            {d.maxWeight} lbs {d.maxWeight===chartMax?"🏆":""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── MUSCLES VIEW ── */}
            {historyView==="muscles" && (()=>{
              // Count sets per muscle group over last 30 days
              const cutoff = now - 30*86400000;
              const recentStrength = strengthWorkouts.filter(w=>new Date(w.date)>=cutoff);
              const groupSets = {};
              MUSCLE_GROUPS.forEach(g=>{ groupSets[g]=0; });
              recentStrength.forEach(w=>{
                (w.exercises||[]).forEach(ex=>{
                  const g = EXERCISE_MUSCLE_MAP[ex.name];
                  if (g) groupSets[g] = (groupSets[g]||0) + ex.sets.filter(s=>s.weight||s.reps).length;
                });
              });

              const maxSets = Math.max(...Object.values(groupSets), 1);
              const sorted = Object.entries(groupSets).sort((a,b)=>b[1]-a[1]);
              const totalSets30 = Object.values(groupSets).reduce((s,v)=>s+v,0);

              // Balance score — how evenly distributed (push vs pull, upper vs lower)
              const push = (groupSets["Chest"]||0) + (groupSets["Shoulders"]||0) + (groupSets["Triceps"]||0);
              const pull = (groupSets["Back"]||0) + (groupSets["Biceps"]||0);
              const upper = push + pull + (groupSets["Shoulders"]||0);
              const lower = groupSets["Legs"]||0;

              return (
                <div>
                  <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif", marginBottom:20 }}>
                    Based on the last 30 days · {totalSets30} total sets
                  </div>

                  {totalSets30===0 && <div style={{ color:T.textFaint, fontSize:14, textAlign:"center", padding:"40px 0", fontFamily:"'DM Sans',sans-serif" }}>Log some strength sessions to see muscle balance.</div>}

                  {/* Bars */}
                  {sorted.map(([group, sets])=>{
                    const pct = maxSets > 0 ? sets/maxSets : 0;
                    const isLow = sets > 0 && sets < maxSets * 0.3;
                    const barColor = sets===0 ? T.bgSm : isLow ? T.danger : T.accent;
                    return (
                      <div key={group} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
                          <div style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, color: sets===0?T.textVeryFaint:T.textBody }}>{group}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            {isLow && <span style={{ fontSize:10, color:T.danger, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Low volume</span>}
                            {sets===0 && <span style={{ fontSize:10, color:T.textVeryFaint, fontFamily:"'DM Sans',sans-serif" }}>No sessions</span>}
                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:600, color:sets===0?T.textVeryFaint:T.textPrimary }}>{sets}</div>
                            <div style={{ fontSize:11, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>sets</div>
                          </div>
                        </div>
                        <div style={{ height:8, background:T.bgSm, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct*100}%`, background:barColor, borderRadius:4, transition:"width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Push / Pull / Legs balance */}
                  {totalSets30 > 0 && (
                    <div style={{ ...card, marginTop:20 }}>
                      <div style={lbl}>Balance Insights</div>
                      {push > 0 && pull > 0 && (()=>{
                        const ratio = push/pull;
                        const balanced = ratio >= 0.8 && ratio <= 1.4;
                        return (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif", color:T.textBody }}>Push / Pull ratio</span>
                              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:600, color:balanced?T.accent:T.danger }}>{ratio.toFixed(1)}:1</span>
                            </div>
                            <div style={{ fontSize:12, color:balanced?T.textFaint:T.danger, fontFamily:"'DM Sans',sans-serif" }}>
                              {balanced ? "Well balanced" : ratio > 1.4 ? "Too much push — add more back/bicep work" : "Too much pull — add more chest/shoulder/tricep work"}
                            </div>
                          </div>
                        );
                      })()}
                      {upper > 0 && lower > 0 && (()=>{
                        const ratio = upper/lower;
                        const balanced = ratio >= 0.8 && ratio <= 2.5;
                        return (
                          <div>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif", color:T.textBody }}>Upper / Lower ratio</span>
                              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:600, color:balanced?T.accent:T.danger }}>{ratio.toFixed(1)}:1</span>
                            </div>
                            <div style={{ fontSize:12, color:balanced?T.textFaint:T.danger, fontFamily:"'DM Sans',sans-serif" }}>
                              {balanced ? "Good balance" : ratio > 2.5 ? "Skewing upper body — add more leg work" : "Heavy on legs — consider more upper body"}
                            </div>
                          </div>
                        );
                      })()}
                      {(push===0||pull===0||upper===0||lower===0) && (
                        <div style={{ fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>Log more sessions across muscle groups to see balance insights.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── BODY ── */}
        {view==="body" && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {[["log","Log Weight"],["chart","Chart"]].map(([id,label])=>(
                <button key={id} style={{ ...btn("sm"), background:measView===id?T.accent:T.bgSm, color:measView===id?"#fff":T.textBody, border:measView===id?"none":`1px solid ${T.bgSmBorder}` }}
                  onClick={()=>setMeasView(id)}>{label}</button>
              ))}
            </div>

            {measView==="log" && (
              <div>
                <div style={{ ...card, marginBottom:20 }}>
                  <div style={lbl}>Log Body Weight</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:T.textFaint, marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Date</div>
                      <div style={{ overflow:"hidden", borderRadius:8, border:`1px solid ${T.bgInputBorder}`, background:T.bgInput }}>
                        <input style={{ ...input, border:"none", background:"transparent", width:"100%", display:"block" }} type="date" value={measDateDraft} onChange={e=>setMeasDateDraft(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:T.textFaint, marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Weight (lbs)</div>
                      <input style={input} type="number" step="0.1" placeholder="185.0" value={measWeightDraft}
                        onChange={e=>setMeasWeightDraft(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter") addMeasurement(); }} />
                    </div>
                  </div>
                  <button style={{ ...btn("primary"), width:"100%" }} onClick={addMeasurement}>Save Entry</button>
                  {measSaved && <div style={{ marginTop:10, fontSize:13, color:T.accentText, textAlign:"center", fontFamily:"'DM Sans',sans-serif" }}>✓ Saved!</div>}
                </div>
                {measurements.length>=2 && (()=>{
                  const first = measurements[0].weight, latest = measurements[measurements.length-1].weight;
                  const diff = (latest-first).toFixed(1), sign = diff>0?"+":"";
                  return (
                    <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                      <StatCard T={T} label="Current" value={`${latest} lbs`} />
                      <StatCard T={T} label="Change" value={`${sign}${diff}`} sub="lbs from start" />
                    </div>
                  );
                })()}
                <div style={lbl}>History</div>
                {measurements.length===0 && <div style={{ color:T.textFaint, fontSize:14, textAlign:"center", padding:"32px 0", fontFamily:"'DM Sans',sans-serif" }}>No entries yet.</div>}
                {[...measurements].reverse().map(m=>(
                  <div key={m.id} style={{ ...card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:13, color:T.textMuted, fontFamily:"'DM Sans',sans-serif" }}>{formatDate(m.date)}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:600, fontSize:18, color:T.textPrimary }}>{m.weight} <span style={{ fontSize:12, color:T.textFaint, fontWeight:400 }}>lbs</span></div>
                      <button style={{ background:"none", border:"none", color:T.textFaint, cursor:"pointer", fontSize:16 }} onClick={()=>deleteMeasurement(m.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {measView==="chart" && (
              <div>
                {measurements.length<2 ? (
                  <div style={{ color:T.textFaint, fontSize:14, textAlign:"center", padding:"60px 0", fontFamily:"'DM Sans',sans-serif" }}>Log at least 2 entries to see your chart.</div>
                ) : (()=>{
                  const diff = (measurements[measurements.length-1].weight - measurements[0].weight).toFixed(1);
                  const sign = diff>0?"+":"";
                  const diffColor = diff<0?T.accentText:diff>0?T.danger:T.textMuted;
                  return (
                    <>
                      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                        <StatCard T={T} label="Start"  value={`${measurements[0].weight} lbs`} sub={formatShortDate(measurements[0].date)} />
                        <StatCard T={T} label="Latest" value={`${measurements[measurements.length-1].weight} lbs`} sub={formatShortDate(measurements[measurements.length-1].date)} />
                      </div>
                      <div style={{ ...card, textAlign:"center", marginBottom:20 }}>
                        <div style={{ fontSize:11, color:T.textFaint, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Total Change</div>
                        <div style={{ fontSize:32, fontWeight:700, fontFamily:"'DM Mono',monospace", color:diffColor }}>{sign}{diff} lbs</div>
                        <div style={{ fontSize:12, color:T.textFaint, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>over {measurements.length} entries</div>
                      </div>
                      <div style={{ background:T.bgCard, borderRadius:14, padding:16, border:`1px solid ${T.bgCardBorder}`, marginBottom:20 }}>
                        <div style={{ fontSize:12, color:T.textFaint, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Sans',sans-serif" }}>Body Weight (lbs)</div>
                        <svg width="100%" viewBox={`0 0 ${measW} ${measH}`} style={{ overflow:"visible" }}>
                          <defs>
                            <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={T.accent} stopOpacity="0.25" />
                              <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={`${measPath} L ${measPts[measPts.length-1].x} ${measH} L ${measPts[0].x} ${measH} Z`} fill="url(#bwGrad)" />
                          <path d={measPath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinejoin="round" />
                          {measPts.map((p,i)=>(
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="4" fill={T.accent} />
                              <text x={p.x} y={p.y-10} fill={T.textMuted} fontSize="9" textAnchor="middle">{p.weight}</text>
                            </g>
                          ))}
                        </svg>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                          <span style={{ fontSize:10, color:T.textVeryFaint, fontFamily:"'DM Sans',sans-serif" }}>{formatShortDate(measurements[0].date)}</span>
                          <span style={{ fontSize:10, color:T.textVeryFaint, fontFamily:"'DM Sans',sans-serif" }}>{formatShortDate(measurements[measurements.length-1].date)}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {view==="settings" && (
          <div>
            {/* Theme toggle */}
            <div style={lbl}>Appearance</div>
            <div style={{ ...card, marginBottom:24 }}>
              <div style={{ fontSize:13, color:T.textMuted, marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>
                Auto switches to dark mode at <strong>8pm</strong> and back to light at <strong>6am</strong>.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {[["auto","Auto"],["light","Light"],["dark","Dark"]].map(([val,label])=>(
                  <button key={val} onClick={()=>setThemePref(val)} style={{
                    flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
                    fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                    background: themePref===val ? T.accent : T.bgSm,
                    color: themePref===val ? "#fff" : T.textMuted,
                  }}>{label}</button>
                ))}
              </div>
              <div style={{ marginTop:10, fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>
                {themeLabel}
              </div>
            </div>

            {/* Weight */}
            <div style={{ ...card, marginBottom:24, background:T.accentDark, border:`1px solid ${T.accentBorder}` }}>
              <div style={{ fontSize:15, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>Weight Used for Calorie Estimates</div>
              {measurements.length>0 ? (
                <div style={{ fontSize:13, color:T.textMuted, fontFamily:"'DM Sans',sans-serif" }}>
                  Pulling from your latest body measurement:{" "}
                  <span style={{ color:T.accentText, fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
                    {measurements[measurements.length-1].weight} lbs
                  </span>
                  {" "}({formatDate(measurements[measurements.length-1].date)}).{" "}
                  <span style={{ color:T.textFaint }}>Log a new entry in the Body tab to update it.</span>
                </div>
              ) : (
                <div style={{ fontSize:13, color:T.textMuted, fontFamily:"'DM Sans',sans-serif" }}>
                  No body measurements logged yet. You can set a manual weight below, or log entries in the{" "}
                  <span style={{ color:T.accentText, cursor:"pointer" }} onClick={()=>setView("body")}>Body tab</span>.
                </div>
              )}
            </div>

            {measurements.length===0 && (
              <>
                <div style={lbl}>Manual Weight Override</div>
                <div style={{ ...card, marginBottom:24 }}>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>Used as a fallback when no body measurements are logged.</div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ position:"relative", flex:1 }}>
                      <input style={{ ...input, paddingRight:40 }} type="number" placeholder="e.g. 185" value={weightDraft}
                        onChange={e=>setWeightDraft(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") saveManualWeight(); }} />
                      <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:12, color:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>lbs</span>
                    </div>
                    <button style={btn("primary")} onClick={saveManualWeight}>Save</button>
                  </div>
                  {manualWeight && <div style={{ marginTop:12, fontSize:13, color:weightSaved?T.accentText:T.textFaint, fontFamily:"'DM Sans',sans-serif" }}>{weightSaved?"✓ Saved!":`Current: ${manualWeight} lbs`}</div>}
                </div>
              </>
            )}

            <div style={lbl}>How Calorie Estimates Work</div>
            <div style={card}>
              <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.7, marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>Estimates use MET (Metabolic Equivalent of Task) values — a research-based intensity measure — combined with your weight and workout duration.</div>
              <div style={div_} />
              <div style={{ fontSize:12, color:T.textFaint, lineHeight:2, fontFamily:"'DM Sans',sans-serif" }}>
                {[["Strength · Light","2.5–3.5"],["Strength · Moderate","3.5–5.0"],["Strength · Hard","5.0–6.5"],null,["Run · Light","7.0–8.5"],["Run · Moderate","9.0–10.5"],["Run · Hard","11.0–13.0"]].map((row,i)=>
                  row
                    ? <div key={i} style={{ display:"flex", justifyContent:"space-between" }}><span>{row[0]}</span><span style={{ fontFamily:"'DM Mono',monospace", color:T.textMuted }}>{row[1]}</span></div>
                    : <div key={i} style={{ height:1, background:T.divider, margin:"4px 0" }} />
                )}
              </div>
              <div style={div_} />
              <div style={{ fontSize:12, color:T.textVeryFaint, fontFamily:"'DM Sans',sans-serif" }}>Estimates are typically within ±15–20%. Actual burn varies with fitness level, rest periods, and metabolism.</div>
            </div>
          </div>
        )}

      </div>

      {/* ── Rest Timer Bar — floats above nav during active workout ── */}
      {view==="log" && logStep==="details" && workoutType==="strength" && (
        <RestTimerBar T={T} remaining={restRemaining} restDuration={restInterval} done={restDone}
          onSkip={skipRestTimer} onRestart={()=>startRestTimer(restInterval)} />
      )}

      {/* ── Edit Modal ── */}
      {editingWorkout && (
        <div style={{ position:"fixed", inset:0, background:T.overlay, zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={e=>{ if(e.target===e.currentTarget) setEditingWorkout(null); }}>
          <div style={{ background:T.bgModal, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"85vh", overflowY:"auto", padding:20, paddingBottom:36, transition:"background 0.4s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:19, color:T.textPrimary }}>Edit Session</div>
              <button style={{ background:"none", border:"none", color:T.textFaint, fontSize:22, cursor:"pointer" }} onClick={()=>setEditingWorkout(null)}>×</button>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={lbl}>Duration (min)</div>
              <input style={input} type="number" value={editingWorkout.duration} onChange={e=>setEditingWorkout(p=>({ ...p, duration:parseInt(e.target.value)||0 }))} />
            </div>
            {editingWorkout.type==="strength" && (
              <>
                {editingWorkout.muscleGroups?.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={lbl}>Muscle Groups</div>
                    <div style={{ fontSize:13, color:T.accentText, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                      {editingWorkout.muscleGroups.join(" + ")}
                      <span style={{ color:T.textFaint, fontSize:12, fontWeight:400 }}> · auto-detected from exercises</span>
                    </div>
                  </div>
                )}
                {editingWorkout.exercises.map((ex,ei)=>(
                  <div key={ei} style={{ ...card, marginBottom:12 }}>
                    <div style={{ fontWeight:600, fontSize:15, marginBottom:10, color:T.textBody }}>{ex.name}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 32px", gap:8, marginBottom:6 }}>
                      <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Weight (lbs)</div>
                      <div style={{ fontSize:10, color:T.textFaint, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Reps</div>
                      <div />
                    </div>
                    {ex.sets.map((s,si)=>(
                      <div key={si} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 32px", gap:8, marginBottom:8 }}>
                        <input style={input} type="number" value={s.weight} onChange={e=>updateEditSet(ei,si,"weight",e.target.value)} />
                        <input style={input} type="number" value={s.reps}   onChange={e=>updateEditSet(ei,si,"reps",e.target.value)} />
                        <button style={{ background:T.dangerDim, border:"none", borderRadius:6, color:T.danger, cursor:"pointer", fontSize:14 }} onClick={()=>removeEditSet(ei,si)}>×</button>
                      </div>
                    ))}
                    <button style={{ ...btn("sm"), width:"100%", marginTop:4 }} onClick={()=>addEditSet(ei)}>+ Set</button>
                  </div>
                ))}
              </>
            )}
            {editingWorkout.type==="cardio" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><div style={lbl}>Activity</div>
                  <select style={sel} value={editingWorkout.cardioType} onChange={e=>setEditingWorkout(p=>({ ...p, cardioType:e.target.value }))}>
                    {CARDIO_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><div style={lbl}>Distance (mi)</div>
                  <input style={input} type="number" step="0.1" value={editingWorkout.distance||""} onChange={e=>setEditingWorkout(p=>({ ...p, distance:parseFloat(e.target.value)||null }))} />
                </div>
                <div><div style={lbl}>Notes</div>
                  <textarea style={{ ...input, resize:"vertical", minHeight:72 }} value={editingWorkout.notes||""} onChange={e=>setEditingWorkout(p=>({ ...p, notes:e.target.value }))} />
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button style={{ ...btn("secondary"), flex:1 }} onClick={()=>setEditingWorkout(null)}>Cancel</button>
              <button style={{ ...btn("primary"), flex:2 }} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:T.bgNav, backdropFilter:"blur(20px)", borderTop:`1px solid ${T.bgNavBorder}`, display:"flex", zIndex:100, transition:"background 0.4s" }}>
        {navItems.map(item=>(
          <div key={item.id}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0", cursor:"pointer", gap:3, borderTop:view===item.id?`2px solid ${T.accent}`:"2px solid transparent" }}
            onClick={()=>{ if(logStep!=="details"){ setView(item.id); if(item.id!=="log") setLogStep("type"); } else setView(item.id); }}>
            <span style={{ fontSize:16, color:view===item.id?T.navIconActive:T.navIconInactive }}>{item.icon}</span>
            <span style={{ fontSize:9, letterSpacing:"0.08em", textTransform:"uppercase", color:view===item.id?T.navLabelActive:T.navLabelInactive, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
