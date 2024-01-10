import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdminFormComponent } from './admin-form';
import { AdminMaintenanceFormComponent } from './admin-maintenance-form';
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
        cleanupWeekdays: this.formBuilder.array([]),
        maintenanceMode: [''],
        maintenanceMessage: [''],
    });

    this.cleanupWeekdays.forEach(day => {
      this.formGroup.addControl(day, this.formBuilder.control(false));
    });
  }

  ngOnInit() {
    this.getCleanupData();
    this.getMaintenanceData();

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

  getMaintenanceData(){
    this.cleanupService.getMaintenanceDetails().subscribe(
      (data: any) => {
        this.formGroup.patchValue({
          maintenanceMode: data.maintenance_mode === 'true',
          maintenanceMessage: data.maintenance_message,
        });
      },
      (error) => {
        console.error('Error fetching maintenance data:', error)
      }
    )
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

  startManualCleanup(){
    this.cleanupService.startManualCleanup().subscribe(
      (response)=> {
        console.log('Manual cleanup started:', response);
      },
      (error) => {
        console.error('Error starting manual cleanup:', error)
      }
    )
  }

  openMaintenanceSettingsDialog() {
    const maintenanceMode = this.formGroup.get('maintenanceMode').value;
    const maintenanceMessage = this.formGroup.get('maintenanceMessage').value;

    const dialog = this.dialog.open(AdminMaintenanceFormComponent, {
      width: '400px',
      data: {
        maintenanceMode,
        maintenanceMessage,
      },
    });

    dialog.afterClosed().subscribe(result => {
      if (result) {
        // Update the component's properties with the values from the dialog result
        this.formGroup.patchValue({
          maintenanceMode: result.maintenanceMode,
          maintenanceMessage: result.maintenanceMessage,
        })
      }
    });
  }
}

@Component({
  selector: 'app-admin-retention',
  templateUrl: './admin-retention.html',
  styleUrls: ['./admin.scss'],
})
export class AdminRetentionComponent {
  formGroup: FormGroup

  }


@Component({
  selector: 'app-admin-maintenance',
  templateUrl: './admin-maintenance.html',
  styleUrls: ['./admin.scss'],
})
export class AdminMaintenanceComponent implements OnInit{

  formGroup: FormGroup

  constructor(
    public dialog: MatDialog,
    private cleanupService: CleanupService,
    public formBuilder: FormBuilder
    ) {
      this.formGroup = this.formBuilder.group({
        maintenanceMode: [''],
        maintenanceMessage: [''],
    });
  }

  ngOnInit() {
    this.getMaintenanceData();

  }

  getMaintenanceData(){
    this.cleanupService.getMaintenanceDetails().subscribe(
      (data: any) => {
        this.formGroup.patchValue({
          maintenanceMode: data.maintenance_mode === 'true',
          maintenanceMessage: data.maintenance_message,
        });
      },
      (error) => {
        console.error('Error fetching maintenance data:', error)
      }
    )
  }

  openMaintenanceSettingsDialog() {
    const maintenanceMode = this.formGroup.get('maintenanceMode').value;
    const maintenanceMessage = this.formGroup.get('maintenanceMessage').value;

    const dialog = this.dialog.open(AdminMaintenanceFormComponent, {
      width: '400px',
      data: {
        maintenanceMode,
        maintenanceMessage,
      },
    });

    dialog.afterClosed().subscribe(result => {
      if (result) {
        // Update the component's properties with the values from the dialog result
        this.formGroup.patchValue({
          maintenanceMode: result.maintenanceMode,
          maintenanceMessage: result.maintenanceMessage,
        })
      }
    });
  }

}
