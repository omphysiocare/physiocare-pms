"use client";

import {
  Box,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  /** Enables sorting on this column. */
  sortValue?: (row: T) => string | number | null;
  align?: "left" | "right" | "center";
  width?: number | string;
  /** Hides the column below a breakpoint to keep tables readable on small screens. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

export type SortDirection = "asc" | "desc";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  /** Shown when there are no rows. */
  emptyState?: ReactNode;
  /** Optional content rendered above the table inside the card (filters). */
  toolbar?: ReactNode;
  initialSort?: { columnId: string; direction: SortDirection };
  /** When this value changes the table returns to the first page. */
  resetKey?: string;
  defaultRowsPerPage?: number;
  /** Disables the surrounding card (when embedded inside another card). */
  embedded?: boolean;
  pagination?: boolean;
}

function responsiveDisplay(hideBelow?: Column<unknown>["hideBelow"]) {
  return hideBelow ? { display: { xs: "none", [hideBelow]: "table-cell" } } : undefined;
}

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  onRowClick,
  renderActions,
  emptyState,
  toolbar,
  initialSort,
  resetKey = "",
  defaultRowsPerPage = 10,
  embedded,
  pagination = true,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sort, setSort] = useState(initialSort);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Return to the first page whenever filters change.
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(0);
  }

  const sortedRows = useMemo(() => {
    const column = sort && columns.find((item) => item.id === sort.columnId);
    if (!column?.sortValue || !sort) return rows;
    const getValue = column.sortValue;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      if (left === right) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return (left < right ? -1 : 1) * factor;
    });
  }, [rows, columns, sort]);

  const maxPage = Math.max(0, Math.ceil(sortedRows.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const visibleRows = pagination
    ? sortedRows.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)
    : sortedRows;
  const columnCount = columns.length + (renderActions ? 1 : 0);

  const toggleSort = (columnId: string) => {
    setSort((current) =>
      current?.columnId === columnId
        ? { columnId, direction: current.direction === "asc" ? "desc" : "asc" }
        : { columnId, direction: "asc" },
    );
  };

  const content = (
    <>
      {toolbar}
      <TableContainer>
        <Table size="medium" sx={{ minWidth: { xs: 0, md: 640 } }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ width: column.width, ...responsiveDisplay(column.hideBelow) }}
                  sortDirection={sort?.columnId === column.id ? sort.direction : false}
                >
                  {column.sortValue ? (
                    <TableSortLabel
                      active={sort?.columnId === column.id}
                      direction={sort?.columnId === column.id ? sort.direction : "asc"}
                      onClick={() => toggleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {renderActions && (
                <TableCell align="right" sx={{ width: 56 }} aria-label="Actions" />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id} sx={responsiveDisplay(column.hideBelow)}>
                      <Skeleton />
                    </TableCell>
                  ))}
                  {renderActions && <TableCell />}
                </TableRow>
              ))}
            {!loading && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} sx={{ borderBottom: 0 }}>
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              visibleRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ cursor: onRowClick ? "pointer" : undefined, "&:last-child td": { borderBottom: pagination ? undefined : 0 } }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align} sx={responsiveDisplay(column.hideBelow)}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                      {renderActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && !loading && sortedRows.length > 0 && (
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={currentPage}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </>
  );

  return embedded ? <Box>{content}</Box> : <Card>{content}</Card>;
}
