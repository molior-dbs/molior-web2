import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TableService } from "../lib/table.datasource";

import {apiURL} from '../lib/url';
import { Data } from "@angular/router";


export interface Cleanup {
    cleanupActive: string;
    cleanupWeekdays: string;
    cleanupTime: string;
}

export interface Maintenance {
    maintenanceMode: boolean;
    maintenanceMessage: string;
}

export interface Retention {
    retentionSuccessfulBuilds: number;
    retentionFailedBuilds: number;
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

getAll() {
    return this.http.get<Cleanup>(`${apiURL()}/api2/cleanup`);
}

startManualCleanup() {
    return this.http.get<Cleanup>(`${apiURL()}/api2/cleanup/config`);
}

getMaintenanceDetails() {
    return this.http.get<Maintenance>(`${apiURL()}/api2/maintenance`);
}

editMaintenanceDetails(maintenanceMode: string, maintenanceMessage: string) {
    return this.http.put(`${apiURL()}/api2/maintenance`,
                        {maintenance_mode: maintenanceMode, maintenance_message: maintenanceMessage}
                        );
}

getRetentionDetails() {
    return this.http.get<Retention>(`${apiURL()}/api2/retention`);
}

editRetentionDetails(retentionSuccessfulBuilds: number, retentionFailedBuilds: number) {
    return this.http.put(`${apiURL()}/api2/retention`,
                        {retention_successful_builds: retentionSuccessfulBuilds, retention_failed_builds: retentionFailedBuilds}
                        );
}

}
