import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AppNav from "../components/AppNav";
import type { InternshipMatch } from "../types";
import {
  type ColumnId,
  type KanbanBoard,
  type KanbanEntry,
  COLUMN_ORDER,
  COLUMN_TITLE,
  droppableColumnId,
  findColumnForEntryId,
  emptyKanbanBoard,
  fetchKanbanBoard,
  parseDroppableColumnId,
  persistKanbanBoard,
} from "../lib/kanbanStorage";

const COLUMN_BG: Record<ColumnId, string> = {
  toApply: "bg-blue-50 border-blue-100",
  applied: "bg-amber-50 border-amber-100",
  interviewing: "bg-violet-50 border-violet-100",
  offer: "bg-emerald-50 border-emerald-100",
};

function SortableKanbanCard({
  entry,
  onRemove,
}: {
  entry: KanbanEntry;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const m = entry.match;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none rounded-lg border border-cf-border bg-cf-surface p-2 text-left shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-cf-text">{m.company}</div>
          <div className="text-xs text-cf-muted">{m.role}</div>
          {m.location ? (
            <div className="mt-0.5 text-[10px] text-slate-500">{m.location}</div>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50"
          aria-label="Remove from board"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(entry.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({
  col,
  entries,
  onRemoveEntry,
}: {
  col: ColumnId;
  entries: KanbanEntry[];
  onRemoveEntry: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: droppableColumnId(col) });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 ${COLUMN_BG[col]}`}
    >
      <h2 className="mb-2 border-b border-blue-200 pb-2 text-sm font-bold text-slate-800">
        {COLUMN_TITLE[col]}
      </h2>
      <SortableContext
        items={entries.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-[8rem] flex-col gap-2">
          {entries.length === 0 ? (
            <p className="text-xs text-cf-muted">Drop cards here</p>
          ) : (
            entries.map((entry) => (
              <SortableKanbanCard
                key={entry.id}
                entry={entry}
                onRemove={onRemoveEntry}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function overlayCard(m: InternshipMatch) {
  return (
    <div className="rounded-lg border border-cf-border bg-cf-surface p-2 shadow-lg ring-2 ring-cf-primary/30">
      <div className="text-sm font-semibold text-cf-text">{m.company}</div>
      <div className="text-xs text-cf-muted">{m.role}</div>
    </div>
  );
}

export default function KanbanTracker() {
  const [board, setBoard] = useState<KanbanBoard>(emptyKanbanBoard);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const skipPersist = useRef(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchKanbanBoard()
      .then(setBoard)
      .finally(() => {
        skipPersist.current = false;
        setBoardLoading(false);
      });
  }, []);

  useEffect(() => {
    if (skipPersist.current) return;
    void persistKanbanBoard(board);
  }, [board]);

  const activeEntry = activeId
    ? COLUMN_ORDER.flatMap((c) => board[c]).find((e) => e.id === activeId) ??
      null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    setBoard((prev) => {
      const fromCol = findColumnForEntryId(prev, activeIdStr);
      if (!fromCol) return prev;

      const activeEntryInner = prev[fromCol].find((e) => e.id === activeIdStr);
      if (!activeEntryInner) return prev;

      const overAsCol = parseDroppableColumnId(overIdStr);

      if (overAsCol) {
        if (fromCol === overAsCol) {
          const filtered = prev[fromCol].filter((e) => e.id !== activeIdStr);
          return {
            ...prev,
            [fromCol]: [...filtered, activeEntryInner],
          };
        }
        const next: KanbanBoard = { ...prev };
        next[fromCol] = next[fromCol].filter((e) => e.id !== activeIdStr);
        next[overAsCol] = [...next[overAsCol], activeEntryInner];
        return next;
      }

      const overCol = findColumnForEntryId(prev, overIdStr);
      if (!overCol) return prev;

      if (fromCol === overCol) {
        const oldIndex = prev[fromCol].findIndex((e) => e.id === activeIdStr);
        const newIndex = prev[overCol].findIndex((e) => e.id === overIdStr);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
        return {
          ...prev,
          [fromCol]: arrayMove(prev[fromCol], oldIndex, newIndex),
        };
      }

      const overIndex = prev[overCol].findIndex((e) => e.id === overIdStr);
      if (overIndex < 0) return prev;

      const next: KanbanBoard = { ...prev };
      next[fromCol] = next[fromCol].filter((e) => e.id !== activeIdStr);
      const dest = [...next[overCol]];
      dest.splice(overIndex, 0, activeEntryInner);
      next[overCol] = dest;
      return next;
    });
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleRemoveEntry(entryId: string) {
    setBoard((prev) => {
      const col = findColumnForEntryId(prev, entryId);
      if (!col) return prev;
      return {
        ...prev,
        [col]: prev[col].filter((e) => e.id !== entryId),
      };
    });
  }

  return (
    <div className="cf-page">
      <AppNav
        title="Application pipeline"
        subtitle="Drag cards between columns, or delete a card. Saved to the database."
      />

      <main className="p-4">
      {boardLoading ? (
        <p className="text-sm text-cf-muted">Loading your pipeline…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {COLUMN_ORDER.map((col) => (
              <KanbanColumn
                key={col}
                col={col}
                entries={board[col]}
                onRemoveEntry={handleRemoveEntry}
              />
            ))}
          </div>
          <DragOverlay>
            {activeEntry ? overlayCard(activeEntry.match) : null}
          </DragOverlay>
        </DndContext>
      )}
      </main>
    </div>
  );
}
