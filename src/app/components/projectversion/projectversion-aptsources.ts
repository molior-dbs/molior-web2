import {Component} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';

import {ProjectVersion, ProjectVersionService} from '../../services/project.service';


@Component({
    selector: 'app-projectversion-aptsources',
    templateUrl: './projectversion-aptsources.html',
    styleUrls: ['./projectversion-aptsources.scss']
})
export class ProjectversionAPTSourcesComponent {
    projectversion: ProjectVersion;
    aptSources: string;
    aptSourcesCI: string;

    constructor(protected route: ActivatedRoute,
                protected router: Router,
                protected projectversionService: ProjectVersionService
                ) {
        this.projectversion = {id: -1, name: '', is_locked: false,
                               project_name: '',
                               apt_url: '', architectures: [], basemirror: '', is_mirror: false, description: '',
                               dependency_policy: 'strict', ci_builds_enabled: false, dependency_ids: [], dependent_ids: [],
                               projectversiontype: 'regular'};
        this.aptSources = '';
        this.aptSourcesCI = '';
        this.route.paramMap.subscribe((params: ParamMap) => {
            const projectName = params.get('name');
            const projectVersion = params.get('version');
            this.projectversionService.get( projectName, projectVersion).subscribe((r: ProjectVersion) => this.projectversion = r);
            this.projectversionService.get_apt_sources(projectName, projectVersion).subscribe((r: string) => this.aptSources = r);
            this.projectversionService.get_apt_sources(projectName, projectVersion, true).subscribe((r: string) => this.aptSourcesCI = r);
        });
    }

    getAPTSources(ci: boolean = false) {
        let sources = '';
        let aptsources = this.aptSources;
        if (ci) {
            aptsources = this.aptSourcesCI;
        }
        const lines = aptsources.split('\n');
        lines.pop();  // get rid of last empty line
        for (const line of lines) {
            if (line.startsWith('#')) {
                sources += `<span>${line}\n</span>`;
            } else if (line.startsWith('deb ')) {
                const it = line.split(' ');
                const components = it.slice(3).join(' ')
                sources += '<strong class="debsource">';
                sources += `<span>${it[0]}</span> <span>${it[1]}</span> <span>${it[2]}</span> <span>${components}</span>`;
                sources += '</strong>\n';
            } else {
                sources += line + '\n';
            }
        }
        return sources;
    }
}
