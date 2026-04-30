"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClipboardEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui";

type RosterRow = {
  firstName: string;
  lastName: string;
  age: string;
  athleteEmail: string;
  parentName: string;
  parentEmail: string;
};

const columns: Array<{ key: keyof RosterRow; label: string; type?: string }> = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "age", label: "Age", type: "number" },
  { key: "athleteEmail", label: "Athlete email optional", type: "email" },
  { key: "parentName", label: "Parent/guardian name optional" },
  { key: "parentEmail", label: "Parent email optional", type: "email" }
];

function blankRow(): RosterRow {
  return {
    firstName: "",
    lastName: "",
    age: "",
    athleteEmail: "",
    parentName: "",
    parentEmail: ""
  };
}

function initialRows() {
  return Array.from({ length: 5 }, blankRow);
}

function cleanCell(value: string) {
  return value.replaceAll(",", " ").trim();
}

function rowHasContent(row: RosterRow) {
  return Object.values(row).some((value) => value.trim());
}

function rowToImportLine(row: RosterRow) {
  return [
    row.firstName,
    row.lastName,
    row.age,
    row.athleteEmail,
    row.parentName,
    row.parentEmail
  ].map(cleanCell).join(", ");
}

export function RosterImportGrid({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<RosterRow[]>(initialRows);
  const [advancedRows, setAdvancedRows] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function updateCell(rowIndex: number, key: keyof RosterRow, value: string) {
    setRows((current) => current.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)));
  }

  function clearRow(rowIndex: number) {
    setRows((current) => current.map((row, index) => (index === rowIndex ? blankRow() : row)));
  }

  function removeRow(rowIndex: number) {
    setRows((current) => current.length <= 1 ? [blankRow()] : current.filter((_, index) => index !== rowIndex));
  }

  function addRow() {
    setRows((current) => [...current, blankRow()]);
  }

  function pasteIntoGrid(event: ClipboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number) {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    const pastedRows = text.trimEnd().split(/\r?\n/).map((line) => line.split("\t"));
    setRows((current) => {
      const next = [...current];
      while (next.length < rowIndex + pastedRows.length) next.push(blankRow());
      pastedRows.forEach((pastedRow, pastedRowIndex) => {
        const targetIndex = rowIndex + pastedRowIndex;
        const nextRow = { ...next[targetIndex] };
        pastedRow.forEach((cell, pastedColumnIndex) => {
          const targetColumn = columns[columnIndex + pastedColumnIndex];
          if (targetColumn) nextRow[targetColumn.key] = cell.trim();
        });
        next[targetIndex] = nextRow;
      });
      return next;
    });
  }

  async function submitRoster() {
    const gridLines = rows.filter(rowHasContent).map(rowToImportLine);
    const advancedLines = advancedRows.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const importRows = [...gridLines, ...advancedLines].join("\n");

    if (!importRows.trim()) {
      setStatus("error");
      setMessage("Add at least one roster row before importing.");
      return;
    }

    setStatus("saving");
    setMessage("");
    const form = new FormData();
    form.set("teamId", teamId);
    form.set("rows", importRows);

    try {
      const response = await fetch("/api/admin/roster", {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(String(data.error ?? "Could not import roster rows. Check the table and try again."));
        return;
      }
      setStatus("saved");
      setMessage(String(data.message ?? "Roster rows imported"));
      setRows(initialRows());
      setAdvancedRows("");
      router.refresh();
      window.setTimeout(() => {
        setStatus((current) => (current === "saved" ? "idle" : current));
        setMessage("");
      }, 2200);
    } catch {
      setStatus("error");
      setMessage("Could not import roster rows. Try again in a moment.");
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-inner">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-gradient-to-r from-stone-50 to-fuel-mint/25 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              {columns.map((column) => <th key={column.key} className="px-3 py-2">{column.label}</th>)}
              <th className="w-24 px-3 py-2">Row</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-stone-100 transition-colors hover:bg-fuel-mint/15">
                {columns.map((column, columnIndex) => (
                  <td key={column.key} className="min-w-36 px-2 py-2">
                    <Input
                      aria-label={`${column.label} row ${rowIndex + 1}`}
                      type={column.type ?? "text"}
                      min={column.key === "age" ? 1 : undefined}
                      value={row[column.key]}
                      onChange={(event) => updateCell(rowIndex, column.key, event.target.value)}
                      onPaste={(event) => pasteIntoGrid(event, rowIndex, columnIndex)}
                      className="border-stone-200 px-2"
                    />
                  </td>
                ))}
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => clearRow(rowIndex)} className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs font-semibold text-stone-600 shadow-sm hover:bg-stone-50">
                      Clear
                    </button>
                    <button type="button" onClick={() => removeRow(rowIndex)} className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-stone-600 shadow-sm hover:bg-stone-50" aria-label={`Remove row ${rowIndex + 1}`}>
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={addRow} className="bg-fuel-blue hover:bg-sky-800">Add row</Button>
        <Button type="button" onClick={submitRoster}>Import roster rows</Button>
      </div>
      <details className="rounded-xl border border-stone-200 bg-gradient-to-b from-stone-50/90 to-white/90 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-stone-700">Advanced paste mode</summary>
        <p className="mt-2 text-xs leading-5 text-stone-600">
          Optional fallback for comma rows. Format: first name, last name, age, athlete email, parent name, parent email.
        </p>
        <Textarea
          className="mt-2"
          rows={4}
          value={advancedRows}
          onChange={(event) => setAdvancedRows(event.target.value)}
          placeholder="Avery, Kim, 14, , Sam Kim, sam.parent@example.com"
        />
      </details>
      <div className="min-h-5" aria-live="polite">
        {status === "saving" ? <p className="text-xs font-semibold text-fuel-blue">Saving...</p> : null}
        {status === "saved" ? <p className="text-xs font-semibold text-fuel-green">{message || "Roster rows imported"}</p> : null}
        {status === "error" ? <p className="text-xs font-semibold text-red-700">{message}</p> : null}
      </div>
    </div>
  );
}
