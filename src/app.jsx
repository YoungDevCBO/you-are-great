import { useState, useEffect, useCallback } from "react";

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

async function makeAffirmation(profile, isPremium, lang) {
  const sw = lang === "sw";
  const pillar = PILLARS.find(p => p.id === profile.pillar);
  const pillarLabel = pillar ? (sw ? pillar.sw : pillar.en) : "personal growth";

  const system = sw
    ? "Wewe ni rafiki wa karibu na mwenye hekima — si daktari, si mshauri rasmi — rafiki anayekujua na anayekupenda. Andika maneno ya kutia moyo kwa Kiswahili safi cha Kenya. Maneno ya sasa, ya moja kwa moja. Sentensi 2 hadi 3 tu. Usiandike alama za nukuu wala utangulizi."
    : "You are a warm, wise friend — not a therapist, not a corporate coach — a friend who knows this person and believes in them. Write affirmations in direct, grounded English. Present tense. 2 to 3 sentences only. No quote marks, no preamble, just the words.";

  const user = isPremium && profile.name
    ? sw
      ? `Andika maneno ya kutia moyo ya kibinafsi kabisa kwa ${profile.name}, kijana wa Kenya mwenye umri wa miaka ${profile.age}. Wanajishughulisha na: ${pillarLabel}. Hali yao ya sasa: "${profile.situation || "wanajaribu kupata njia yao maishani"}". Yafanye yaonekane yameandikwa kwa ajili yao peke yao — si kwa mtu yeyote mwingine.`
      : `Write a deeply personal affirmation for ${profile.name}, a ${profile.age}-year-old young Kenyan focused on ${pillarLabel}. Their current situation: "${profile.situation || "finding their footing in life"}". Make it feel like it was written for them and no one else.`
    : sw
      ? "Andika maneno mazuri ya kutia moyo kwa kijana yeyote wa Kenya kati ya miaka 18 na 35 anayejaribu kufanikiwa. Maneno ya nguvu, ya kweli, ya sasa."
      : "Write a powerful, grounded daily affirmation for any young Kenyan aged 18–35 navigating life's challenges. Warm, real, and present-tense.";

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
      ? "Wewe una nguvu zaidi kuliko unavyofikiri. Leo unachukua hatua moja mbele — na hiyo inatosha."
      : "You are more capable than you know. Today, one step forward is enough — and you can take it.")
  );
}

export default function App() {
  const [step, setStep] = useState("welcome");
  const [lang, setLang] = useState("en");
  const [profile, setProfile] = useState({ name: "", age: "", pillar: "", situation: "" });
  const [isPremium, setIsPremium] = useState(false);
  const [affirmation, setAffirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [streak] = useState(4);

  const sw = lang === "sw";

  const fetchAffirmation = useCallback(
    async (prem = isPremium, language = lang) => {
      setLoading(true);
      setSaved(false);
      try {
        const text = await makeAffirmation(profile, prem, language);
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
    [profile, isPremium, lang]
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
            if (step === "home") fetchAffirmation(isPremium, l);
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
    const steps = ["onboard1", "onboard2", "onboard3", "plan"];
    const idx = steps.indexOf(step);
    return (
      <div style={{ display: "flex", gap: "5px", marginBottom: "18px" }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              height: "3px",
              flex: 1,
              borderRadius: "2px",
              background: i <= idx ? C.green : C.border,
              transition: "background 0.3s",
            }}
          />
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

  const PrimaryBtn = ({ onClick, disabled, children, style = {} }) => (
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
        letterSpacing: "0.2px",
        ...style,
      }}
    >
      {children}
    </button>
  );

  const StepLabel = ({ n }) => (
    <p style={{ color: C.muted, fontSize: "11px", margin: "0 0 6px", letterSpacing: "1px", textTransform: "uppercase" }}>
      {sw ? `Hatua ${n} ya 3` : `Step ${n} of 3`}
    </p>
  );

  // ── WELCOME ──────────────────────────────────────────────────────────
  if (step === "welcome")
    return (
      <div style={page}>
        <div style={{ ...card(), padding: "44px 36px", textAlign: "center" }}>
          <LangToggle />

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: C.greenLight, color: C.green,
            fontSize: "11px", fontWeight: "700", letterSpacing: "1px",
            padding: "5px 14px", borderRadius: "20px", marginBottom: "28px",
          }}>
            A YOUNGDEV PROGRAM
          </div>

          <h1 style={{
            fontSize: "48px", color: C.text, margin: "0 0 4px",
            fontWeight: "900", letterSpacing: "-2px", lineHeight: 1.0,
          }}>
            You Are
          </h1>
          <h1 style={{
            fontSize: "48px", color: C.green, margin: "0 0 20px",
            fontWeight: "900", letterSpacing: "-2px", lineHeight: 1.0,
          }}>
            Great.
          </h1>

          <p style={{ color: C.muted, fontSize: "16px", margin: "0 0 36px", lineHeight: 1.7 }}>
            {sw
              ? "Maneno ya nguvu yanayoundwa kwa ajili yako — kila siku."
              : "Powerful words built for you — every single day."}
          </p>

          <div style={{
            background: C.goldLight,
            border: `1px solid ${C.goldBorder}`,
            borderLeft: `4px solid ${C.gold}`,
            borderRadius: "12px",
            padding: "20px 22px",
            marginBottom: "32px",
            textAlign: "left",
          }}>
            <p style={{ color: C.gold, fontSize: "11px", fontWeight: "700", letterSpacing: "1px", margin: "0 0 8px" }}>
              {sw ? "KWA NINI INAFANYA KAZI" : "WHY IT WORKS"}
            </p>
            <p style={{ color: "#5C3D00", fontSize: "15px", lineHeight: 1.75, margin: 0 }}>
              {sw
                ? "Akili yako inaamini unachosema nafsini mwako. Anza kila asubuhi ukijikumbusha ukweli — wewe una nguvu, una uwezo, na unastahili mafanikio."
                : "Your mind believes what you repeatedly tell it. Start each morning reminding yourself of the truth — you are capable, you belong, and you are already enough."}
            </p>
          </div>

          <PrimaryBtn onClick={() => setStep("onboard1")}>
            {sw ? "Anza Safari Yako →" : "Start Your Journey →"}
          </PrimaryBtn>
          <p style={{ color: C.muted, fontSize: "12px", marginTop: "12px", marginBottom: 0 }}>
            {sw ? "Inachukua dakika 2 tu" : "Takes only 2 minutes"}
          </p>
        </div>
      </div>
    );

  // ── ONBOARD 1: Name + Age ────────────────────────────────────────────
  if (step === "onboard1")
    return (
      <div style={page}>
        <div style={card()}>
          <LangToggle />
          <ProgressBar />
          <StepLabel n={1} />
          <h2 style={{ fontSize: "24px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
            {sw ? "Jina lako ni nani?" : "What's your name?"}
          </h2>
          <p style={{ color: C.muted, fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>
            {sw
              ? "Maneno yako yataandikwa kwa ajili yako moja kwa moja."
              : "Your affirmations will speak directly and personally to you."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 6px" }}>
                {sw ? "Jina lako la kwanza" : "First name"}
              </p>
              <input
                type="text"
                placeholder={sw ? "Jina lako..." : "Your name..."}
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 6px" }}>
                {sw ? "Umri wako (18–35)" : "Your age (18–35)"}
              </p>
              <input
                type="number"
                placeholder={sw ? "Umri..." : "Age..."}
                min="18"
                max="35"
                value={profile.age}
                onChange={e => setProfile({ ...profile, age: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <PrimaryBtn
            onClick={() => profile.name.trim() && profile.age && setStep("onboard2")}
            disabled={!profile.name.trim() || !profile.age}
          >
            {sw ? "Endelea →" : "Continue →"}
          </PrimaryBtn>
        </div>
      </div>
    );

  // ── ONBOARD 2: Pillar ────────────────────────────────────────────────
  if (step === "onboard2")
    return (
      <div style={page}>
        <div style={card()}>
          <LangToggle />
          <ProgressBar />
          <StepLabel n={2} />
          <h2 style={{ fontSize: "24px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
            {sw
              ? `Unazingatia nini zaidi, ${profile.name}?`
              : `What's weighing on you most, ${profile.name}?`}
          </h2>
          <p style={{ color: C.muted, fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>
            {sw
              ? "Chagua moja. Maneno yako yatazingatia eneo hili."
              : "Pick one. Your affirmations will be rooted in this area of your life."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {PILLARS.map(p => {
              const sel = profile.pillar === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProfile({ ...profile, pillar: p.id })}
                  style={{
                    background: sel ? p.light : C.bg,
                    border: `2px solid ${sel ? p.color : C.border}`,
                    borderRadius: "14px",
                    padding: "16px 18px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${sel ? p.color : C.border}`,
                    background: sel ? p.color : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {sel && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white" }} />}
                  </div>
                  <div>
                    <div style={{ color: sel ? p.color : C.text, fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>
                      {sw ? p.sw : p.en}
                    </div>
                    <div style={{ color: C.muted, fontSize: "13px" }}>
                      {sw ? p.desc_sw : p.desc_en}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <PrimaryBtn
            onClick={() => profile.pillar && setStep("onboard3")}
            disabled={!profile.pillar}
          >
            {sw ? "Endelea →" : "Continue →"}
          </PrimaryBtn>
        </div>
      </div>
    );

  // ── ONBOARD 3: Situation ─────────────────────────────────────────────
  if (step === "onboard3")
    return (
      <div style={page}>
        <div style={card()}>
          <LangToggle />
          <ProgressBar />
          <StepLabel n={3} />
          <h2 style={{ fontSize: "24px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
            {sw ? "Tuambie zaidi kidogo" : "Tell us a little more"}
          </h2>
          <p style={{ color: C.muted, fontSize: "14px", margin: "0 0 6px", lineHeight: 1.6 }}>
            {sw
              ? "Hii ndiyo sehemu muhimu zaidi. Unaandika kwa ajili yako mwenyewe — hakuna mtu mwingine atakayesoma hili."
              : "This is the most important part. You're writing this for yourself — no one else will read it."}
          </p>
          <p style={{ color: C.muted, fontSize: "13px", margin: "0 0 20px", lineHeight: 1.6, fontStyle: "italic" }}>
            {sw
              ? "Unakabiliwa na nini sasa hivi? Unajisikiaje? Unataka nini kibadilike?"
              : "What are you dealing with right now? How are you feeling? What do you want to change?"}
          </p>
          <textarea
            placeholder={
              sw
                ? "k.m. Nimekuwa nikitafuta kazi kwa miezi 6, ninahisi wasiwasi sana, ninaanza biashara ndogo ndogo..."
                : "e.g. I've been job hunting for 6 months, I feel anxious about the future, I'm trying to start a small business..."
            }
            value={profile.situation}
            onChange={e => setProfile({ ...profile, situation: e.target.value })}
            rows={5}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.7, marginBottom: "20px" }}
          />
          <PrimaryBtn onClick={() => setStep("plan")}>
            {sw ? "Endelea →" : "Continue →"}
          </PrimaryBtn>
        </div>
      </div>
    );

  // ── PLAN ─────────────────────────────────────────────────────────────
  if (step === "plan")
    return (
      <div style={page}>
        <div style={{ ...card(520) }}>
          <LangToggle />
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "26px", color: C.text, margin: "0 0 6px", fontWeight: "800" }}>
              {sw ? "Chagua Mpango Wako" : "Choose Your Plan"}
            </h2>
            <p style={{ color: C.muted, fontSize: "14px", margin: 0 }}>
              {sw
                ? "Anza bila malipo. Panda ngazi ukiwa tayari."
                : "Start free. Upgrade when you're ready."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            {/* Free plan */}
            <div style={{ border: `1.5px solid ${C.border}`, borderRadius: "16px", padding: "22px" }}>
              <p style={{ color: C.muted, fontSize: "10px", letterSpacing: "1.5px", fontWeight: "700", margin: "0 0 6px" }}>
                {sw ? "BURE" : "FREE"}
              </p>
              <p style={{ fontSize: "28px", color: C.text, margin: "0 0 2px", fontWeight: "900" }}>Ksh 0</p>
              <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 16px" }}>{sw ? "milele" : "forever"}</p>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px", marginBottom: "16px" }}>
                {(sw
                  ? ["Maneno mazuri ya kila siku", "Kiingereza au Kiswahili", "Bila malipo milele"]
                  : ["Daily uplifting affirmations", "English or Kiswahili", "Always free"]
                ).map(f => (
                  <div key={f} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: C.green, fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>✓</span>
                    <span style={{ color: C.muted, fontSize: "13px" }}>{f}</span>
                  </div>
                ))}
                {(sw
                  ? ["Maneno ya kibinafsi kwako", "Kulingana na hali yako"]
                  : ["Personalized to you", "Based on your real situation"]
                ).map(f => (
                  <div key={f} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: C.border, fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>—</span>
                    <span style={{ color: C.border, fontSize: "13px" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setIsPremium(false); setStep("home"); }}
                style={{
                  border: `1.5px solid ${C.border}`, background: "transparent",
                  borderRadius: "10px", padding: "12px", width: "100%",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                  color: C.muted, fontWeight: "600",
                }}
              >
                {sw ? "Anza Bure" : "Start Free"}
              </button>
            </div>

            {/* Premium plan */}
            <div style={{
              border: `2px solid ${C.green}`, borderRadius: "16px", padding: "22px",
              background: C.greenLight, position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                background: C.green, color: "white", fontSize: "10px", fontWeight: "700",
                letterSpacing: "1px", padding: "4px 14px", borderRadius: "20px", whiteSpace: "nowrap",
              }}>
                {sw ? "MAARUFU ZAIDI" : "MOST POPULAR"}
              </div>
              <p style={{ color: C.green, fontSize: "10px", letterSpacing: "1.5px", fontWeight: "700", margin: "0 0 6px" }}>
                PREMIUM
              </p>
              <p style={{ fontSize: "28px", color: C.text, margin: "0 0 2px", fontWeight: "900" }}>Ksh 200</p>
              <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 16px" }}>{sw ? "/mwezi" : "/month"}</p>
              <div style={{ borderTop: `1px solid ${C.greenBorder}`, paddingTop: "12px", marginBottom: "16px" }}>
                {(sw
                  ? ["Maneno mazuri ya kila siku", "Kiingereza au Kiswahili", "Maneno ya kibinafsi kwako", "Kulingana na hali yako", "Malipo kupitia M-Pesa"]
                  : ["Daily uplifting affirmations", "English or Kiswahili", "Personalized to your life", "Based on your real situation", "Pay easily via M-Pesa"]
                ).map(f => (
                  <div key={f} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: C.green, fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>✓</span>
                    <span style={{ color: C.muted, fontSize: "13px" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setIsPremium(true); setStep("home"); }}
                style={{
                  background: C.green, border: "none", borderRadius: "10px", padding: "12px",
                  width: "100%", cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                  color: "white", fontWeight: "600",
                }}
              >
                {sw ? "Anza Premium" : "Start Premium"}
              </button>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            color: C.muted, fontSize: "13px",
          }}>
            <span>📱</span>
            <span>
              {sw
                ? "Malipo kupitia M-Pesa — Ksh 200 tu kwa mwezi"
                : "Pay via M-Pesa — just Ksh 200 a month"}
            </span>
          </div>
        </div>
      </div>
    );

  // ── HOME ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? sw ? "Habari ya asubuhi" : "Good morning"
      : hour < 17
      ? sw ? "Habari ya mchana" : "Good afternoon"
      : sw ? "Habari ya jioni" : "Good evening";

  const today = new Date().toLocaleDateString(sw ? "sw-KE" : "en-KE", {
    weekday: "long", month: "long", day: "numeric",
  });

  const activePillar = PILLARS.find(p => p.id === profile.pillar);

  return (
    <div style={page}>
      <div style={{ ...card(500) }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontWeight: "900", fontSize: "18px", color: C.green, letterSpacing: "-0.5px" }}>
                You Are Great
              </span>
            </div>
            <p style={{ margin: 0, color: C.text, fontSize: "14px", fontWeight: "600" }}>
              {greeting}, {profile.name} 👋
            </p>
            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px" }}>{today}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <div style={{
              background: isPremium ? C.green : C.border,
              color: "white", padding: "4px 10px", borderRadius: "20px",
              fontSize: "10px", fontWeight: "700", letterSpacing: "1px",
            }}>
              {isPremium ? "PREMIUM" : sw ? "BURE" : "FREE"}
            </div>
            <LangToggle right />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <div style={{
            flex: 1, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
            borderRadius: "12px", padding: "12px 14px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "18px" }}>🔥</span>
            <div>
              <span style={{ color: "#7A4A00", fontSize: "15px", fontWeight: "700" }}>{streak}</span>
              <span style={{ color: "#7A4A00", fontSize: "13px" }}>
                {sw ? ` siku mfululizo` : `-day streak`}
              </span>
            </div>
          </div>

          {activePillar && (
            <div style={{
              flex: 1, background: activePillar.light,
              border: `1px solid ${activePillar.color}30`,
              borderRadius: "12px", padding: "12px 14px",
              display: "flex", alignItems: "center",
            }}>
              <span style={{ color: activePillar.color, fontSize: "13px", fontWeight: "700" }}>
                {sw ? activePillar.sw : activePillar.en}
              </span>
            </div>
          )}
        </div>

        {/* Affirmation card */}
        <div style={{
          background: isPremium ? "#F0FAF4" : C.bg,
          border: `2px solid ${isPremium ? C.greenMid : C.border}`,
          borderRadius: "18px",
          padding: "30px 28px",
          marginBottom: "16px",
          minHeight: "170px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}>
          {isPremium && (
            <span style={{
              position: "absolute", top: "14px", right: "16px",
              color: C.greenMid, fontSize: "11px", fontWeight: "600",
            }}>
              {sw ? "✦ imeandikwa kwa ajili yako" : "✦ written for you"}
            </span>
          )}

          {loading ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: C.muted, fontSize: "15px", margin: "0 0 8px", fontStyle: "italic" }}>
                {sw ? "Inaandika maneno yako..." : "Writing your affirmation..."}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: C.green, opacity: 0.4 + i * 0.2,
                  }} />
                ))}
              </div>
            </div>
          ) : (
            <p style={{
              fontSize: "19px", lineHeight: 1.8, color: C.text,
              margin: 0, fontStyle: "italic", fontWeight: "400",
            }}>
              "{affirmation}"
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <button
            onClick={() => fetchAffirmation()}
            disabled={loading}
            style={{
              border: `1.5px solid ${C.border}`, background: "transparent",
              borderRadius: "10px", padding: "13px", cursor: "pointer",
              fontFamily: "inherit", fontSize: "14px", color: C.muted,
              fontWeight: "600", opacity: loading ? 0.5 : 1,
            }}
          >
            {sw ? "↻ Maneno Mapya" : "↻ New affirmation"}
          </button>
          <button
            onClick={() => setSaved(s => !s)}
            style={{
              background: saved ? C.greenLight : C.green,
              border: saved ? `1.5px solid ${C.green}` : "none",
              borderRadius: "10px", padding: "13px", cursor: "pointer",
              fontFamily: "inherit", fontSize: "14px",
              color: saved ? C.green : "white", fontWeight: "600",
            }}
          >
            {saved ? (sw ? "✓ Imehifadhiwa" : "✓ Saved") : (sw ? "Hifadhi" : "Save")}
          </button>
        </div>

        {/* Upgrade CTA (free users only) */}
        {!isPremium && (
          <div style={{
            background: C.greenLight,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: "14px", padding: "14px 16px",
            display: "flex", alignItems: "center", gap: "12px",
            marginBottom: "16px",
          }}>
            <span style={{ fontSize: "20px", flexShrink: 0 }}>✦</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "14px", color: C.green, fontWeight: "700" }}>
                {sw ? "Pata maneno ya kibinafsi" : "Get affirmations made for you"}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: C.muted }}>
                {sw ? "Ksh 200/mwezi kupitia M-Pesa" : "Ksh 200/month via M-Pesa"}
              </p>
            </div>
            <button
              onClick={() => { setIsPremium(true); fetchAffirmation(true); }}
              style={{
                background: C.green, color: "white", border: "none",
                borderRadius: "8px", padding: "8px 14px", cursor: "pointer",
                fontSize: "13px", fontFamily: "inherit", fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              {sw ? "Panda Ngazi" : "Upgrade"}
            </button>
          </div>
        )}

        {/* YoungDev footer */}
        <div style={{
          textAlign: "center", paddingTop: "14px",
          borderTop: `1px solid ${C.border}`,
        }}>
          <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>
            {sw ? "Programu ya " : "A program by "}
            <strong style={{ color: C.green }}>YoungDev</strong>
            {" · "}
            {sw ? "Kujenga vijana wa Kenya" : "Building Kenya's youth"}
          </p>
        </div>
      </div>
    </div>
  );
}
