import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BuildListComponent} from './components/build/build-list';
import {BuildDetailComponent} from './components/build/build-detail';
import {ProjectListComponent} from './components/project/project-list';
import {ProjectversionListComponent} from './components/projectversion/projectversion-list';
import {ProjectversionInfoComponent} from './components/projectversion/projectversion-info';
import {ProjectversionRepoListComponent} from './components/projectversion/projectversion-repo-list';
import {ProjectversionRepoComponent} from './components/projectversion/projectversion-repo-info';
import {MirrorListComponent} from './components/mirror/mirror-list';
import {MirrorDetailComponent} from './components/mirror/mirror-detail';
import {NodeListComponent} from './components/node/node-list';
import {NodeDetailComponent} from './components/node/node';
import {UserListComponent} from './components/user/user-list';
import {UserDetailComponent} from './components/user/user-detail';
import {AboutComponent} from './components/about/about';

import {LoginComponent} from './components/login/login';
import {AuthGuard} from './lib/auth.guard';

const routes: Routes = [
    { path: 'login',                         component: LoginComponent },
    { path: 'builds',                        component: BuildListComponent,      canActivate: [AuthGuard] },
    { path: 'builds/:id',                    component: BuildDetailComponent,    canActivate: [AuthGuard] },
    { path: 'projects',                      component: ProjectListComponent,    canActivate: [AuthGuard] },
    { path: 'project/:name',
        children: [
            { path: '',                      redirectTo: 'versions', pathMatch: 'full' },
            // { path: 'admin',                 component: ProjectComponent,        canActivate: [AuthGuard] },
            { path: 'versions',              component: ProjectversionListComponent, canActivate: [AuthGuard] },
            { path: ':version',
                children: [
                    { path: '',              redirectTo: 'info', pathMatch: 'full' },
                    { path: 'info',          component: ProjectversionInfoComponent,  canActivate: [AuthGuard] },
                    { path: 'repos',         component: ProjectversionRepoListComponent, canActivate: [AuthGuard] },
                    { path: 'repo/:id',
                        children: [
                            { path: '',      component: ProjectversionRepoComponent,  canActivate: [AuthGuard] }
                        ]
                    }
                ]
            }
        ]
    },
    { path: 'mirrors',                       component: MirrorListComponent,     canActivate: [AuthGuard] },
    { path: 'mirror/:name/:version',         component: MirrorDetailComponent,   canActivate: [AuthGuard] },
    { path: 'nodes',                         component: NodeListComponent,       canActivate: [AuthGuard] },
    { path: 'nodes/:name',                   component: NodeDetailComponent,     canActivate: [AuthGuard] },
    { path: 'users',                         component: UserListComponent,       canActivate: [AuthGuard] },
    { path: 'users/:username',               component: UserDetailComponent,     canActivate: [AuthGuard] },
    { path: 'about',                         component: AboutComponent,          canActivate: [AuthGuard] },
    { path: '**', redirectTo: '/builds'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: false})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
