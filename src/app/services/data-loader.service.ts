import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, forkJoin, map, Observable, of } from "rxjs";
import { extractJsonFromJsonp, convertToRows, transformData, extractFlatWishesFromJson } from "../utils/google-sheets-parser.utils";

@Injectable({
    providedIn: 'root',
})
export class DataLoaderService {
    private sheetId = "11aiY7cf_RqnCpWvdxxNBg6fzpBz7RWRPgJgI8o9u7ds";
    private baseUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?`;

    constructor(public http: HttpClient) { }

    startLoading(sheetName: string): Observable<Record<string, any>> {
        const requests = [sheetName].map(sheetName => {
            const url = `${this.baseUrl}sheet=${sheetName}`;
            return this.http.get(url, { responseType: 'text' }).pipe(
                map(data => {
                    const jsonData = extractJsonFromJsonp(data);

                    if (!jsonData) {
                        return { sheetName, structuredData: null };
                    }

                    let structuredData: any;
                    // For MaxFrei we want a flat list of wishes directly from the JSON table
                    if (sheetName === 'MaxFrei') {
                        structuredData = extractFlatWishesFromJson(jsonData);
                    } else {
                        const [rows, columns] = convertToRows(jsonData);
                        structuredData = transformData(rows, columns);
                    }

                    return { sheetName, structuredData };
                }),
                catchError(error => {
                    console.error(`Error loading sheet ${sheetName}:`, error);
                    return of({ sheetName, structuredData: null });
                })
            );
        });

        return forkJoin(requests).pipe(
            map(results => {
                const finalData: Record<string, any> = {};
                results.forEach((result: any) => {
                    if (result.sheetName && result.structuredData) {
                        finalData[result.sheetName] = result.structuredData;
                    }
                });
                return finalData;
            })
        );
    }
}
