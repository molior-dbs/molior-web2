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
export class AdminRetentionFormComponent {
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
      retentionSuccessfulBuilds: [this.data.retentionSuccessfulBuilds, [Validators.required, Validators.min(1), Validators.max(5)]],
      retentionFailedBuilds: [this.data.retentionFailedBuilds, [Validators.required, Validators.min(7)]],
    });
  }

  save() {
    if (this.form.valid) {
      this.cleanupService.editRetentionDetails(
        this.form.value.retentionSuccessfulBuilds,
        this.form.value.retentionFailedBuilds).subscribe(
        r => {
          this.dialog.close({
            retentionSuccessfulBuilds: this.form.value.retentionSuccessfulBuilds,
            retentionFailedBuilds: this.form.value.retentionFailedBuilds,
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
 }
