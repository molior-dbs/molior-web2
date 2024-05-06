import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CleanupService } from 'src/app/services/admin.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-admin-retention-form',
  templateUrl: './admin-retention-form.html',
  styleUrls: ['./admin-form.scss'],
  providers: [ CleanupService ],
})
export class AdminRetentionFormComponent implements OnInit{
  form: FormGroup;
  retentionSuccessfulBuilds: number;
  retentionFailedBuilds: number;
  clicked: boolean;

  constructor(
    public dialog: MatDialogRef<AdminRetentionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected cleanupService: CleanupService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      enableSuccessfulRetention: [this.data.retentionSuccessfulBuilds > 0],
      enableFailedRetention: [this.data.retentionFailedBuilds > 0],
      retentionSuccessfulBuilds: [{ value: this.data.retentionSuccessfulBuilds, disabled: this.data.retentionSuccessfulBuilds === 0 }, [Validators.required]],
      retentionFailedBuilds: [{value: this.data.retentionFailedBuilds, disabled: this.data.retentionFailedBuilds === 0 }, [Validators.required]],
    });
  }

  ngOnInit() {
    if (!this.form.get('enableSuccessfulRetention').value) {
      this.form.get('retentionSuccessfulBuilds').disable();
    }
    if (!this.form.get('enableFailedRetention').value) {
      this.form.get('retentionFailedBuilds').disable();
    }
  }

  save() {
    if (this.form.valid) {
      const formValue = { ...this.form.value };
      if (!this.form.get('retentionSuccessfulBuilds').enabled) {
        formValue.retentionSuccessfulBuilds = 0;
      }
      if (!this.form.get('retentionFailedBuilds').enabled) {
        formValue.retentionFailedBuilds = 0;
      }
      this.cleanupService.editRetentionDetails(
        formValue.retentionSuccessfulBuilds,
        formValue.retentionFailedBuilds).subscribe(
        r => {
          this.dialog.close({
            retentionSuccessfulBuilds: formValue.retentionSuccessfulBuilds,
            retentionFailedBuilds: formValue.retentionFailedBuilds,
          });
        },
        err => {
          this.alertService.error(err.error);
        }      )
      };
    }

  onNoClick(): void {
      this.dialog.close();
  }

  toggleRetention(type: string, enableRetention: boolean): void {
    const controlName = `retention${type.charAt(0).toUpperCase() + type.slice(1)}Builds`;
    const originalValue = this.data[`retention${type.charAt(0).toUpperCase() + type.slice(1)}Builds`];
    if (!enableRetention) {
      this.form.get(controlName).setValue(0);
      this.form.get(controlName).disable();
    } else {
      this.form.get(controlName).setValue(originalValue);
      this.form.get(controlName).enable();
    }
  }
 }
