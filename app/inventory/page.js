"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ClimberPackOpening from "@/components/ClimberPackOpening";
import { supabaseBrowser } from "@/lib/supabase/client";

const PACK_TYPES = [
  { id: "pro", label: "PRO SERIES", description: "Garantiert 1 legendäre Karte", color: "#FFB300", price: 800, rare: 2, legendary: 1 },
  { id: "elite", label: "ELITE PACK", description: "Mindestens 2 Rare", color: "#42A5F5", price: 400, rare: 2, legendary: 0 },
  { id: "starter", label: "STARTER PACK", description: "Guter Einstieg", color: "#9E9E9E", price: 150, rare: 1, legendary: 0 },
];

const rarityMeta = {
  legendary: { label: "LEGENDARY", color: "#FFB300", bg: "#3D2000" },
  rare: { label: "RARE", color: "#42A5F5", bg: "#001A3D" },
  common: { label: "COMMON", color: "#9E9E9E", bg: "#1C1C1C" },
};

const gradeScale = ["1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", "7a", "7b", "7c", "8a", "8b", "8c", "9a"];

export default function InventoryPage() {
  const [view, setView] = useState("packs");
  const [xp, setXp] = useState(2450);
  const [pool, setPool] = useState([]);
  const [collection, setCollection] = useState([]);
  const [openingCards, setOpeningCards] = useState([]);
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

  const drawPack = (pack) => {
    const available = [...pool];
    if (!available.length) return [];

    const rarePool = available.filter((c) => c.rarity === "rare" || c.rarity === "legendary");
    const legendaryPool = available.filter((c) => c.rarity === "legendary");
    const commonPool = available.filter((c) => c.rarity === "common");

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const selected = [];

    if (pack.legendary > 0 && legendaryPool.length) selected.push(pickRandom(legendaryPool));
    for (let i = 0; i < pack.rare; i += 1) {
      if (rarePool.length) selected.push(pickRandom(rarePool));
    }

    while (selected.length < 5) {
      selected.push(pickRandom(commonPool.length ? commonPool : available));
    }

    return selected.slice(0, 5).map((card, i) => ({ ...card, id: `${card.id}-${Date.now()}-${i}`, originalId: card.id }));
  };

  const openPack = (pack) => {
    if (xp < pack.price) return;
    setOpeningCards(drawPack(pack));
    setPendingCards([]);
    setXp((prev) => prev - pack.price);
    setView("opening");
  };

  const handleDismiss = () => {
    if (pendingCards.length) {
      setCollection((prev) => [...pendingCards, ...prev]);
    }
    setOpeningCards([]);
    setPendingCards([]);
    setView("collection");
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#080810", color: "#fff" }}>
      {view !== "opening" && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#FFD166", letterSpacing: ".08em" }}>CRUX CARDS</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>SEASON 26</span>
          </div>
          <nav style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("packs")} style={navStyle(view === "packs")}>Packs</button>
            <button onClick={() => setView("collection")} style={navStyle(view === "collection")}>Collection</button>
            <Link href="/" style={navStyle(false)}>Zurück</Link>
          </nav>
          <div style={{ color: "#FFD166", fontWeight: 700 }}>{xp.toLocaleString()} XP</div>
        </header>
      )}

      {loading && <p style={{ padding: 24 }}>Lade Inventar…</p>}

      {!loading && view === "packs" && (
        <main style={{ padding: "28px 24px" }}>
          <h1 style={{ marginBottom: 20 }}>Packs Collection</h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {PACK_TYPES.map((pack) => (
              <article key={pack.id} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 16, background: "#12121c" }}>
                <p style={{ color: pack.color, fontWeight: 700, fontSize: 13, letterSpacing: ".12em" }}>{pack.label}</p>
                <p style={{ opacity: 0.7, margin: "8px 0 14px" }}>{pack.description}</p>
                <button
                  onClick={() => openPack(pack)}
                  disabled={xp < pack.price || pool.length === 0}
                  style={{ width: "100%", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, background: pack.color, color: "#111", cursor: "pointer", opacity: xp < pack.price || pool.length === 0 ? 0.45 : 1 }}
                >
                  OPEN PACK · {pack.price} XP
                </button>
              </article>
            ))}
          </div>
        </main>
      )}

      {!loading && view === "opening" && openingCards.length > 0 && (
        <div style={{ position: "relative", minHeight: "100dvh" }}>
          <button onClick={handleDismiss} style={{ position: "absolute", top: 18, left: 18, zIndex: 20 }}>← Zur Sammlung</button>
          <ClimberPackOpening cards={openingCards} onDone={setPendingCards} onDismiss={handleDismiss} />
        </div>
      )}

      {!loading && view === "collection" && (
        <main style={{ padding: "28px 24px" }}>
          <h1 style={{ marginBottom: 20 }}>Collection ({collection.length})</h1>
          {sortedCollection.length === 0 ? (
            <p>Noch keine Karten gesammelt.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {sortedCollection.map((card) => (
                <MiniCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function navStyle(active) {
  return {
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    background: active ? "rgba(255,209,102,.16)" : "transparent",
    color: active ? "#FFD166" : "rgba(255,255,255,.7)",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  };
}

function MiniCard({ card }) {
  const meta = rarityMeta[card.rarity] || rarityMeta.common;
  return (
    <div style={{ width: 95, border: `1px solid ${meta.color}`, background: `linear-gradient(155deg, ${meta.bg} 0%, #0D0D14 100%)`, borderRadius: 8, padding: 6 }}>
      <p style={{ margin: 0, fontSize: 9, color: meta.color, fontWeight: 700 }}>{meta.label}</p>
      <p style={{ margin: "4px 0", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</p>
      <p style={{ margin: 0, opacity: 0.6, fontSize: 11 }}>{card.grade}</p>
    </div>
  );
}

function toPackCard(climber) {
  const abilities = climber.abilities || [];
  const power = Math.round(((abilities.reduce((a, b) => a + b, 0) || 0) / 120) * 100);
  const rarity = power >= 92 ? "legendary" : power >= 75 ? "rare" : "common";
  const gradeIndex = Math.max(0, Math.min(gradeScale.length - 1, Math.round((power / 100) * (gradeScale.length - 1))));

  return {
    id: climber.user_id || climber.id,
    name: climber.name || "Kletter-Gast",
    country: climber.gym_name || "GYM",
    flag: "🧗",
    grade: gradeScale[gradeIndex],
    discipline: "Boulder",
    stats: { power, tech: Math.max(35, power - 8), endurance: Math.max(35, power - 12) },
    rarity,
    quote: climber.notes || "Keep climbing.",
    image_url: climber.image_url,
  };
}
