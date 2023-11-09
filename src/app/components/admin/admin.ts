import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
  providers: [DatePipe] // Register DatePipe as a provider
})
export class AdminComponent  {
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedWeekdays: { [key: string]: boolean } = {};
  selectedTime: string = '04:00';

  constructor(private datePipe: DatePipe) {
    this.weekdays.forEach(day => {
      this.selectedWeekdays[day] = false;
    })
  }

  onTimeInputChange() {
    // Ensure the selectedTime remains in HH:mm format
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(this.selectedTime)) {
      // Reset to the previous valid time value if the input is invalid
      this.selectedTime = '04:00'; // Default time
    }
  }
  incrementTime(minutes: number) {
    const time = new Date();
    const parts = this.selectedTime.split(':');
    time.setHours(parseInt(parts[0], 10));
    time.setMinutes(parseInt(parts[1], 10));
    time.setMinutes(time.getMinutes() + minutes);

    this.selectedTime = this.datePipe.transform(time, 'HH:mm');
  }

  decrementTime(minutes: number) {
    this.incrementTime(-minutes);
  }
}
