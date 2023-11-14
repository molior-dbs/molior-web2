import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdminFormComponent } from './admin-form';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class AdminComponent {
  cleanupWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  cleanupTime: string = '04:00';
  weekdaysForm: { [key: string]: FormControl } = {};
  cleanupActive: boolean = false;

  constructor(private dialog: MatDialog) {
    this.cleanupWeekdays.forEach(day => {
      this.weekdaysForm[day] = new FormControl(false);
    });
  }

  openSettingsDialog() {
    const dialogRef = this.dialog.open(AdminFormComponent, {
      width: '400px',
      data: {
        weekdaysForm: { ...this.weekdaysForm },
        cleanupTime: this.cleanupTime,
        cleanupActive: this.cleanupActive,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update the component's properties with the values from the dialog result
        this.cleanupWeekdays.forEach(day => {
          this.weekdaysForm[day].setValue(result.weekdaysForm[day]);
        });
        this.cleanupTime = result.cleanupTime;
        this.cleanupActive = result.cleanupActive;
      }
    });
  }
}