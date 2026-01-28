import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "profiles.json");

export function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
}

export function readProfilesSync() {
  ensureDataFile();
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
}

export function writeProfilesSync(profiles) {
  ensureDataFile();
  fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2));
}
