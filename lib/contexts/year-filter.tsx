"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface YearRange {
  from: number;
  to: number;
}

interface YearFilterContextValue {
  yearRange: YearRange;
  setYearRange: (range: YearRange) => void;
  setFrom: (year: number) => void;
  setTo: (year: number) => void;
  /** Build an ArcGIS WHERE clause fragment for a Year field */
  buildWhereClause: (yearField?: string, quoted?: boolean) => string;
  /** The available year options */
  yearOptions: number[];
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2018;

const defaultRange: YearRange = { from: CURRENT_YEAR, to: CURRENT_YEAR };

const YearFilterContext = createContext<YearFilterContextValue | null>(null);

export function YearFilterProvider({
  children,
  initialRange,
}: {
  children: ReactNode;
  initialRange?: YearRange;
}) {
  const [yearRange, setYearRange] = useState<YearRange>(
    initialRange ?? defaultRange,
  );

  const setFrom = useCallback(
    (year: number) => setYearRange((prev) => ({ ...prev, from: year })),
    [],
  );

  const setTo = useCallback(
    (year: number) => setYearRange((prev) => ({ ...prev, to: year })),
    [],
  );

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = CURRENT_YEAR; y >= MIN_YEAR; y--) {
      years.push(y);
    }
    return years;
  }, []);

  const buildWhereClause = useCallback(
    (yearField: string = "Year", quoted: boolean = false) => {
      const from = quoted ? `'${yearRange.from}'` : String(yearRange.from);
      const to = quoted ? `'${yearRange.to}'` : String(yearRange.to);
      return `${yearField} >= ${from} AND ${yearField} <= ${to}`;
    },
    [yearRange],
  );

  const value = useMemo(
    () => ({
      yearRange,
      setYearRange,
      setFrom,
      setTo,
      buildWhereClause,
      yearOptions,
    }),
    [yearRange, setFrom, setTo, buildWhereClause, yearOptions],
  );

  return (
    <YearFilterContext.Provider value={value}>
      {children}
    </YearFilterContext.Provider>
  );
}

export function useYearFilter(): YearFilterContextValue {
  const ctx = useContext(YearFilterContext);
  if (!ctx) {
    throw new Error("useYearFilter must be used within a YearFilterProvider");
  }
  return ctx;
}
