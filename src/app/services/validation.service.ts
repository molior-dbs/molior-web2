import {Component, Input} from '@angular/core';
import {FormGroup, FormControl, AbstractControl} from '@angular/forms';

export const urlregex = /^(?:https?:\/\/)(?:([\w\._-]+)(\.[\w\._-]+)+(:\d+)?)(?:(\/[\w\._-]+))+$/;
export const gitregex = [
    /^(?:https?:\/\/)(?:([\w\._-]+)(\.[\w\._-]+)+(:\d+)?)(?:(\/[\w\._-]+))+$/,
    /^(?:git@)(?:([\w\._-]+)(\.[\w\._-]+)+(:\d+)?):[\w\._-]+(\/[\w\._-]+)+$/,
];

export class ValidationService {

    static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
        const config = {
            required: 'Required',
            minlength: `Minimum length ${validatorValue.requiredLength}`,
            maxlength: `Maximum length ${validatorValue.requiredLength}`,
            invalidName: 'Invalid character in name',
            invalidVersion: 'Invalid character in version',
            invalidValue: 'Invalid value',
            invalidURL: 'Invalid URL',
            invalidEmail: 'Invalid Email',
            invalidGITURL: 'Invalid GIT URL',
        };

        return config[validatorName];
    }

    static nameValidator(control) {
        if (control.value.match(/^[a-zA-Z][a-zA-Z0-9-]*$/)) {
            // FIXME: not end with -
            return null;
        } else {
            return { invalidName: true };
        }
    }

    static versionValidator(control) {
        if (control.value.match(/^[a-zA-Z0-9\.-]*$/)) {
            // FIXME: not start/end with -
            return null;
        } else {
            return { invalidVersion: true };
        }
    }

    static httpValidator(control) {
        if (control.value.match(urlregex)) {
            return null;
        } else {
            return { invalidURL: true };
        }
    }

    static gitValidator(control) {
        for (const regex of gitregex) {
            if (control.value.match(regex) !== null) {
                return null; // valid
            }
        }
        return { invalidGITURL: true };
    }

    static emailValidator(control) {
        if (! control.value) {
            return null;
        } else if (control.value.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)) {
            return null;
        } else {
            return { invalidEmail: true };
        }
    }

    static minLengthArray(min: number) {
        return (c: AbstractControl): {[key: string]: any} => {
            if (c.value.length >= min) {
                return null;
            }
            return {minLengthArray: {valid: false }};
        };
    }
}


@Component({
    selector: 'app-validation-error',
    template: `<div style="float: right; color: red;" *ngIf="errorMessage !== null">{{errorMessage}}</div>`
})
export class ValidationErrorComponent {
    @Input() control: FormControl;
    constructor() {
    }

    get errorMessage() {
        for (const propertyName in this.control.errors) {
            if (this.control.errors.hasOwnProperty(propertyName) && this.control.touched) {
                return ValidationService.getValidatorErrorMessage(propertyName, this.control.errors[propertyName]);
            }
        }
        return null;
    }
}
