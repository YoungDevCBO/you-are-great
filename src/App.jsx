import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const API_URL = "https://api.anthropic.com/v1/messages";

const PILLARS = [
  {
    id: "employment",
    en: "Work & Employment",
    sw: "Kazi na Ajira",
    desc_en: "Job hunting, career growth, unemployment",
    desc_sw: "Kutafuta kazi, kukua kwa kazi, ukosefu wa ajira",
    color: "#1B5E3B",
    light: "#E8F5EE",
  },
  {
    id: "mental",
    en: "Mental Wellness",
    sw: "Afya ya Akili",
    desc_en: "Anxiety, stress, emotional wellbeing",
    desc_sw: "Wasiwasi, msongo wa mawazo, afya ya kihisia",
    color: "#1C3A5C",
    light: "#E8EFF7",
  },
  {
    id: "entrepreneurship",
    en: "Entrepreneurship",
    sw: "Ujasiriamali",
    desc_en: "Building a business, hustle, starting out",
    desc_sw: "Kujenga biashara, kujaribu, kuanza upya",
    color: "#7A3F00",
    light: "#FFF3E0",
  },
];

const C = {
  green: "#1B5E3B",
  greenMid: "#2D7D52",
  greenLight: "#E8F5EE",
  greenBorder: "#A8D5BB",
  gold: "#C47D0A",
  goldLight: "#FFF8EC",
  goldBorder: "#F0C060",
  bg: "#F4F6F3",
  card: "#FFFFFF",
  text: "#0D1F14",
  muted: "#586B5E",
  border: "#D6E2DA",
};

async function makeAffirmation(profile, lang) {
  const sw = lang === "sw";
  const pillar = PILLARS.find(p => p.id === profile.pillar);
  const pillarLabel = pillar ? (sw ? pillar.sw : pillar.en) : "personal growth";

  const system = sw
    ? "Wewe ni rafiki wa karibu na mwenye hekima. Andika maneno ya kutia moyo kwa Kiswahili safi cha Kenya. Maneno ya sasa, ya moja kwa moja. Sentensi 2 hadi 3 tu. Usiandike alama za nukuu wala utangulizi."
    : "You are a warm, wise friend. Write affirmations in direct, grounded English. Present tense. 2 to 3 sentences only. No quote marks, no preamble, just the words.";

  const user = profile.name
    ? sw
      ? `Andika maneno ya kutia moyo ya kibinafsi kabisa kwa ${profile.name}, kijana wa Kenya mwenye umri wa miaka ${profile.age}. Wanajishughulisha na: ${pillarLabel}. Hali yao ya sasa: "${profile.situation || "wanajaribu kupata njia yao maishani"}". Yafanye yaonekane yameandikwa kwa ajili yao peke yao.`
      : `Write a deeply personal affirmation for ${profile.name}, a ${profile.age}-year-old young Kenyan focused on ${pillarLabel}. Their current situation: "${profile.situation || "finding their footing in life"}". Make it feel like it was written for them and no one else.`
    : sw
      ? "Andika maneno mazuri ya kutia moyo kwa kijana yeyote wa Kenya kati ya miaka 18 na 35 anayejaribu kufanikiwa."
      : "Write a powerful, grounded daily affirmation for any young Kenyan aged 18-35 navigating life's challenges.";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  return (
    data.content?.[0]?.text ??
    (sw
      ? "Wewe una nguvu zaidi kuliko unavyofikiri. Leo unachukua hatua moja mbele."
      : "You are more capable than you know. Today, one step forward is enough.")
  );
}

export default function App() {
  const [step, setStep] = useState("loading");
  const [lang, setLang] = useState("en");
  const [profile, setProfile] = useState({ name: "", age: "", pillar: "", situation: "" });
  const [affirmation, setAffirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [streak] = useState(4);
  const [authMode, setAuthMode] = useState("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const sw = lang === "sw";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setStep("welcome");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setStep("welcome");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile({
        name: data.name || "",
        age: data.age || "",
        pillar: data.pillar || "",
        situation: data.situation || "",
      });
      setStep("home");
    } else {
      setStep("onboard1");
    }
  };

  const saveProfile = async (userId, profileData) => {
    await supabase.from("profiles").upsert({
      id: userId,
      name: profileData.name,
      age: profileData.age,
      pillar: profileData.pillar,
      situation: profileData.situation,
      is_premium: true,
    });
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setStep("onboard1");
    }
    setAuthLoading(false);
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      await loadProfile(data.user.id);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile({ name: "", age: "", pillar: "", situation: "" });
    setAffirmation("");
    setStep("welcome");
  };

  const fetchAffirmation = useCallback(
    async (language = lang) => {
      setLoading(true);
      setSaved(false);
      try {
        const text = await makeAffirmation(profile, language);
        setAffirmation(text);
      } catch {
        setAffirmation(
          language === "sw"
            ? "Wewe una nguvu. Wewe una uwezo. Leo ni siku yako ya kupiga hatua."
            : "You are enough. You are capable. Today is your day to take one step forward."
        );
      }
      setLoading(false);
    },
    [profile, lang]
  );

  useEffect(() => {
    if (step === "home") fetchAffirmation();
  }, [step]);

  const page = {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  };

  const card = (maxW = 460) => ({
    background: C.card,
    borderRadius: "20px",
    border: `1px solid ${C.border}`,
    padding: "36px",
    maxWidth: `${maxW}px`,
    width: "100%",
    boxSizing: "border-box",
  });

  const LangToggle = ({ right = false }) => (
    <div style={{ display: "flex", gap: "6px", marginBottom: right ? 0 : "20px", justifyContent: right ? "flex-end" : "flex-start" }}>
      {[["en", "ENG"], ["sw", "KSW"]].map(([l, label]) => (
        <button
          key={l}
          onClick={() => {
            setLang(l);
            if (step === "home") fetchAffirmation(l);
          }}
          style={{
            padding: "4px 12px",
            borderRadius: "20px",
            border: `1.5px solid ${lang === l ? C.green : C.border}`,
            background: lang === l ? C.greenLight : "transparent",
            color: lang === l ? C.green : C.muted,
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: lang === l ? "700" : "400",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const ProgressBar = () => {
    const steps = ["onboard1", "onboard2", "onboard3"];
    const idx = steps.indexOf(step);
    return (
      <div style={{ display: "flex", gap: "5px", marginBottom: "18px" }}>
        {steps.map((_, i) => (
          <div key={i} style={{ height: "3px", flex: 1, borderRadius: "2px", background: i <= idx ? C.green : C.border }} />
        ))}
      </div>
    );
  };

  const inputStyle = {
    width: "100%",
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px",
    padding: "13px 14px",
    fontSize: "15px",
    fontFamily: "inherit",
    color: C.text,
    background: C.bg,
    boxSizing: "border-box",
    outline: "none",
  };

  const PrimaryBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.border : C.green,
        color: "white",
        border: "none",
        borderRadius: "12px",
        padding: "15px 20px",
        fontSize: "15px",
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        fontFamily: "inherit",
        fontWeight: "600",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );

  // LOADING
  if (step === "loading") return (
    <div style={page}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: C.green, fontWeight: "900", fontSize: "28px", letterSpacing: "-1px" }}>You Are Great</h2>
        <p style={{ color: C.muted, fontSize: "14px" }}>{sw ? "Inapakia..." : "Loading..."}</p>
      </div>
    </div>
  );

  // AUTH
  if (step === "auth") return (
    <div style={page}>
      <div style={{ ...card(), padding: "40px 36px" }}>
        <LangToggle />
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", color: C.green, fontWeight: "900", letterSpacing: "-1px", margin: "0 0 6px" }}>
            You Are Great
          </h1>
          <p style={{ color: C.muted, fontSize: "14px", margin: 0 }}>
            {authMode === "signup"
              ? (sw ? "Fungua akaunti yako ya bure" : "Create your free account")
              : (sw ? "Karibu tena" : "Welcome back")}
          </p>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 6px" }}>Email</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 6px" }}>{sw ? "Nywila" : "Password"}</p>
          <input
            type="password"
            placeholder="••••••••"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {authError && (
          <div style={{ background: "#FEE2E2", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
            <p style={{ color: "#991B1B", fontSize: "13px", margin: 0 }}>{authError}</p>
          </div>
        )}

        <PrimaryBtn
          onClick={authMode === "signup" ? handleSignUp : handleSignIn}
          disabled={authLoading || !authEmail || !authPassword}
        >
          {authLoading
            ? (sw ? "Tafadhali subiri..." : "Please wait...")
            : authMode === "signup"
              ? (sw ? "Jiunge Sasa →" : "Create Account →")
              : (sw ? "Ingia →" : "Sign In →")}
        </PrimaryBtn>

        <p style={{ textAlign: "center", color: C.muted, fontSize: "13px", marginTop: "16px", marginBottom: 0 }}>
          {authMode === "signup"
            ? (sw ? "Una akaunti tayari? " : "Already have an account? ")
            : (sw ? "Huna akaunti? " : "Don't have an account? ")}
          <span
            onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthError(""); }}
            style={{ color: C.green, cursor: "pointer", fontWeight: "700" }}
          >
            {authMode === "signup" ? (sw ? "Ingia" : "Sign in") : (sw ? "Jiunge" : "Sign up")}
          </span>
        </p>
      </div>
    </div>
  );

  // WELCOME
  if (step === "welcome") return (
    <div style={page}>
      <div style={{ ...card(), padding: "44px 36px", textAlign: "center" }}>
        <LangToggle />
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: C.greenLight, color: C.green,
          fontSize: "11px", fontWeight: "700", letterSpacing: "1px",
          padding: "5px 14px", borderRadius: "20px", marginBottom: "28px",
        }}>
          A YOUNGDEV PROGRAM
        </div>
        <h1 style={{ fontSize: "48px", color: C.text, margin: "0 0 4px", fontWeight: "900", letterSpacing: "-2px", lineHeight: 1.0 }}>
          You Are
        </h1>
        <h1 style={{ fontSize: "48px", color: C.green, margin: "0 0 20px", fontWeight: "900", letterSpacing: "-2px", lineHeight: 1.0 }}>
          Great.
        </h1>
        <p style={{ color: C.muted, fontSize: "16px", margin: "0 0 36px", lineHeight: 1.7 }}>
          {sw ? "Maneno ya nguvu yanayoundwa kwa ajili yako — kila siku." : "Powerful words built for you — every single day."}
        </p>
        <div style={{
          background: C.goldLight, border: `1px solid ${C.goldBorder}`,
          borderLeft: `4px solid ${C.gold}`, borderRadius: "12px",
          padding: "20px 22px", marginBottom: "32px", textAlign: "left",
        }}>
          <p style={{ color: "#5C3D00", fontSize: "15px", lineHeight: 1.75, margin: 0 }}>
            {sw
              ? "Akili yako inaamini unachosema nafsini mwako. Anza kila asubuhi ukijikumbusha ukweli — wewe una nguvu, una uwezo, na unastahili mafanikio."
              : "Your mind believes what you repeatedly tell it. Start each morning reminding yourself of the truth — you are capable, you belong, and you are already enough."}
          </p>
        </div>
        <PrimaryBtn onClick={() => setStep("auth")}>
          {sw ? "Anza Safari Yako →" : "Start Your Journey →"}
        </PrimaryBtn>
        <p style={{ color: C.muted, fontSize: "12px", marginTop: "12px", marginBottom: 0 }}>
          {sw ? "Inachukua dakika 2 tu · Bila malipo" : "Takes only 2 minutes · Completely free"}
        </p>
      </div>
    </div>
  );

  // ONBOARD 1
  if (step === "onboard1") return (
    <div style={page}>
      <div style={card()}>
        <LangToggle />
        <ProgressBar />
        <p style={{ color: C.muted, fontSize: "11px", margin: "0 0 6px", letterSpacing: "1px", textTransform: "uppercase" }}>
          {sw ? "Hatua 1 ya 3" : "Step 1 of 3"}
        </p>
        <h2 style={{ fontSize: "24px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
          {sw ? "Jina lako ni nani?" : "What's your name?"}
        </h2>
        <p style={{ color: C.muted, fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>
          {sw ? "Maneno yako yataandikwa kwa ajili yako moja kwa moja." : "Your affirmations will speak directly and personally to you."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div>
            <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 6px" }}>{sw ? "Jina lako la kwanza" : "First name"}</p>
            <input type="text" placeholder={sw ? "Jina lako..." : "Your name..."} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 6px" }}>{sw ? "Umri wako (18-35)" : "Your age (18-35)"}</p>
            <input type="number" placeholder={sw ? "Umri..." : "Age..."} min="18" max="35" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <PrimaryBtn onClick={() => profile.name.trim() && profile.age && setStep("onboard2")} disabled={!profile.name.trim() || !profile.age}>
          {sw ? "Endelea →" : "Continue →"}
        </PrimaryBtn>
      </div>
    </div>
  );

  // ONBOARD 2
  if (step === "onboard2") return (
    <div style={page}>
      <div style={card()}>
        <LangToggle />
        <ProgressBar />
        <p style={{ color: C.muted, fontSize: "11px", margin: "0 0 6px", letterSpacing: "1px", textTransform: "uppercase" }}>
          {sw ? "Hatua 2 ya 3" : "Step 2 of 3"}
        </p>
        <h2 style={{ fontSize: "24px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
          {sw ? `Unazingatia nini zaidi, ${profile.name}?` : `What's weighing on you most, ${profile.name}?`}
        </h2>
        <p style={{ color: C.muted, fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>
          {sw ? "Chagua moja. Maneno yako yatazingatia eneo hili." : "Pick one. Your affirmations will be rooted in this area of your life."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {PILLARS.map(p => {
            const sel = profile.pillar === p.id;
            return (
              <button key={p.id} onClick={() => setProfile({ ...profile, pillar: p.id })} style={{ background: sel ? p.light : C.bg, border: `2px solid ${sel ? p.color : C.border}`, borderRadius: "14px", padding: "16px 18px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, border: `2px solid ${sel ? p.color : C.border}`, background: sel ? p.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {sel && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white" }} />}
                </div>
                <div>
                  <div style={{ color: sel ? p.color : C.text, fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>{sw ? p.sw : p.en}</div>
                  <div style={{ color: C.muted, fontSize: "13px" }}>{sw ? p.desc_sw : p.desc_en}</div>
                </div>
              </button>
            );
          })}
        </div>
        <PrimaryBtn onClick={() => profile.pillar && setStep("onboard3")} disabled={!profile.pillar}>
          {sw ? "Endelea →" : "Continue →"}
        </PrimaryBtn>
      </div>
    </div>
  );

  // ONBOARD 3
  if (step === "onboard3") return (
    <div style={page}>
      <div style={card()}>
        <LangToggle />
        <ProgressBar />
        <p style={{ color: C.muted, fontSize: "11px", margin: "0 0 6px", letterSpacing: "1px", textTransform: "uppercase" }}>
          {sw ? "Hatua 3 ya 3" : "Step 3 of 3"}
        </p>
        <h2 style={{ fontSize: "24px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
          {sw ? "Tuambie zaidi kidogo" : "Tell us a little more"}
        </h2>
        <p style={{ color: C.muted, fontSize: "14px", margin: "0 0 6px", lineHeight: 1.6 }}>
          {sw ? "Hii ndiyo sehemu muhimu zaidi. Unaandika kwa ajili yako mwenyewe." : "This is the most important part. You're writing this for yourself."}
        </p>
        <p style={{ color: C.muted, fontSize: "13px", margin: "0 0 20px", lineHeight: 1.6, fontStyle: "italic" }}>
          {sw ? "Unakabiliwa na nini sasa hivi? Unajisikiaje?" : "What are you dealing with right now? How are you feeling?"}
        </p>
        <textarea
          placeholder={sw ? "k.m. Nimekuwa nikitafuta kazi kwa miezi 6, ninahisi wasiwasi sana..." : "e.g. I've been job hunting for 6 months, I feel anxious about the future..."}
          value={profile.situation}
          onChange={e => setProfile({ ...profile, situation: e.target.value })}
          rows={5}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.7, marginBottom: "20px" }}
        />
        <PrimaryBtn onClick={async () => {
          const { data: { user: u } } = await supabase.auth.getUser();
          if (u) await saveProfile(u.id, profile);
          setStep("home");
        }}>
          {sw ? "Nionyeshe Maneno Yangu →" : "Show Me My Affirmation →"}
        </PrimaryBtn>
      </div>
    </div>
  );

  // HOME
  const hour = new Date().getHours();
  const greeting = hour < 12 ? (sw ? "Habari ya asubuhi" : "Good morning") : hour < 17 ? (sw ? "Habari ya mchana" : "Good afternoon") : (sw ? "Habari ya jioni" : "Good evening");
  const today = new Date().toLocaleDateString(sw ? "sw-KE" : "en-KE", { weekday: "long", month: "long", day: "numeric" });
  const activePillar = PILLARS.find(p => p.id === profile.pillar);

  return (
    <div style={page}>
      <div style={{ ...card(500) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <span style={{ fontWeight: "900", fontSize: "18px", color: C.green, letterSpacing: "-0.5px" }}>You Are Great</span>
            <p style={{ margin: "4px 0 0", color: C.text, fontSize: "14px", fontWeight: "600" }}>{greeting}, {profile.name} 👋</p>
            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px" }}>{today}</p>
          </div>
          <LangToggle right />
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🔥</span>
            <span style={{ color: "#7A4A00", fontSize: "14px", fontWeight: "700" }}>{streak}{sw ? " siku mfululizo" : "-day streak"}</span>
          </div>
          {activePillar && (
            <div style={{ flex: 1, background: activePillar.light, border: `1px solid ${activePillar.color}30`, borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center" }}>
              <span style={{ color: activePillar.color, fontSize: "13px", fontWeight: "700" }}>{sw ? activePillar.sw : activePillar.en}</span>
            </div>
          )}
        </div>

        <div style={{ background: "#F0FAF4", border: `2px solid ${C.greenMid}`, borderRadius: "18px", padding: "30px 28px", marginBottom: "16px", minHeight: "170px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
          <span style={{ position: "absolute", top: "14px", right: "16px", color: C.greenMid, fontSize: "11px", fontWeight: "600" }}>
            {sw ? "✦ imeandikwa kwa ajili yako" : "✦ written for you"}
          </span>
          {loading ? (
            <p style={{ textAlign: "center", color: C.muted, fontSize: "15px", margin: 0, fontStyle: "italic" }}>
              {sw ? "Inaandika maneno yako..." : "Writing your affirmation..."}
            </p>
          ) : (
            <p style={{ fontSize: "19px", lineHeight: 1.8, color: C.text, margin: 0, fontStyle: "italic" }}>"{affirmation}"</p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <button onClick={() => fetchAffirmation()} disabled={loading} style={{ border: `1.5px solid ${C.border}`, background: "transparent", borderRadius: "10px", padding: "13px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", color: C.muted, fontWeight: "600", opacity: loading ? 0.5 : 1 }}>
            {sw ? "↻ Maneno Mapya" : "↻ New affirmation"}
          </button>
          <button onClick={() => setSaved(s => !s)} style={{ background: saved ? C.greenLight : C.green, border: saved ? `1.5px solid ${C.green}` : "none", borderRadius: "10px", padding: "13px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", color: saved ? C.green : "white", fontWeight: "600" }}>
            {saved ? (sw ? "✓ Imehifadhiwa" : "✓ Saved") : (sw ? "Hifadhi" : "Save")}
          </button>
        </div>

        <div style={{ textAlign: "center", paddingTop: "14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>
            {sw ? "Programu ya " : "A program by "}
            <strong style={{ color: C.green }}>YoungDev</strong>
          </p>
          <button onClick={handleSignOut} style={{ background: "transparent", border: "none", color: C.muted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
            {sw ? "Toka" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}