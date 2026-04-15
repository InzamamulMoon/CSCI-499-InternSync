import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import type { InternshipMatch } from "../types";
import {
  type ColumnId,
  type KanbanBoard,
  type KanbanEntry,
  COLUMN_ORDER,
  COLUMN_TITLE,
  droppableColumnId,
  findColumnForEntryId,
  loadKanbanBoard,
  parseDroppableColumnId,
  saveKanbanBoard,
} from "../lib/kanbanStorage";
function SortableKanbanCard({ entry }: { entry: KanbanEntry }) {
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
      className="cursor-grab touch-none rounded border border-gray-200 bg-white p-2 text-left shadow-sm active:cursor-grabbing"
    >
      <div className="text-sm font-semibold text-gray-900">{m.company}</div>
      <div className="text-xs text-gray-600">{m.role}</div>
      {m.location ? (
        <div className="mt-0.5 text-[10px] text-gray-500">{m.location}</div>
      ) : null}
    </div>
  );
}

function KanbanColumn({
  col,
  entries,
}: {
  col: ColumnId;
  entries: KanbanEntry[];
}) {
  const { setNodeRef } = useDroppable({ id: droppableColumnId(col) });

  return (
    <div
      ref={setNodeRef}
      className="flex w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3"
    >
      <h2 className="mb-2 border-b border-gray-300 pb-2 text-sm font-bold text-gray-800">
        {COLUMN_TITLE[col]}
      </h2>
      <SortableContext
        items={entries.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-[8rem] flex-col gap-2">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-500">Drop cards here</p>
          ) : (
            entries.map((entry) => (
              <SortableKanbanCard key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function overlayCard(m: InternshipMatch) {
  return (
    <div className="rounded border border-gray-300 bg-white p-2 shadow-lg">
      <div className="text-sm font-semibold text-gray-900">{m.company}</div>
      <div className="text-xs text-gray-600">{m.role}</div>
    </div>
  );
}

export default function KanbanTracker() {
  const [board, setBoard] = useState<KanbanBoard>(() => loadKanbanBoard());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    saveKanbanBoard(board);
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

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Application pipeline</h1>
          <p className="text-sm text-gray-600">
            Drag cards between columns. State is saved in this browser.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-blue-700 underline hover:text-blue-900"
        >
          ← Back to matches
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMN_ORDER.map((col) => (
            <KanbanColumn key={col} col={col} entries={board[col]} />
          ))}
        </div>
        <DragOverlay>
          {activeEntry ? overlayCard(activeEntry.match) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
