import {Component, Input} from '@angular/core';
import {FormGroup, FormControl, AbstractControl} from '@angular/forms';

export const urlregex = '^(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';

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
        };

        return config[validatorName];
    }

    static nameValidator(control) {
        if (control.value.match(/^[a-z][a-z0-9-]*$/)) {
            // FIXME: not end with -
            return null;
        } else {
            return { invalidName: true };
        }
    }

    static versionValidator(control) {
        if (control.value.match(/^[a-z0-9\.-]*$/)) {
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
