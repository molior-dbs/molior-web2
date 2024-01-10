import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule, MatListModule, MatPaginatorModule, MatSidenavModule,
         MatTableModule, MatToolbarModule, MatSelectModule, MatCheckboxModule,
         MatAutocompleteModule, MatStepperModule,
         MatDialogRef, MAT_DIALOG_DATA,
       } from '@angular/material';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';


import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// molior-web
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';

import {ValidationService, ValidationErrorComponent} from './services/validation.service';
import {AboutComponent} from './components/about/about';
import {AdminComponent, AdminRetentionComponent} from './components/admin/admin';
import { AdminMaintenanceComponent } from './components/admin/admin';
import { AdminFormComponent } from './components/admin/admin-form';
import { AdminMaintenanceFormComponent } from './components/admin/admin-maintenance-form';
import {LoginComponent} from './components/login/login';
import {AlertComponent} from './components/alert/alert';

import {ProjectListComponent, ProjectCreateDialogComponent, ProjectDeleteDialogComponent} from './components/project/project-list';
import {ProjectService, ProjectVersionService} from './services/project.service';
import {RepositoryService} from './services/repository.service';
import { CleanupService } from './services/admin.service';

import {ProjectInfoComponent, ProjectversionDialogComponent, ProjectversionDeleteDialogComponent,
    ProjectversionLockDialogComponent, ProjectversionOverlayDialogComponent, ProjectversionSnapshotDialogComponent,
    ProjectversionBuilduploadDialogComponent, ProjectversionS3DialogComponent
        } from './components/project/project-info';
import {ProjectPermissionsComponent, ProjectPermissionDialogComponent,
        ProjectPermissionDeleteDialogComponent} from './components/project/project-permissions';
import {ProjectTokensComponent, ProjectTokenDialogComponent, ProjectTokenDeleteDialogComponent} from './components/project/project-tokens';
import {ProjectversionInfoComponent, DependencyDialogComponent,
        DependencyDeleteDialogComponent} from './components/projectversion/projectversion-info';
import {ProjectversionRepoListComponent, SourcerepoDialogComponent, SourcerepoRemoveDialogComponent,
       } from './components/projectversion/projectversion-repo-list';
import {TriggerBuildDialogComponent, SourcerepoRecloneDialogComponent} from './components/repo/repo-list';
import {ProjectversionRepoComponent, HookDialogComponent,
        HookDeleteDialogComponent} from './components/projectversion/projectversion-repo-info';
import {ProjectversionBuildListComponent, ProjectversionRetentionEditDialogComponent} from './components/projectversion/projectversion-build-list';
import {ProjectversionAPTSourcesComponent} from './components/projectversion/projectversion-aptsources';
import {ProjectversionDependentsComponent} from './components/projectversion/projectversion-dependents';
import {ProjectversionPermissionsComponent} from './components/projectversion/projectversion-permissions';

import {BuildTableComponent} from './components/build/build-table';
import {BuildListComponent, BuildDeleteDialogComponent, BuildRebuildDialogComponent,
        BuildAbortDialogComponent} from './components/build/build-list';
import {BuildInfoComponent} from './components/build/build-info';
import {BuildService} from './services/build.service';

import {MirrorListComponent, MirrorDialogComponent, MirrorCopyDialogComponent,
        MirrorDeleteDialogComponent} from './components/mirror/mirror-list';
import {MirrorAPTSourcesComponent} from './components/mirror/mirror-aptsources';
import {MirrorInfoComponent} from './components/mirror/mirror-info';
import {MirrorService} from './services/mirror.service';

import {RepositoryListComponent, RepositoryDialogComponent,
        RepoMergeDialogComponent, RepoDeleteDialogComponent} from './components/repo/repo-list';
import {RepositoryInfoComponent} from './components/repo/repo-info';
import {RepositoryBuildsComponent} from './components/repo/repo-builds';

import {NodeListComponent} from './components/node/node-list';
import {NodeInfoComponent} from './components/node/node-info';
import {NodeService} from './services/node.service';

import {UserListComponent, UserDialogComponent, UserDeleteDialogComponent} from './components/user/user-list';
import {UserInfoComponent} from './components/user/user-info';
import {UserService, TokenService} from './services/user.service';

import {TokenListComponent, TokenDialogComponent, TokenDeleteDialogComponent} from './components/account/token-list';

import {WebsocketService, MoliorService} from './services/websocket';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from './components/maintenance/maintenance';

@NgModule({
    declarations: [
        AppComponent,
        ValidationErrorComponent,

        ProjectListComponent,
        ProjectCreateDialogComponent,

        BuildTableComponent,
        BuildListComponent,
        BuildDeleteDialogComponent,
        BuildRebuildDialogComponent,
        BuildAbortDialogComponent,
        BuildInfoComponent,

        MaintenanceComponent,

        MirrorListComponent,
        MirrorInfoComponent,
        MirrorDialogComponent,
        MirrorCopyDialogComponent,
        MirrorDeleteDialogComponent,
        MirrorAPTSourcesComponent,

        RepositoryListComponent,
        RepositoryInfoComponent,
        RepositoryDialogComponent,
        RepoMergeDialogComponent,
        RepoDeleteDialogComponent,

        RepositoryBuildsComponent,

        NodeListComponent,
        NodeInfoComponent,

        UserListComponent,
        UserDialogComponent,
        UserDeleteDialogComponent,
        UserInfoComponent,

        AboutComponent,
        AdminComponent,
        AdminRetentionComponent,
        AdminMaintenanceComponent,
        AdminFormComponent,
        AdminMaintenanceFormComponent,
        LoginComponent,
        AlertComponent,

        ProjectInfoComponent,
        ProjectPermissionDialogComponent,
        ProjectPermissionDeleteDialogComponent,
        ProjectPermissionsComponent,
        ProjectTokenDialogComponent,
        ProjectTokenDeleteDialogComponent,
        ProjectTokensComponent,
        ProjectversionDialogComponent,
        ProjectversionInfoComponent,
        ProjectversionRepoListComponent,
        ProjectversionRepoComponent,
        DependencyDialogComponent,
        DependencyDeleteDialogComponent,
        ProjectDeleteDialogComponent,
        ProjectversionRetentionEditDialogComponent,
        ProjectversionDeleteDialogComponent,
        ProjectversionLockDialogComponent,
        ProjectversionOverlayDialogComponent,
        ProjectversionSnapshotDialogComponent,
        ProjectversionBuilduploadDialogComponent,
        ProjectversionS3DialogComponent,
        ProjectversionBuildListComponent,
        ProjectversionAPTSourcesComponent,
        ProjectversionDependentsComponent,
        ProjectversionPermissionsComponent,

        SourcerepoDialogComponent,
        SourcerepoRemoveDialogComponent,
        SourcerepoRecloneDialogComponent,
        TriggerBuildDialogComponent,
        HookDialogComponent,
        HookDeleteDialogComponent,

        TokenListComponent,
        TokenDialogComponent,
        TokenDeleteDialogComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,

        FormsModule,
        ReactiveFormsModule,

        AppRoutingModule,
        HttpClientModule,

        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTabsModule,
        MatSidenavModule,
        MatListModule,
        MatToolbarModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatDialogModule,
        MatCheckboxModule,
        MatAutocompleteModule,
        MatStepperModule,
        MatRadioModule,
        MatDialogModule,
        CommonModule
    ],
    providers: [
        WebsocketService,
        MoliorService,
        NodeService,
        BuildService,
        ProjectService,
        ProjectVersionService,
        CleanupService,
        UserService,
        TokenService,
        MirrorService,
        ValidationService,
        RepositoryService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],

    entryComponents: [ProjectCreateDialogComponent,
                      ProjectversionDialogComponent,
                      MirrorDialogComponent,
                      MirrorCopyDialogComponent,
                      MirrorDeleteDialogComponent,
                      RepositoryDialogComponent,
                      RepoMergeDialogComponent,
                      RepoDeleteDialogComponent,
                      SourcerepoDialogComponent,
                      SourcerepoRemoveDialogComponent,
                      SourcerepoRecloneDialogComponent,
                      TriggerBuildDialogComponent,
                      HookDialogComponent,
                      HookDeleteDialogComponent,
                      UserDialogComponent,
                      UserDeleteDialogComponent,
                      DependencyDialogComponent,
                      DependencyDeleteDialogComponent,
                      ProjectversionLockDialogComponent,
                      ProjectversionOverlayDialogComponent,
                      ProjectversionSnapshotDialogComponent,
                      ProjectversionBuilduploadDialogComponent,
                      ProjectversionS3DialogComponent,
                      ProjectversionRetentionEditDialogComponent,
                      ProjectDeleteDialogComponent,
                      ProjectversionDeleteDialogComponent,
                      ProjectPermissionDialogComponent,
                      ProjectPermissionDeleteDialogComponent,
                      ProjectTokenDialogComponent,
                      ProjectTokenDeleteDialogComponent,
                      TokenDialogComponent,
                      TokenDeleteDialogComponent,
                      BuildDeleteDialogComponent,
                      BuildRebuildDialogComponent,
                      BuildAbortDialogComponent,
                      AdminFormComponent,
                      AdminMaintenanceFormComponent,
                     ],
})
export class AppModule { }
