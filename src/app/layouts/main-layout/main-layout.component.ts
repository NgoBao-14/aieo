import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppUser } from '../../models/app.models';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  readonly user$: Observable<AppUser | null> = this.authService.user$;

  currentSessionId = 0;
  streak = 0;
  bandEstimate = 0;
  mobileMenuOpen = false;

  showQuickDictDrawer = false;
  quickSearchQuery = '';
  quickSearchResult: any = null;
  isQuickSearchLoading = false;
  quickSearchError = false;
  quickSuggestions = ['strategy', 'achieve', 'candidate', 'industry', 'brochure'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private progressService: ProgressService
  ) {}

  ngOnInit(): void {
    const p = this.progressService.getProgress();
    this.currentSessionId = p.currentSessionId;
    this.streak = p.streak;
    this.bandEstimate = p.bandEstimate;
  }

  openQuickDict(suggestedWord?: string): void {
    this.showQuickDictDrawer = true;
    if (suggestedWord) {
      this.quickSearchQuery = suggestedWord;
      this.searchQuickWord();
    }
  }

  closeQuickDict(): void {
    this.showQuickDictDrawer = false;
  }

  selectSuggestion(word: string): void {
    this.quickSearchQuery = word;
    this.searchQuickWord();
  }

  playWordAudio(word: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  async searchQuickWord(): Promise<void> {
    if (!this.quickSearchQuery || !this.quickSearchQuery.trim()) return;
    const query = this.quickSearchQuery.trim().toLowerCase();
    this.isQuickSearchLoading = true;
    this.quickSearchError = false;

    try {
      const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.length > 0) {
          const entry = data[0];
          const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || '';
          const meaningObj = entry.meanings ? entry.meanings[0] : null;
          const pos = meaningObj ? meaningObj.partOfSpeech : 'vocabulary';
          const defObj = meaningObj && meaningObj.definitions ? meaningObj.definitions[0] : null;
          const defEn = defObj ? defObj.definition : '';
          const example = defObj ? defObj.example : '';

          this.quickSearchResult = {
            word: entry.word,
            phonetic: phonetic,
            pos: pos,
            defVi: defEn,
            defEn: defEn,
            example: example || `Use '${entry.word}' in a sentence.`,
            exampleVi: '',
            topic: 'general',
            band: 5
          };
          this.isQuickSearchLoading = false;
          return;
        }
      }
    } catch (e) {
      console.warn('Dictionary API error:', e);
    }

    this.quickSearchResult = null;
    this.quickSearchError = true;
    this.isQuickSearchLoading = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  async login(): Promise<void> {
    await this.authService.loginWithGoogle();
    await this.router.navigate(['/dashboard']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/']);
  }
}
