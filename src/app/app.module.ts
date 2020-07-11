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
import {LoginComponent} from './components/login/login';
import {AlertComponent} from './components/alert/alert';

import {ProjectListComponent, ProjectCreateDialogComponent} from './components/project/project-list';
import {ProjectService, ProjectVersionService} from './services/project.service';
import {RepositoryService} from './services/repository.service';

import {ProjectversionListComponent, ProjectversionDialogComponent} from './components/projectversion/projectversion-list';
import {ProjectversionInfoComponent, DependencyDialogComponent} from './components/projectversion/projectversion-info';
import {ProjectversionRepoListComponent, SourcerepoDialogComponent} from './components/projectversion/projectversion-repo-list';
import {ProjectversionRepoComponent} from './components/projectversion/projectversion-repo-info';

import {BuildListComponent} from './components/build/build-list';
import {BuildDetailComponent} from './components/build/build-detail';
import {BuildService} from './services/build.service';

import {MirrorListComponent, MirrorDialogComponent} from './components/mirror/mirror-list';
import {MirrorDetailComponent} from './components/mirror/mirror-detail';
import {MirrorService} from './services/mirror.service';

import {NodeListComponent} from './components/node/node-list';
import {NodeDetailComponent} from './components/node/node';
import {NodeService} from './services/node.service';

import {UserListComponent, UserDialogComponent} from './components/user/user-list';
import {UserDetailComponent} from './components/user/user-detail';
import {UserService} from './services/user.service';

import {WebsocketService, MoliorService} from './services/websocket';

@NgModule({
    declarations: [
        AppComponent,
        ValidationErrorComponent,

        ProjectListComponent,
        ProjectCreateDialogComponent,

        BuildListComponent,
        BuildDetailComponent,

        MirrorListComponent,
        MirrorDetailComponent,
        MirrorDialogComponent,

        NodeListComponent,
        NodeDetailComponent,

        UserListComponent,
        UserDialogComponent,
        UserDetailComponent,

        AboutComponent,
        LoginComponent,
        AlertComponent,

        ProjectversionListComponent,
        ProjectversionDialogComponent,
        ProjectversionInfoComponent,
        ProjectversionRepoListComponent,
        ProjectversionRepoComponent,
        DependencyDialogComponent,

        SourcerepoDialogComponent,
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
        MatDialogModule
    ],
    providers: [
        WebsocketService,
        MoliorService,
        NodeService,
        BuildService,
        ProjectService,
        ProjectVersionService,
        UserService,
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
                      SourcerepoDialogComponent,
                      UserDialogComponent,
                      DependencyDialogComponent,
                     ],
})
export class AppModule { }
