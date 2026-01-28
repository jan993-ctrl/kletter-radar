import { NextResponse } from "next/server";
import { readProfilesSync, writeProfilesSync } from "@/lib/profiles";

export async function GET() {
  try { return NextResponse.json(readProfilesSync()); }
  catch { return NextResponse.error(); }
}

export async function POST(request) {
  try {
    const newProfile = await request.json();
    const profiles = readProfilesSync();
    const index = profiles.findIndex(p => p.id===newProfile.id);
    if(index>=0) profiles[index]=newProfile; else profiles.push(newProfile);
    writeProfilesSync(profiles);
    return NextResponse.json(profiles);
  } catch { return NextResponse.error(); }
}
