import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, forkJoin, map, NotFoundError, Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class DataLoaderService {
    private sheetId = "11aiY7cf_RqnCpWvdxxNBg6fzpBz7RWRPgJgI8o9u7ds";
    private sheetNames = ["UI", "Wishes"];
    private baseUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?`;

    constructor(public http: HttpClient) { }

    startLoading(): Observable<any> {
        const requests = this.sheetNames.map(sheetName => {
            const url = `${this.baseUrl}sheet=${sheetName}`;
            return this.http.get(url, { responseType: 'text' }).pipe(
                map(data => {
                    const jsonData = this.extractJsonFromJsonp(data);
                    const [rows, columns] = this.convertToRows(jsonData);
                    const structuredData = this.transformData(rows);
                    return { sheetName, structuredData };
                }),
                catchError(error => {
                    console.error(`Error loading sheet ${sheetName}:`, error);
                    return [];
                })
            );
        });

        return forkJoin(requests).pipe(
            map(results => {
                const finalData: any = {};
                results.forEach((result: any) => {
                    if (result.sheetName && result.structuredData) {
                        finalData[result.sheetName] = result.structuredData;
                    }
                });
                return finalData;
            })
        );
    }

    private extractJsonFromJsonp(jsonpResponse: string): any {
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

    private convertToRows(jsonData: any): any[] {
        if (!jsonData || !jsonData.table || !jsonData.table.rows) {
            console.error("Invalid JSON data format.");
            return [];
        }

        const headers = jsonData.table.cols.map(data => data.id);

        const rows = jsonData.table.rows
            .map((row: any) =>
                row.c.map((cell: any) => (cell && cell.v !== undefined ? cell.v : null))
            )

        return [rows, headers];
    }

    private transformData(rows: any[]): any {
        const structuredData: any = {};
        const columns = rows.shift();
        rows.forEach((row: any) => {
            row.forEach((cell: any, index: number) => {
                const column = columns[index];
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
}
