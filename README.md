# Ielts9s

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.11.

## Current product structure

The source is now organized around the initial product priorities from `ielts9s_plan.html`:

- `src/app/pages/home`: landing page with its own shell
- `src/app/pages/vocabulary`: vocabulary page owns its own layout and UI
- `src/app/pages/dictionary`: dictionary page owns its own layout and UI
- `src/app/pages/exercises`: exercise-by-question-type page
- `src/app/pages/tests`: full-test library page
- `src/app/pages/test-runner`: full-test runner page
- `src/app/pages/dashboard`: signed-in dashboard page
- `src/app/pages/admin`: standalone admin pages

There is no shared public/private layout layer anymore. Each page is responsible for its own shell and navigation so page ownership stays explicit, even when some UI patterns repeat.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
