import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BuildListComponent} from './components/build/build-list';
import {BuildInfoComponent} from './components/build/build-info';
import {ProjectListComponent} from './components/project/project-list';
import {ProjectInfoComponent} from './components/project/project-info';
import {ProjectPermissionsComponent} from './components/project/project-permissions';
import {ProjectTokensComponent} from './components/project/project-tokens';
import {ProjectversionInfoComponent} from './components/projectversion/projectversion-info';
import {ProjectversionRepoListComponent} from './components/projectversion/projectversion-repo-list';
import {ProjectversionRepoComponent} from './components/projectversion/projectversion-repo-info';
import {ProjectversionBuildListComponent} from './components/projectversion/projectversion-build-list';
import {ProjectversionAPTSourcesComponent} from './components/projectversion/projectversion-aptsources';
import {ProjectversionDependentsComponent} from './components/projectversion/projectversion-dependents';
import {ProjectversionPermissionsComponent} from './components/projectversion/projectversion-permissions';
import {MirrorListComponent} from './components/mirror/mirror-list';
import {MirrorInfoComponent} from './components/mirror/mirror-info';
import {MirrorAPTSourcesComponent} from './components/mirror/mirror-aptsources';
import {RepositoryListComponent} from './components/repo/repo-list';
import {RepositoryInfoComponent} from './components/repo/repo-info';
import {RepositoryBuildsComponent} from './components/repo/repo-builds';
import {NodeListComponent} from './components/node/node-list';
import {NodeInfoComponent} from './components/node/node-info';
import {UserListComponent} from './components/user/user-list';
import {UserInfoComponent} from './components/user/user-info';
import {TokenListComponent} from './components/account/token-list';
import {AboutComponent} from './components/about/about';
import {AdminComponent} from './components/admin/admin';

import {LoginComponent} from './components/login/login';
import {AuthGuard} from './lib/auth.guard';

const routes: Routes = [
    { path: 'login',                         component: LoginComponent },
    { path: 'builds',                        component: BuildListComponent,      canActivate: [AuthGuard] },
    { path: 'build/:id',                     component: BuildInfoComponent,      canActivate: [AuthGuard] },
    { path: 'projects',                      component: ProjectListComponent,    canActivate: [AuthGuard] },
    { path: 'project/:name',
        children: [
            { path: '',                      redirectTo: 'versions', pathMatch: 'full' },
            { path: 'versions',              component: ProjectInfoComponent,    canActivate: [AuthGuard] },
            { path: 'permissions',           component: ProjectPermissionsComponent,        canActivate: [AuthGuard] },
            { path: 'tokens',                component: ProjectTokensComponent,        canActivate: [AuthGuard] },
            { path: ':version',
                children: [
                    { path: '',              redirectTo: 'info', pathMatch: 'full' },
                    { path: 'info',          component: ProjectversionInfoComponent,        canActivate: [AuthGuard] },
                    { path: 'builds',        component: ProjectversionBuildListComponent,   canActivate: [AuthGuard] },
                    { path: 'repos',         component: ProjectversionRepoListComponent,    canActivate: [AuthGuard] },
                    { path: 'repo/:id',
                        children: [
                            { path: '',      component: ProjectversionRepoComponent,        canActivate: [AuthGuard] }
                        ]
                    },
                    { path: 'aptsources',    component: ProjectversionAPTSourcesComponent,  canActivate: [AuthGuard] },
                    { path: 'dependents',    component: ProjectversionDependentsComponent,  canActivate: [AuthGuard] },
                    { path: 'permissions',   component: ProjectversionPermissionsComponent, canActivate: [AuthGuard] },
                ]
            },
        ]
    },
    { path: 'mirrors',                       component: MirrorListComponent,     canActivate: [AuthGuard] },
    { path: 'mirror/:name/:version',         component: MirrorInfoComponent,     canActivate: [AuthGuard] },
    { path: 'mirror/:name/:version/aptsources', component: MirrorAPTSourcesComponent, canActivate: [AuthGuard] },
    { path: 'repos',                         component: RepositoryListComponent, canActivate: [AuthGuard] },
    { path: 'repo/:id',
        children: [
            { path: '',                      redirectTo: 'info', pathMatch: 'full' },
            { path: 'info',                  component: RepositoryInfoComponent, canActivate: [AuthGuard] },
            { path: 'builds',                component: RepositoryBuildsComponent, canActivate: [AuthGuard] },
        ]
    },
    { path: 'nodes',                         component: NodeListComponent,       canActivate: [AuthGuard] },
    { path: 'nodes/:machine_id',             component: NodeInfoComponent,       canActivate: [AuthGuard] },
    { path: 'users',                         component: UserListComponent,       canActivate: [AuthGuard] },
    { path: 'users/:username',               component: UserInfoComponent,       canActivate: [AuthGuard] },
    { path: 'tokens',                        component: TokenListComponent,      canActivate: [AuthGuard] },
    { path: 'about',                         component: AboutComponent,          canActivate: [AuthGuard] },
    { path: 'admin',                         component: AdminComponent,          canActivate: [AuthGuard] },
    { path: '**', redirectTo: '/builds'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: false})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
