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
import { RoadmapComponent } from './pages/roadmap/roadmap.component';
import { SessionDetailComponent } from './pages/roadmap/session/session-detail.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { TestManagementComponent } from './pages/admin/test-management/test-management.component';
import { TestFormComponent } from './pages/admin/test-management/test-form.component';
import { AdminLayoutComponent } from './pages/admin/layout/admin-layout.component';
import { AdminUpgradeComponent } from './pages/admin/upgrade/admin-upgrade.component';

const routes: Routes = [
  // ── Landing page — full width, no sidebar ────────────────────
  { path: '', component: HomeComponent },

  // ── Learner area — shared sidebar layout ─────────────────────
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'vocabulary', component: VocabularyComponent },
      { path: 'dictionary', component: DictionaryComponent },
      { path: 'roadmap',        component: RoadmapComponent },
      { path: 'exercises',      component: ExerciseHubComponent },
      { path: 'exercises/:skill/:type', component: ExercisePracticeComponent },
      { path: 'tests',      component: PracticeListComponent },
      { path: 'dashboard',  component: DashboardComponent },
    ]
  },

  // ── Session detail — full screen, no sidebar (immersive learning) ──
  { path: 'roadmap/:id',      component: SessionDetailComponent },

  // ── Test runner — full screen, no sidebar ─────────────────────
  { path: 'tests/:testId',    component: PracticeDetailComponent },
  { path: 'practice',         component: PracticeListComponent },
  { path: 'practice/:testId', component: PracticeDetailComponent },

  // ── Admin area ─────────────────────────────────────────────────
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'tests', component: TestManagementComponent },
      { path: 'tests/new', component: TestFormComponent },
      { path: 'tests/:testId/edit', component: TestFormComponent },
      { path: 'upgrade', component: AdminUpgradeComponent }
    ]
  },

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
