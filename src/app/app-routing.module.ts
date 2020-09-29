import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BuildListComponent} from './components/build/build-list';
import {BuildInfoComponent} from './components/build/build-info';
import {ProjectListComponent} from './components/project/project-list';
import {ProjectInfoComponent} from './components/projectversion/projectinfo';
import {ProjectversionInfoComponent} from './components/projectversion/projectversion-info';
import {ProjectversionRepoListComponent} from './components/projectversion/projectversion-repo-list';
import {ProjectversionRepoComponent} from './components/projectversion/projectversion-repo-info';
import {ProjectversionBuildListComponent} from './components/projectversion/projectversion-build-list';
import {MirrorListComponent} from './components/mirror/mirror-list';
import {MirrorInfoComponent} from './components/mirror/mirror-info';
import {RepositoryListComponent} from './components/repo/repo-list';
import {RepositoryInfoComponent} from './components/repo/repo-info';
import {NodeListComponent} from './components/node/node-list';
import {NodeInfoComponent} from './components/node/node-info';
import {UserListComponent} from './components/user/user-list';
import {UserInfoComponent} from './components/user/user-info';
import {AboutComponent} from './components/about/about';

import {LoginComponent} from './components/login/login';
import {AuthGuard} from './lib/auth.guard';

const routes: Routes = [
    { path: 'login',                         component: LoginComponent },
    { path: 'builds',                        component: BuildListComponent,      canActivate: [AuthGuard] },
    { path: 'build/:id',                     component: BuildInfoComponent,    canActivate: [AuthGuard] },
    { path: 'projects',                      component: ProjectListComponent,    canActivate: [AuthGuard] },
    { path: 'project/:name',
        children: [
            { path: '',                      redirectTo: 'versions', pathMatch: 'full' },
            // { path: 'admin',                 component: ProjectComponent,        canActivate: [AuthGuard] },
            { path: 'versions',              component: ProjectInfoComponent, canActivate: [AuthGuard] },
            { path: ':version',
                children: [
                    { path: '',              redirectTo: 'info', pathMatch: 'full' },
                    { path: 'info',          component: ProjectversionInfoComponent,  canActivate: [AuthGuard] },
                    { path: 'builds',        component: ProjectversionBuildListComponent, canActivate: [AuthGuard] },
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
    { path: 'mirror/:name/:version',         component: MirrorInfoComponent,   canActivate: [AuthGuard] },
    { path: 'repos',                         component: RepositoryListComponent,     canActivate: [AuthGuard] },
    { path: 'repo/:id',                      component: RepositoryInfoComponent,   canActivate: [AuthGuard] },
    { path: 'nodes',                         component: NodeListComponent,       canActivate: [AuthGuard] },
    { path: 'nodes/:name',                   component: NodeInfoComponent,     canActivate: [AuthGuard] },
    { path: 'users',                         component: UserListComponent,       canActivate: [AuthGuard] },
    { path: 'users/:username',               component: UserInfoComponent,     canActivate: [AuthGuard] },
    { path: 'about',                         component: AboutComponent,          canActivate: [AuthGuard] },
    { path: '**', redirectTo: '/builds'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: false})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
