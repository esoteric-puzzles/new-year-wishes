export interface GoogleSheetCell {
    v?: string | number | null; // Value
    f?: string;                 // Formatted value
}

export interface GoogleSheetRow {
    c: (GoogleSheetCell | null)[];
}

export interface GoogleSheetCol {
    id: string;
    label: string;
    type: string;
}

export interface GoogleSheetTable {
    cols: GoogleSheetCol[];
    rows: GoogleSheetRow[];
    parsedNumHeaders?: number;
}

export interface GoogleSheetsResponse {
    version: string;
    reqId: string;
    status: string;
    sig: string;
    table: GoogleSheetTable;
}
