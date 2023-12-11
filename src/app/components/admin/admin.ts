import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdminFormComponent } from './admin-form';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CleanupService, Cleanup } from 'src/app/services/admin.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class AdminComponent implements OnInit{
  formGroup: FormGroup
  cleanupWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    public dialog: MatDialog, 
    private cleanupService: CleanupService,
    public formBuilder: FormBuilder
    ) {
      this.formGroup = this.formBuilder.group({
        cleanupActive: [''],
        cleanupTime: [''],
        cleanupWeekdays: this.formBuilder.array([])
    });

    this.cleanupWeekdays.forEach(day => {
      this.formGroup.addControl(day, this.formBuilder.control(false));
    });
  }

  ngOnInit() {
    this.getCleanupData();

  }

  getCleanupData() {
    this.cleanupService.getAll().subscribe(
      (data: any) => {
        const mappedWeekdays = this.mapWeekdaysToDays(data.cleanup_weekdays);
        this.formGroup.patchValue({
          cleanupActive: data.cleanup_active === 'true',
          cleanupTime: data.cleanup_time,
          ...mappedWeekdays
        });
      },
      (error) =>{
        console.log(error + "Cannot assign the data")
      }
    );
  }

  mapWeekdaysToDays(receivedWeekdays: string[]) {
    const mappedDays = {};

    this.cleanupWeekdays.forEach(day => {
      mappedDays[day] = receivedWeekdays.includes(day);
    });

    return mappedDays;
  }

  openSettingsDialog() {
    const weekdaysForm: { [key: string]: FormControl } = {};
    this.cleanupWeekdays.forEach(day => {
      weekdaysForm[day] = this.formGroup.get(day) as FormControl;
    });

    const cleanupTime = this.formGroup.get('cleanupTime').value;
    const cleanupActive = this.formGroup.get('cleanupActive').value;


    console.log('Cleanup Time:', cleanupTime);
    console.log('Cleanup Active:', cleanupActive);
    console.log('weekdaysForm', weekdaysForm)
    console.log(typeof weekdaysForm);
  
    const dialog = this.dialog.open(AdminFormComponent, {
      width: '400px',
      data: {
        weekdaysForm,
        cleanupTime,
        cleanupActive,
      },
    });

    dialog.afterClosed().subscribe(result => {
      if (result) {
        // Update the component's properties with the values from the dialog result
        console.log('Result',result)
        console.log('Result: active',result.cleanupActive)
        console.log('Result: Cleanupweekdays', result.cleanupWeekdays)

        for (const day in result.cleanupWeekdays) {
          if (result.cleanupWeekdays.hasOwnProperty(day)) {
            const control = this.formGroup.get(day);
            if (control) {
              control.patchValue(result.cleanupWeekdays[day]);
            }
          }
        }

        this.formGroup.patchValue({
          cleanupActive:result.cleanupActive,
          cleanupTime: result.cleanupTime,
        })
      }
    });
  }
}