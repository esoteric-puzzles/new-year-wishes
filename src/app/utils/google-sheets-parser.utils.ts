import { GoogleSheetsResponse, GoogleSheetTable, GoogleSheetRow, GoogleSheetCell } from "../models/google-sheets.model";

export function extractJsonFromJsonp(jsonpResponse: string): GoogleSheetsResponse | null {
    const payloadExtractRegex = /google\.visualization\.Query\.setResponse\((.*)\);/;
    const match = jsonpResponse.match(payloadExtractRegex);

    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (error) {
            console.error("Error parsing extracted JSON:", error);
        }
    }
    console.error("Failed to extract JSON from JSONP response.");
    return null;
}

export function convertToRows(jsonData: GoogleSheetsResponse): [any[][], string[]] {
    if (!jsonData || !jsonData.table || !jsonData.table.rows) {
        console.error("Invalid JSON data format.");
        return [[], []];
    }

    const headers = jsonData.table.cols.map(data => data.id || data.label || '');

    const rows = jsonData.table.rows
        .map((row: GoogleSheetRow) =>
            row.c.map((cell: GoogleSheetCell | null) => (cell && cell.v !== undefined ? cell.v : null))
        );

    return [rows, headers];
}

/**
 * @param rows - raw data rows with values
 * @param columns - header definitions (conceptually, though here we used ids)
 */
export function transformData(rows: any[][], columns?: string[]): any {
    if (!rows || rows.length === 0) {
        console.warn("No rows found in sheet.");
        return {};
    }

    // Special case: sheet has a single row of wishes (no header row)
    // This logic seems specific to original implementation where single row meant 
    // "list of things" mapped by index.
    if (rows.length === 1) {
        const singleRow = rows[0];
        const structuredSingle: any = {};
        singleRow.forEach((cell: any, index: number) => {
            if (cell != null) {
                // Use 1-based numeric keys: "1", "2", "3", ...
                structuredSingle[String(index + 1)] = cell;
            }
        });
        return structuredSingle;
    }

    const structuredData: any = {};

    const headerRow = rows.shift(); // The original logic took the first data row as headers
    if (!headerRow) return {};

    rows.forEach((row: any[]) => {
        row.forEach((cell: any, index: number) => {
            const column = headerRow[index];
            if (column != null && cell != null) {
                if (structuredData[column]) {
                    if (Array.isArray(structuredData[column])) {
                        structuredData[column].push(cell);
                    } else {
                        structuredData[column] = [structuredData[column], cell];
                    }
                } else {
                    structuredData[column] = cell;
                }
            }
        });
    });
    return structuredData;
}

/**
 * Flattens wishes from the raw JSON table into a simple list.
 * For MaxFrei, wishes actually live in the column metadata (headers), while the single data
 * row contains numeric ids. We therefore:
 *  1) Prefer long, text-like column labels as wishes.
 *  2) Fall back to scanning row cells if needed.
 */
export function extractFlatWishesFromJson(jsonData: GoogleSheetsResponse): string[] {
    const wishes: string[] = [];

    if (!jsonData || !jsonData.table) {
        console.warn("No table in JSON data for flat wishes.");
        return wishes;
    }

    const table = jsonData.table;

    // 1) Try to read wishes from column labels (headers)
    // Sometimes the first "row" is treated as labels by the visualization API if not explicitly handled
    const cols = Array.isArray(table.cols) ? table.cols : [];

    const isSentenceLike = (value: string) =>
        value && (value.length >= 5 || value.includes(' '));

    cols.forEach((col: any) => {
        const label = (col && col.label != null) ? String(col.label).trim() : '';
        // If the header looks like a real wish (and not just "A", "B" or empty), include it
        if (isSentenceLike(label)) {
            wishes.push(label);
        }
    });

    // 2) Scan rows for all textual cells
    if (Array.isArray(table.rows)) {
        table.rows.forEach((row: GoogleSheetRow) => {
            if (!row || !Array.isArray(row.c)) {
                return;
            }
            row.c.forEach((cell: GoogleSheetCell | null) => {
                if (!cell) {
                    return;
                }

                // Prefer the raw value, fall back to formatted value
                let v: any = cell.v;
                if (v === undefined || v === null) {
                    v = cell.f;
                }

                if (v === undefined || v === null) {
                    return;
                }

                const text = String(v).trim();
                if (text) {
                    wishes.push(text);
                }
            });
        });
    }

    return wishes;
}
