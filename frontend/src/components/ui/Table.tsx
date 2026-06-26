import type { ReactNode } from "react";

export interface Column<T = unknown> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function Table<T extends object>({
  columns,
  data,
  onRowClick,
  rowClassName,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-700 text-slate-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 font-semibold"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-slate-800">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`text-slate-300 ${
                onRowClick
                  ? "cursor-pointer hover:bg-slate-700"
                  : "hover:bg-slate-700/50"
              } ${rowClassName ? rowClassName(row) : ""}`}
            >
              {columns.map((column) => {
                const value = (row as Record<string, unknown>)[column.key];
                return (
                  <td key={column.key} className="px-4 py-3">
                    {column.render
                      ? column.render(value, row)
                      : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
