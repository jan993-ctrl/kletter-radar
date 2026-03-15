"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ClimberPackOpening from "@/components/ClimberPackOpening";
import { supabaseBrowser } from "@/lib/supabase/client";

const PACK_TYPES = [
  { id: "pro", label: "PRO SERIES", description: "1 Legendary garantiert", color: "#FFB300", price: 800, rare: 0, legendary: 1, showCommon: false },
  { id: "elite", label: "ELITE PACK", description: "2 Rare garantiert", color: "#42A5F5", price: 400, rare: 2, legendary: 0, showCommon: false },
  { id: "starter", label: "STARTER PACK", description: "Perfekt zum Starten", color: "#9E9E9E", price: 150, rare: 1, legendary: 0, showCommon: true },
];

const PACK_THEMES = {
  pro: {
    "--pt-top-from": "#2D2208", "--pt-top-to": "#3D3010",
    "--pt-top-border": "#BF8C00",
    "--pt-slice": "#FFD166", "--pt-slice-glow": "rgba(255,209,102,.5)",
    "--pt-body-from": "#2A1F06", "--pt-body-mid": "#1C1505", "--pt-body-to": "#0E1020",
    "--pt-body-border": "rgba(191,140,0,.35)",
    "--pt-eyebrow": "rgba(191,140,0,.8)",
    "--pt-title": "#FFD166", "--pt-title-glow": "rgba(255,209,102,.4)",
    "--pt-icon": "rgba(255,209,102,.7)",
  },
  elite: {
    "--pt-top-from": "#051628", "--pt-top-to": "#0A2440",
    "--pt-top-border": "#1565C0",
    "--pt-slice": "#42A5F5", "--pt-slice-glow": "rgba(66,165,245,.45)",
    "--pt-body-from": "#051830", "--pt-body-mid": "#061020", "--pt-body-to": "#060810",
    "--pt-body-border": "rgba(21,101,192,.4)",
    "--pt-eyebrow": "rgba(66,165,245,.75)",
    "--pt-title": "#90CAF9", "--pt-title-glow": "rgba(66,165,245,.35)",
    "--pt-icon": "rgba(66,165,245,.65)",
  },
  starter: {
    "--pt-top-from": "#1A1A1A", "--pt-top-to": "#252525",
    "--pt-top-border": "#555",
    "--pt-slice": "#BDBDBD", "--pt-slice-glow": "rgba(180,180,180,.3)",
    "--pt-body-from": "#1C1C1C", "--pt-body-mid": "#141414", "--pt-body-to": "#0D0D12",
    "--pt-body-border": "rgba(100,100,100,.3)",
    "--pt-eyebrow": "rgba(180,180,180,.65)",
    "--pt-title": "#E0E0E0", "--pt-title-glow": "rgba(200,200,200,.2)",
    "--pt-icon": "rgba(180,180,180,.55)",
  },
};

const RARITY_META = {
  legendary: { label: "LEGENDARY", color: "#FFB300", bg: "#3D2000", badge: "#7B5800" },
  rare: { label: "RARE", color: "#42A5F5", bg: "#001A3D", badge: "#0D47A1" },
  common: { label: "COMMON", color: "#9E9E9E", bg: "#1C1C1C", badge: "#212121" },
};

const GRADE_SCALE = ["1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", "7a", "7b", "7c", "8a", "8b", "8c", "9a"];
const STYLE_LABELS = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "K")}&background=2A1F06&color=FFD166&size=300`;

const getPowerScore = (abilities) => {
  const safe = Array.isArray(abilities) && abilities.length === 7 ? abilities : [0, 0, 0, 0, 0, 0, 0];
  return Math.round((safe.reduce((a, b) => a + b, 0) / (7 * 24)) * 100);
};

const getRarity = (powerScore) => {
  if (powerScore >= 92) return "legendary";
  if (powerScore >= 75) return "rare";
  return "common";
};

const getTopSet = (styles) => {
  if (!Array.isArray(styles) || styles.length === 0) return "Community";
  const idx = styles.indexOf(Math.max(...styles));
  return STYLE_LABELS[idx] || "Community";
};

export default function InventoryPage() {
  const [view, setView] = useState("packs");
  const [xp, setXp] = useState(2450);
  const [pool, setPool] = useState([]);
  const [collection, setCollection] = useState([]);
  const [openingCards, setOpeningCards] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [pendingCards, setPendingCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("anon");

  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await supabaseBrowser.auth.getUser();
        const currentUser = authRes.data?.user ?? null;
        const id = currentUser?.id || "anon";
        setUserId(id);

        const profileRes = await fetch("/api/profiles").then((res) => res.json());
        const climbers = Array.isArray(profileRes) ? profileRes : [];
        const cards = climbers.filter((c) => Boolean(c.user_id)).map(toPackCard);
        setPool(cards);

        const storedCollection = JSON.parse(localStorage.getItem(`inventory:cards:${id}`) || "[]");
        const storedXp = Number(localStorage.getItem(`inventory:xp:${id}`) || 2450);
        setCollection(Array.isArray(storedCollection) ? storedCollection : []);
        setXp(Number.isFinite(storedXp) ? storedXp : 2450);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(`inventory:cards:${userId}`, JSON.stringify(collection));
      localStorage.setItem(`inventory:xp:${userId}`, String(xp));
    }
  }, [collection, xp, userId, loading]);

  const sortedCollection = useMemo(() => {
    const order = { legendary: 0, rare: 1, common: 2 };
    return [...collection].sort((a, b) => order[a.rarity] - order[b.rarity]);
  }, [collection]);

  const stats = useMemo(() => {
    const legendary = collection.filter((c) => c.rarity === "legendary").length;
    const rare = collection.filter((c) => c.rarity === "rare").length;
    return {
      total: collection.length,
      legendary,
      rare,
      packs: collection.length > 0 ? Math.ceil(collection.length / 5) : 0,
    };
  }, [collection]);

  const drawPack = (pack) => {
    const available = [...pool];
    if (!available.length) return [];

    const legendaryPool = available.filter((c) => c.rarity === "legendary");
    const rarePool = available.filter((c) => c.rarity === "rare");
    const commonPool = available.filter((c) => c.rarity === "common");
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const drawn = [];

    if (pack.legendary > 0) {
      for (let i = 0; i < pack.legendary; i += 1) {
        if (legendaryPool.length) drawn.push(pick(legendaryPool));
        else if (rarePool.length) drawn.push(pick(rarePool));
        else drawn.push(pick(available));
      }
    }

    if (pack.rare > 0) {
      for (let i = 0; i < pack.rare; i += 1) {
        if (rarePool.length) drawn.push(pick(rarePool));
        else if (legendaryPool.length) drawn.push(pick(legendaryPool));
        else drawn.push(pick(available));
      }
    }

    while (drawn.length < 5) {
      const r = Math.random();
      if (r < 0.05 && legendaryPool.length) drawn.push(pick(legendaryPool));
      else if (r < 0.3 && rarePool.length) drawn.push(pick(rarePool));
      else if (commonPool.length) drawn.push(pick(commonPool));
      else drawn.push(pick(available));
    }

    return drawn
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((card, i) => ({ ...card, id: `${card.id}-${Date.now()}-${i}`, originalId: card.id }));
  };

  const openPack = (pack) => {
    if (xp < pack.price) return;
    setOpeningCards(drawPack(pack));
    setSelectedPack(pack);
    setPendingCards([]);
    setXp((prev) => prev - pack.price);
    setView("opening");
  };

  const handleDismiss = () => {
    if (pendingCards.length) setCollection((prev) => [...pendingCards, ...prev]);
    setOpeningCards([]);
    setPendingCards([]);
    setSelectedPack(null);
    setView("collection");
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#080810", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Rajdhani:wght@400;600;700&display=swap');
        .app-nav-btn { background: none; border: none; cursor: pointer; padding: 8px 14px; border-radius: 6px; font-family: 'Oswald', sans-serif;
          font-size: 13px; letter-spacing: .18em; color: rgba(255,255,255,.35); transition: color .2s, background .2s; text-transform: uppercase; }
        .app-nav-btn:hover  { color: rgba(255,255,255,.7); background: rgba(255,255,255,.05); }
        .app-nav-btn.active { color: #FFD166; background: rgba(255,209,102,.08); }
        .pack-card { border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 20px;
          background: linear-gradient(145deg, #13131F, #0D0D16); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .pack-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.2); box-shadow: 0 12px 40px rgba(0,0,0,.5); }
        .pack-open-btn { font-family: 'Oswald', sans-serif; font-size: 13px; letter-spacing: .2em; font-weight: 500;
          padding: 10px 24px; border-radius: 6px; border: none; cursor: pointer; text-transform: uppercase; }
      `}</style>

      {view !== "opening" && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(8,8,16,.9)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: "#FFD166", letterSpacing: ".06em" }}>CRUX CARDS</span>
            <span style={{ fontSize: 10, fontFamily: "'Rajdhani',sans-serif", color: "rgba(255,209,102,.4)", letterSpacing: ".2em", marginTop: 2 }}>SEASON 26</span>
          </div>
          <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button className={`app-nav-btn ${view === "packs" ? "active" : ""}`} onClick={() => setView("packs")}>Packs</button>
            <button className={`app-nav-btn ${view === "collection" ? "active" : ""}`} onClick={() => setView("collection")}>Collection</button>
            <Link href="/" className="app-nav-btn" style={{ textDecoration: "none" }}>Zurück</Link>
          </nav>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: "#FFD166", fontWeight: 700 }}>{xp.toLocaleString()} XP</div>
        </header>
      )}

      {loading && <p style={{ padding: 24 }}>Lade Inventar…</p>}

      {!loading && view === "packs" && (
        <main style={{ flex: 1, padding: "32px 24px", overflowY: "auto" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 11, letterSpacing: ".3em", color: "rgba(255,209,102,.5)", marginBottom: 6 }}>AVAILABLE PACKS</p>
              <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: ".04em" }}>Choose Your Pack</h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 42 }}>
              {PACK_TYPES.map((pack) => (
                <div key={pack.id} className="pack-card">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".25em", color: pack.color }}>{pack.label}</span>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: pack.color, background: `${pack.color}18`, border: `1px solid ${pack.color}44`, borderRadius: 4, padding: "2px 8px" }}>{pack.price} XP</span>
                    </div>
                    <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: "rgba(255,255,255,.5)", letterSpacing: ".06em" }}>{pack.description}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                    {pack.legendary > 0 && <span style={{ fontSize: 10, background: "#7B580022", color: "#FFB300", border: "1px solid #FFB30044", borderRadius: 3, padding: "2px 7px" }}>{pack.legendary}× LEGENDARY</span>}
                    {pack.rare > 0 && <span style={{ fontSize: 10, background: "#0D47A122", color: "#42A5F5", border: "1px solid #42A5F544", borderRadius: 3, padding: "2px 7px" }}>{pack.rare}× RARE</span>}
                    {pack.showCommon && <span style={{ fontSize: 10, background: "#21212122", color: "#9E9E9E", border: "1px solid #9E9E9E44", borderRadius: 3, padding: "2px 7px" }}>{5 - pack.legendary - pack.rare}× COMMON</span>}
                  </div>
                  <button className="pack-open-btn" style={{ background: pack.color, color: "#000", width: "100%", opacity: xp < pack.price || pool.length === 0 ? 0.45 : 1, cursor: xp < pack.price || pool.length === 0 ? "not-allowed" : "pointer" }} onClick={() => openPack(pack)} disabled={xp < pack.price || pool.length === 0}>
                    OPEN PACK
                  </button>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "16px 20px", background: "linear-gradient(145deg,#10101C,#0D0D16)", display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[{ label: "Cards Collected", value: stats.total }, { label: "Legendary", value: stats.legendary }, { label: "Rare", value: stats.rare }, { label: "Packs Opened", value: stats.packs }].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: "rgba(255,255,255,.3)", letterSpacing: ".18em", marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 22, fontWeight: 700, color: "#FFD166" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {!loading && view === "opening" && openingCards.length > 0 && (
        <div style={{ position: "relative", minHeight: "100dvh" }}>
          <button onClick={handleDismiss} style={{ position: "absolute", top: 18, left: 18, zIndex: 20, border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, background: "rgba(0,0,0,.5)", color: "#fff", padding: "8px 12px" }}>← Zur Sammlung</button>
          <ClimberPackOpening
            cards={openingCards}
            packTheme={PACK_THEMES[selectedPack?.id] || PACK_THEMES.pro}
            ownedIds={new Set(collection.map((c) => c.originalId || c.id.split("-")[0]))}
            onDone={setPendingCards}
            onDismiss={handleDismiss}
          />
        </div>
      )}

      {!loading && view === "collection" && (
        <main style={{ flex: 1, padding: "32px 24px", overflowY: "auto" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "'Oswald',sans-serif", marginBottom: 20 }}>Collection ({collection.length})</h1>
            {sortedCollection.length === 0 ? (
              <p>Noch keine Karten gesammelt.</p>
            ) : (
              ["legendary", "rare", "common"].map((rarity) => {
                const cards = sortedCollection.filter((c) => c.rarity === rarity);
                if (!cards.length) return null;
                return (
                  <section key={rarity} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontFamily: "'Oswald',sans-serif", color: RARITY_META[rarity].color }}>{RARITY_META[rarity].label}</span>
                      <div style={{ height: 1, flex: 1, background: `${RARITY_META[rarity].color}44` }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {cards.map((card) => <MiniCard key={card.id} card={card} />)}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </main>
      )}
    </div>
  );
}

function MiniCard({ card }) {
  const meta = RARITY_META[card.rarity] || RARITY_META.common;
  const image = card.image_url || fallbackAvatar(card.name);

  return (
    <div style={{ width: 98, height: 142, borderRadius: 8, border: `1.5px solid ${meta.color}`, background: `linear-gradient(155deg, ${meta.bg} 0%, #0D0D14 100%)`, overflow: "hidden", boxShadow: `0 8px 18px ${meta.color}22` }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 5px", background: "rgba(0,0,0,.4)" }}>
        <span style={{ fontSize: 6, letterSpacing: ".1em", color: meta.color, background: meta.badge, padding: "1px 4px", borderRadius: 3 }}>{meta.label}</span>
        <span style={{ fontSize: 6, opacity: 0.6 }}>{card.set_name || "Community"}</span>
      </div>
      <div style={{ height: 58, position: "relative", margin: 4, borderRadius: 5, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.src = fallbackAvatar(card.name); }} />
        <span style={{ position: "absolute", right: 4, bottom: 2, fontSize: 10, fontWeight: 700, color: meta.color }}>{card.grade}</span>
      </div>
      <div style={{ padding: "0 5px" }}>
        <p style={{ margin: 0, fontSize: 8, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</p>
        <p style={{ margin: 0, fontSize: 7, opacity: 0.6 }}>⚡ {card.stats.power}</p>
        <p style={{ margin: "2px 0 0", fontSize: 6, opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.country}</p>
      </div>
    </div>
  );
}

function toPackCard(climber) {
  const abilities = Array.isArray(climber.abilities) ? climber.abilities : [0, 0, 0, 0, 0, 0, 0];
  const styles = Array.isArray(climber.styles) ? climber.styles : [];
  const power = getPowerScore(abilities);
  const rarity = getRarity(power);
  const gradeIndex = Math.max(0, Math.min(GRADE_SCALE.length - 1, Math.round((power / 100) * (GRADE_SCALE.length - 1))));

  return {
    id: climber.user_id || climber.id,
    name: climber.name || "Kletter-Gast",
    country: climber.gym_name || "GYM",
    flag: "🧗",
    grade: GRADE_SCALE[gradeIndex],
    discipline: "Boulder",
    stats: {
      power,
      tech: Math.max(35, Math.round((((abilities[0] || 0) + (abilities[1] || 0)) / (2 * 24)) * 100)),
      endurance: Math.max(35, Math.round((((abilities[3] || 0) + (abilities[4] || 0)) / (2 * 24)) * 100)),
    },
    rarity,
    quote: climber.notes || "Keep climbing.",
    image_url: climber.image_url,
    set_name: getTopSet(styles),
    abilities,
    styles,
  };
}
