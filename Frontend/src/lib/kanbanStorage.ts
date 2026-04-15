import type { InternshipMatch } from "../types";

export const KANBAN_STORAGE_KEY = "internsync_kanban_board";

export type ColumnId = "toApply" | "applied" | "interviewing" | "offer";

export const COLUMN_ORDER: ColumnId[] = [
  "toApply",
  "applied",
  "interviewing",
  "offer",
];

export const COLUMN_TITLE: Record<ColumnId, string> = {
  toApply: "To Apply",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
};

/** Stable drag id + full match payload for the board */
export type KanbanEntry = { id: string; match: InternshipMatch };

export type KanbanBoard = Record<ColumnId, KanbanEntry[]>;

export function emptyKanbanBoard(): KanbanBoard {
  return { toApply: [], applied: [], interviewing: [], offer: [] };
}

function isColumnId(x: string): x is ColumnId {
  return COLUMN_ORDER.includes(x as ColumnId);
}

function parseBoard(raw: unknown): KanbanBoard {
  if (!raw || typeof raw !== "object") return emptyKanbanBoard();
  const o = raw as Record<string, unknown>;
  const out = emptyKanbanBoard();
  for (const col of COLUMN_ORDER) {
    const arr = o[col];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const e = item as { id?: unknown; match?: unknown };
      if (typeof e.id !== "string" || !e.match || typeof e.match !== "object")
        continue;
      const m = e.match as InternshipMatch;
      if (typeof m.company !== "string" || typeof m.role !== "string") continue;
      out[col].push({ id: e.id, match: m });
    }
  }
  return out;
}

export function loadKanbanBoard(): KanbanBoard {
  if (typeof window === "undefined") return emptyKanbanBoard();
  try {
    const raw = window.localStorage.getItem(KANBAN_STORAGE_KEY);
    if (!raw) return emptyKanbanBoard();
    return parseBoard(JSON.parse(raw) as unknown);
  } catch {
    return emptyKanbanBoard();
  }
}

export function saveKanbanBoard(board: KanbanBoard): void {
  try {
    window.localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(board));
  } catch {
    /* quota / private mode */
  }
}

export function matchFingerprint(m: InternshipMatch): string {
  return `${m.company}|||${m.role}|||${m.location}`;
}

export function findColumnForEntryId(
  board: KanbanBoard,
  entryId: string,
): ColumnId | null {
  for (const col of COLUMN_ORDER) {
    if (board[col].some((e) => e.id === entryId)) return col;
  }
  return null;
}

/** Append to To Apply if that listing is not already in To Apply. */
export function addMatchToToApply(match: InternshipMatch): boolean {
  const board = loadKanbanBoard();
  const fp = matchFingerprint(match);
  const dup = board.toApply.some((e) => matchFingerprint(e.match) === fp);
  if (dup) return false;
  board.toApply.push({
    id: crypto.randomUUID(),
    match: { ...match },
  });
  saveKanbanBoard(board);
  return true;
}

export function droppableColumnId(col: ColumnId): string {
  return `COL:${col}`;
}

export function parseDroppableColumnId(id: string): ColumnId | null {
  if (!id.startsWith("COL:")) return null;
  const rest = id.slice(4);
  return isColumnId(rest) ? rest : null;
}
