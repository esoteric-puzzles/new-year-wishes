import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
    private key = "2PACX-1vSt4oJEeQE71w1UYpKMpxNNPFJ7d9fKTlGHSIO0m3m1wTUCWgk19xp35sWfoJwYuUj3cukNbvrMvKbf";
    private link = `https://spreadsheets.google.com/feeds/list/${this.key}/od6/public/values?alt=json`

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public readonly loading$ = this.loadingSubject.asObservable();

    constructor(public http: HttpClient) { }


    startLoading() {
        this.http.get<any>(this.link).subscribe({
            next: (config) => {
                console.log(config);
            },
            error: (err) => {
                console.log("Error happened", err)
            }
        });
    }
}