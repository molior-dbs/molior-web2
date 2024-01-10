import { Component, OnInit } from '@angular/core';
import { CleanupService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.html',
  styleUrls: ['./maintenance.scss'],
})
export class MaintenanceComponent implements OnInit {
  maintenanceMessage: string = '';

  constructor(private cleanupService: CleanupService) { }

  ngOnInit(): void {
    //this.maintenanceMessage = 'Test Message';
    this.getMaintenanceMessage();
  }

  getMaintenanceMessage() {
    this.cleanupService.getMaintenanceDetails().subscribe(
      (data: any) => {
        this.maintenanceMessage = data.maintenance_message;
      },
      (error) => {
        console.error('Error fetching maintenance message:', error);
        // Handle error, e.g., show a default message or redirect to another page
      }
    );
  }
}