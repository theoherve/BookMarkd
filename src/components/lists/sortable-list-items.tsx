"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { ListItem } from "@/features/lists/types";
import { reorderListItems } from "@/server/actions/lists";
import ListItemCard from "@/components/lists/list-item-card";

type SortableListItemProps = {
  listId: string;
  item: ListItem;
  canEdit: boolean;
  index: number;
};

const SortableListItem = ({
  listId,
  item,
  canEdit,
  index,
}: SortableListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            type="button"
            className="absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-muted active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Réorganiser cet élément"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-muted-foreground"
              aria-hidden="true"
            >
              <circle cx="2" cy="2" r="1" fill="currentColor" />
              <circle cx="6" cy="2" r="1" fill="currentColor" />
              <circle cx="10" cy="2" r="1" fill="currentColor" />
              <circle cx="2" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="10" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="10" r="1" fill="currentColor" />
              <circle cx="6" cy="10" r="1" fill="currentColor" />
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </svg>
          </button>
        )}
        <ListItemCard
          listId={listId}
          item={item}
          canEdit={canEdit}
          positionLabel={`#${index + 1}`}
        />
      </div>
    </div>
  );
};

type SortableListItemsProps = {
  listId: string;
  items: ListItem[];
  canEdit: boolean;
};

const SortableListItems = ({
  listId,
  items,
  canEdit,
}: SortableListItemsProps) => {
  const [isPending, startTransition] = useTransition();
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newItems = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(newItems);

    startTransition(async () => {
      const result = await reorderListItems(
        listId,
        newItems.map((item) => item.id),
      );

      if (!result.success) {
        // Revert on error
        setLocalItems(items);
      }
    });
  };

  if (!canEdit) {
    return (
      <div className="space-y-4">
        {localItems.map((item, index) => (
          <ListItemCard
            key={item.id}
            listId={listId}
            item={item}
            canEdit={false}
            positionLabel={`#${index + 1}`}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {localItems.map((item, index) => (
            <SortableListItem
              key={item.id}
              listId={listId}
              item={item}
              canEdit={canEdit}
              index={index}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableListItems;

