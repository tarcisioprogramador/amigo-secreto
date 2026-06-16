import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Participant {
  id: string;
  name: string;
  email: string;
}

export interface Assignment {
  giverId: string;
  receiverId: string;
}

export interface Draw {
  id: string;
  name: string;
  createdAt: number;
  drawnAt: number | null;
  participants: Participant[];
  assignments: Assignment[];
}

interface AmigoSecretoSchema extends DBSchema {
  draws: {
    key: string;
    value: Draw;
    indexes: { "by-createdAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<AmigoSecretoSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<AmigoSecretoSchema>("amigo-secreto-db", 1, {
      upgrade(db) {
        const store = db.createObjectStore("draws", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function getCurrentDraw(): Promise<Draw | null> {
  const db = await getDb();
  const all = await db.getAll("draws");
  if (all.length === 0) return null;
  all.sort((a, b) => b.createdAt - a.createdAt);
  return all[0];
}

export async function createDraw(name: string): Promise<Draw> {
  const db = await getDb();
  const draw: Draw = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    drawnAt: null,
    participants: [],
    assignments: [],
  };
  await db.put("draws", draw);
  return draw;
}

export async function saveDraw(draw: Draw): Promise<void> {
  const db = await getDb();
  await db.put("draws", draw);
}

export async function getAllDraws(): Promise<Draw[]> {
  const db = await getDb();
  const all = await db.getAll("draws");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getDrawById(id: string): Promise<Draw | null> {
  const db = await getDb();
  return (await db.get("draws", id)) ?? null;
}

export async function deleteDraw(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("draws", id);
}

export function shuffleAssignments(participants: Participant[]): Assignment[] {
  if (participants.length < 3) {
    throw new Error("At least 3 participants required");
  }

  let attempts = 0;
  while (attempts < 100) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const assignments: Assignment[] = [];
    let valid = true;

    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];
      const receiver = shuffled[i];
      if (giver.id === receiver.id) {
        valid = false;
        break;
      }
      assignments.push({ giverId: giver.id, receiverId: receiver.id });
    }

    if (valid) return assignments;
    attempts++;
  }

  // Fallback: deterministic derangement
  const result: Assignment[] = [];
  for (let i = 0; i < participants.length; i++) {
    result.push({
      giverId: participants[i].id,
      receiverId: participants[(i + 1) % participants.length].id,
    });
  }
  return result;
}
