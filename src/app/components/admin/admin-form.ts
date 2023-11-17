import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { CleanupService } from 'src/app/services/admin.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-admin-form',
  templateUrl: './admin-form.html',
  styleUrls: ['./admin-form.scss'],
  providers: [DatePipe, CleanupService],
})
export class AdminFormComponent implements OnInit {
  cleanupWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  form: FormGroup;
  hoursArray: number[] = Array.from({ length: 24 }, (_, i) => i); // 0-23 for hours
  minutesArray: number[] = Array.from({ length: 60 }, (_, i) => i); // 0-59 for minutes
  cleanupActive: ['false]'];

  constructor(
    private dialogRef: MatDialogRef<AdminFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    protected cleanupService: CleanupService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      selectedHour: [0], // Initialize selectedHour to 0
      selectedMinute: [0], // Initialize selectedMinute to 0
      cleanupTime: [this.data.cleanupTime.toString, [Validators.required, this.validateTimeFormatAsString]],
      cleanupActive: [this.data.cleanupActive]
    });

  
    this.hoursArray = Array.from({ length: 24 }, (_, i) => i);
    this.minutesArray = Array.from({ length: 12 }, (_, i) => i * 5);


    this.cleanupWeekdays.forEach(day => {
      const initialValue = this.data.weekdaysForm[day] ? this.data.weekdaysForm[day].value : false;
      this.form.addControl(day, new FormControl(initialValue));
    });

    console.log('Initial weekdaysForm values:', this.data.weekdaysForm);

    // Check if there's an existing selected time to populate the dropdowns
    if (this.data.cleanupTime) {
      const [selectedHour, selectedMinute] = this.data.cleanupTime.split(':').map(Number);
      this.form.patchValue({ selectedHour, selectedMinute });
    }
  }
  
  ngOnInit() {
    // Optional: You can subscribe to value changes if needed
    this.form.valueChanges.subscribe(value => {
      console.log(value); // Log the form value changes
    });
  }

  validateTimeFormatAsString(control: any) {
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(control.value) ? null : { invalidTimeFormat: true };
  }

  save() {
    console.log('Form:', this.form);
    console.log('Form Controls:', this.form.controls);
    console.log('Form Control (Monday):', this.form.get('Monday'));
    if (this.form.valid) {
      this.cleanupService.edit(this.form.value.cleanupActive, { ...this.form.value }, this.form.value.cleanupTime).subscribe(
        r => {
          this.dialogRef.close();
        },
        err => {
          this.alertService.error(err.error);
        }      )
      this.dialogRef.close({
        cleanupTime: this.form.value.cleanupTime,
        weekdaysForm: { ...this.form.value },
        cleanupActive: this.form.value.cleanupActive,
      });
      this.cleanupService.edit(this.form.value.cleanupActive, this.form.value.cleanupWeekdays, this.form.value.cleanupTime,)
    }
  }

  onHourSelected(hour: number) {
    this.form.patchValue({ selectedHour: +hour });
    this.updateCleanupTime();
  }

  onMinuteSelected(minute: number) {
    this.form.patchValue({ selectedMinute: +minute });
    this.updateCleanupTime();
  }

  private updateCleanupTime() {
    const { selectedHour, selectedMinute } = this.form.value;
    const formattedHour = ('0' + selectedHour).slice(-2); // Format hour with leading zero
    const formattedMinute = ('0' + selectedMinute).slice(-2); // Format minute with leading zero
    const newTime = `${formattedHour}:${formattedMinute}`;
    this.form.patchValue({ cleanupTime: newTime });
  }
}

