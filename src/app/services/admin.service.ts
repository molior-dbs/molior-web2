import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TableService } from "../lib/table.datasource";

import {apiURL} from '../lib/url';


export interface Cleanup {
    cleanupActive: string;
    cleanupWeekdays: string;
    cleanupTime: string;
}

@Injectable()
export class CleanupService extends TableService<Cleanup> {
    constructor(protected http: HttpClient) {
        super(http);
    }


edit(cleanupActive: string, cleanupWeekdays: string, cleanupTime: string) {
    return this.http.put(`${apiURL()}/api2/cleanup`,
                         {cleanup_active: cleanupActive, cleanup_weekdays: cleanupWeekdays, cleanup_time: cleanupTime}
                        );

}

}
