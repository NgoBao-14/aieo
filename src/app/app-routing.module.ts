import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PracticeListComponent } from './pages/tests/practice-list.component';
import { PracticeDetailComponent } from './pages/test-runner/practice-detail.component';
import { VocabularyComponent } from './pages/vocabulary/vocabulary.component';
import { DictionaryComponent } from './pages/dictionary/dictionary.component';
import { ExerciseHubComponent } from './pages/exercises/exercise-hub.component';
import { ExercisePracticeComponent } from './pages/exercises/practice/exercise-practice.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { TestManagementComponent } from './pages/admin/test-management/test-management.component';
import { TestFormComponent } from './pages/admin/test-management/test-form.component';

const routes: Routes = [
  // ── Learner area — shared sidebar layout ─────────────────────
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '',           component: HomeComponent },
      { path: 'vocabulary', component: VocabularyComponent },
      { path: 'dictionary', component: DictionaryComponent },
      { path: 'exercises',  component: ExerciseHubComponent },
      { path: 'exercises/:skill/:type', component: ExercisePracticeComponent },
      { path: 'tests',      component: PracticeListComponent },
      { path: 'dashboard',  component: DashboardComponent, canActivate: [AuthGuard] },
    ]
  },

  // ── Test runner — full screen, no sidebar ─────────────────────
  { path: 'tests/:testId',    component: PracticeDetailComponent },
  { path: 'practice',         component: PracticeListComponent },
  { path: 'practice/:testId', component: PracticeDetailComponent },

  // ── Admin area ─────────────────────────────────────────────────
  { path: 'admin',                     redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard',           component: AdminDashboardComponent },
  { path: 'admin/tests',               component: TestManagementComponent },
  { path: 'admin/tests/new',           component: TestFormComponent },
  { path: 'admin/tests/:testId/edit',  component: TestFormComponent },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
