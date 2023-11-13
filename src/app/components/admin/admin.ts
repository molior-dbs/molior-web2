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
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedTime: string = '04:00';
  weekdaysForm: { [key: string]: FormControl } = {};

  constructor(private dialog: MatDialog) {
    this.weekdays.forEach(day => {
      this.weekdaysForm[day] = new FormControl(false);
    });
  }

  openSettingsDialog() {
    const dialogRef = this.dialog.open(AdminFormComponent, {
      width: '400px',
      data: {
        weekdaysForm: { ...this.weekdaysForm },
        selectedTime: this.selectedTime,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update the component's properties with the values from the dialog result
        this.weekdays.forEach(day => {
          this.weekdaysForm[day].setValue(result.weekdaysForm[day]);
        });
        this.selectedTime = result.selectedTime;
      }
    });
  }
}