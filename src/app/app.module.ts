import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PracticeListComponent } from './pages/tests/practice-list.component';
import { PracticeDetailComponent } from './pages/test-runner/practice-detail.component';
import { ReadingGroupRendererComponent } from './pages/test-runner/components/reading/reading-group/reading-group-renderer.component';
import { ReadingDetailShellComponent } from './pages/test-runner/components/reading/reading-detail/reading-detail-shell.component';
import { ReadingTemplateGroupComponent } from './pages/test-runner/components/reading/reading-template/reading-template-group.component';
import { ReadingGridGroupComponent } from './pages/test-runner/components/reading/reading-grid/reading-grid-group.component';
import { ReadingHeadingsGroupComponent } from './pages/test-runner/components/reading/reading-headings/reading-headings-group.component';
import { ReadingMultiSelectGroupComponent } from './pages/test-runner/components/reading/reading-multi-select/reading-multi-select-group.component';
import { ReadingChoiceGroupComponent } from './pages/test-runner/components/reading/reading-choice/reading-choice-group.component';
import { ReadingInputGroupComponent } from './pages/test-runner/components/reading/reading-input/reading-input-group.component';
import { ListeningGroupRendererComponent } from './pages/test-runner/components/listening/listening-group/listening-group-renderer.component';
import { ListeningDetailShellComponent } from './pages/test-runner/components/listening/listening-detail/listening-detail-shell.component';
import { ListeningTemplateGroupComponent } from './pages/test-runner/components/listening/listening-template/listening-template-group.component';
import { ListeningGridGroupComponent } from './pages/test-runner/components/listening/listening-grid/listening-grid-group.component';
import { ListeningMultiSelectGroupComponent } from './pages/test-runner/components/listening/listening-multi-select/listening-multi-select-group.component';
import { ListeningChoiceGroupComponent } from './pages/test-runner/components/listening/listening-choice/listening-choice-group.component';
import { ListeningInputGroupComponent } from './pages/test-runner/components/listening/listening-input/listening-input-group.component';
import { TestHeaderComponent } from './pages/test-runner/components/common/test-header.component';
import { TestFooterComponent } from './pages/test-runner/components/common/test-footer.component';
import { AudioPlayerComponent } from './pages/test-runner/components/common/audio-player.component';
import { VocabularyComponent } from './pages/vocabulary/vocabulary.component';
import { DictionaryComponent } from './pages/dictionary/dictionary.component';
import { ExerciseHubComponent } from './pages/exercises/exercise-hub.component';
import { ExercisePracticeComponent } from './pages/exercises/practice/exercise-practice.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    HomeComponent,
    VocabularyComponent,
    DictionaryComponent,
    ExerciseHubComponent,
    ExercisePracticeComponent,
    DashboardComponent,
    PracticeListComponent,
    PracticeDetailComponent,
    ReadingDetailShellComponent,
    ReadingGroupRendererComponent,
    ReadingTemplateGroupComponent,
    ReadingGridGroupComponent,
    ReadingHeadingsGroupComponent,
    ReadingMultiSelectGroupComponent,
    ReadingChoiceGroupComponent,
    ReadingInputGroupComponent,
    ListeningDetailShellComponent,
    ListeningGroupRendererComponent,
    ListeningTemplateGroupComponent,
    ListeningGridGroupComponent,
    ListeningMultiSelectGroupComponent,
    ListeningChoiceGroupComponent,
    ListeningInputGroupComponent,
    TestHeaderComponent,
    TestFooterComponent,
    AudioPlayerComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
