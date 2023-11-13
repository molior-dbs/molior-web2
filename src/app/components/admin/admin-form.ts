import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-form',
  templateUrl: './admin-form.html',
  styleUrls: ['./admin-form.scss'],
  providers: [DatePipe],
})
export class AdminFormComponent implements OnInit {
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedTime: string = '09:00';
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AdminFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      selectedTime: [this.data.selectedTime, [Validators.required, this.validateTimeFormat]],
    });

    this.weekdays.forEach(day => {
      const initialValue = this.data.weekdaysForm[day] ? this.data.weekdaysForm[day].value : false;
    
      this.form.addControl(day, new FormControl(initialValue));
    });

    console.log('Initial weekdaysForm values:', this.data.weekdaysForm);
  }
  

  ngOnInit() {
    // Optional: You can subscribe to value changes if needed
    this.form.valueChanges.subscribe(value => {
      console.log(value); // Log the form value changes
    });
  }

  // Define a custom validator for time format
  validateTimeFormat(control: any) {
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(control.value) ? null : { invalidTimeFormat: true };
  }

  incrementTime(minutes: number) {
    // Increment the selected time by the specified minutes
    const newTime = this.addMinutes(this.form.value.selectedTime, minutes);
    this.form.patchValue({ selectedTime: newTime });
  }

  decrementTime(minutes: number) {
    // Decrement the selected time by the specified minutes
    const newTime = this.addMinutes(this.form.value.selectedTime, -minutes);
    this.form.patchValue({ selectedTime: newTime });
  }

  save() {
    console.log('Form:', this.form);
    console.log('Form Controls:', this.form.controls);
    console.log('Form Control (Monday):', this.form.get('Monday'));
    if (this.form.valid) {
      this.dialogRef.close({
        selectedTime: this.form.value.selectedTime,
        weekdaysForm: { ...this.form.value },
      });
    }
  }
  private addMinutes(time: string, minutes: number): string {
    const date = new Date();
    const [hours, currentMinutes] = time.split(':').map(Number);
    date.setHours(hours);
    date.setMinutes(currentMinutes + minutes);
    return this.datePipe.transform(date, 'HH:mm') || '';
  }
}