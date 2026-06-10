import { useMemo, useState } from "react";
import Icon from "../Icon.jsx";

const PAGE_SIZE = 10;

const COLUMNS = [
  { key: "rank", label: "RANK", sortable: false, span: "col-span-1" },
  { key: "username", label: "TERRITORY LORD", sortable: false, span: "col-span-4" },
  { key: "region", label: "REGION", sortable: false, span: "col-span-2" },
  { key: "cells", label: "CELLS", sortable: true, span: "col-span-2 text-right" },
  { key: "areaM2", label: "AREA M²", sortable: true, span: "col-span-2 text-right" },
  { key: "streak", label: "STREAK", sortable: true, span: "col-span-1 text-right" },
];

export default function RankTable({ players, currentUserId }) {
  const [sortKey, setSortKey] = useState("cells");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const arr = [...players];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return arr;
  }, [players, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  return (
    <div data-testid="rank-table" className="glass-panel rounded-xl overflow-hidden">
      <div className="grid grid-cols-12 gap-base px-md py-md border-b border-outline-variant/20 bg-surface-container-low text-on-surface-variant font-label-bold uppercase text-xs">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            data-testid={`sort-${col.key}`}
            onClick={() => col.sortable && handleSort(col.key)}
            disabled={!col.sortable}
            className={`${col.span} text-left flex items-center gap-base ${col.sortable ? "hover:text-primary-fixed cursor-pointer" : "cursor-default"} ${col.span.includes("text-right") ? "justify-end" : ""}`}
          >
            <span>{col.label}</span>
            {col.sortable && sortKey === col.key && (
              <Icon name={sortDir === "desc" ? "arrow_downward" : "arrow_upward"} className="text-xs" />
            )}
          </button>
        ))}
      </div>
      {pageRows.map((p) => {
        const isMe = p.id === currentUserId || p.isCurrentUser;
        return (
          <div
            key={p.id}
            data-testid="rank-row"
            data-user-id={p.id}
            className={`grid grid-cols-12 gap-base px-md py-sm border-b border-outline-variant/10 transition-all items-center text-sm ${
              isMe
                ? "bg-primary-container/10 border-l-4 border-primary-fixed"
                : "hover:bg-surface-variant/30"
            }`}
          >
            <div className={`col-span-1 font-stats-display ${isMe ? "text-primary-fixed" : "text-on-surface-variant"}`}>
              {String(p.rank).padStart(2, "0")}
            </div>
            <div className="col-span-4 flex items-center gap-md">
              {p.avatar ? (
                <img alt={`${p.username} avatar`} className="w-10 h-10 rounded-full object-cover" src={p.avatar} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary-fixed flex items-center justify-center">
                  <Icon name="person" filled className="text-primary-fixed" />
                </div>
              )}
              <span className={`font-headline-md ${isMe ? "text-primary-fixed italic" : "text-primary"} uppercase`}>
                {p.username}
              </span>
            </div>
            <div className={`col-span-2 font-body-md ${isMe ? "text-primary" : "text-on-surface-variant"}`}>
              {p.region}
            </div>
            <div className={`col-span-2 text-right font-stats-display ${isMe ? "text-primary-fixed" : "text-secondary-fixed"}`}>
              {p.cells.toLocaleString()}
            </div>
            <div className="col-span-2 text-right font-body-md text-on-surface-variant">
              {p.areaM2.toLocaleString()}
            </div>
            <div className="col-span-1 text-right font-stats-display text-primary-fixed">
              {p.streak}
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between px-md py-md bg-surface-container-low/40">
        <button
          data-testid="prev-page"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="font-label-bold text-xs px-md py-sm rounded-full hover:bg-surface-variant/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          PREV
        </button>
        <span data-testid="page-indicator" className="font-label-bold text-on-surface-variant text-xs uppercase">
          Page {page} / {totalPages}
        </span>
        <button
          data-testid="next-page"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="font-label-bold text-xs px-md py-sm rounded-full hover:bg-surface-variant/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
