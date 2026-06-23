import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PracticeStoreService } from '../../core/services/practice-store.service';
import { TestDataService } from '../../core/services/test-data.service';
import { QuestionGroup, Submission, Test, TestPart } from '../../models/app.models';
import { HeadingChoice, PreparedGroup, TemplateSegment } from './practice-detail.models';

@Component({
  selector: 'app-practice-detail',
  templateUrl: './practice-detail.component.html',
  styleUrls: ['./practice-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PracticeDetailComponent implements OnInit, OnDestroy {
  test: Test | null = null;
  result: Submission | null = null;
  loading = true;
  timeLeft = 3600;
  timeSpent = 0;
  showResultOverlay = false;
  answers: Record<string, string> = {};
  activePartIndex = 0;
  currentQId = 1;
  leftWidth = 52;
  showHighlightMenu = false;
  selectionText = '';
  menuPos: { x: number; y: number } | null = null;
  selectionRange: Range | null = null;
  renderedPassageHtml = '';
  allQuestionIds: number[] = [];
  partRanges: Array<{ min: number; max: number; total: number }> = [];
  partProgress: Record<string, { filled: number; total: number }> = {};
  activeGroups: PreparedGroup[] = [];
  currentDraggedValue = '';
  hoveredGapId: string | null = null;

  private readonly subscriptions = new Subscription();
  private timerId: number | null = null;
  private resizing = false;
  private readonly handleMouseMove = (event: MouseEvent) => {
    if (!this.resizing) {
      return;
    }

    const nextWidth = (event.clientX / window.innerWidth) * 100;
    if (nextWidth > 20 && nextWidth < 80) {
      this.leftWidth = nextWidth;
    }
  };
  private readonly handleTouchMove = (event: TouchEvent) => {
    if (!this.resizing) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const nextWidth = (touch.clientX / window.innerWidth) * 100;
    if (nextWidth > 20 && nextWidth < 80) {
      this.leftWidth = nextWidth;
    }
  };
  private readonly stopResizing = () => {
    this.resizing = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.stopResizing);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private practiceStoreService: PracticeStoreService,
    private testDataService: TestDataService
  ) {}

  ngOnInit(): void {
    const testId = this.route.snapshot.paramMap.get('testId');
    if (!testId) {
      void this.router.navigate(['/tests']);
      return;
    }

    this.practiceStoreService.startTest(testId);
    this.subscriptions.add(
      this.practiceStoreService.state$.subscribe((state) => {
        this.answers = state.answers;
        this.rebuildPartProgress();
        this.updateRenderedPassageHtml();
      })
    );

    this.subscriptions.add(
      this.testDataService.getTestById(testId).subscribe((test) => {
        this.test = test;
        this.partRanges = test ? test.parts.map((part) => this.getPartRange(part)) : [];
        this.allQuestionIds = test
          ? test.parts
              .flatMap((part) => part.questionGroups)
              .flatMap((group) => group.questions.map((question) => question.id))
              .sort((left, right) => left - right)
          : [];
        this.rebuildPartProgress();
        this.rebuildActiveGroups();
        this.updateRenderedPassageHtml();
        this.loading = false;
        this.currentQId = this.allQuestionIds[0] ?? 1;
        this.timeLeft = this.getDurationInSeconds(test);
        this.startTimer();
      })
    );
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
    this.stopResizing();
    this.practiceStoreService.clearTest();
    this.subscriptions.unsubscribe();
  }

  get activePart(): TestPart | null {
    return this.test?.parts[this.activePartIndex] ?? null;
  }

  get enableReadingAssist(): boolean {
    return this.test?.skill === 'Reading';
  }

  get isListeningTest(): boolean {
    return this.test?.skill === 'Listening';
  }

  setActivePart(index: number): void {
    this.activePartIndex = index;
    this.rebuildActiveGroups();
    this.updateRenderedPassageHtml();
    this.currentQId = this.partRanges[index]?.min ?? this.currentQId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setAnswer(questionId: number, value: string): void {
    this.currentQId = questionId;
    this.practiceStoreService.setAnswer(String(questionId), value);
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:focusin', ['$event'])
  onInteraction(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) {
      return;
    }

    const gapEl = target.closest('[data-gap-id], [data-qid], [id^="q-box-"]');
    if (gapEl) {
      const qidAttr = gapEl.getAttribute('data-gap-id') || gapEl.getAttribute('data-qid');
      if (qidAttr) {
        this.currentQId = Number(qidAttr);
        return;
      }
      const idAttr = gapEl.getAttribute('id');
      if (idAttr) {
        const match = idAttr.match(/q-box-(\d+)/);
        if (match) {
          this.currentQId = Number(match[1]);
          return;
        }
      }
    }

    if (target instanceof HTMLInputElement && target.name && target.name.startsWith('q-')) {
      const qid = target.name.replace('q-', '');
      if (!isNaN(Number(qid))) {
        this.currentQId = Number(qid);
        return;
      }
    }
  }

  beginResize(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.resizing = true;
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.stopResizing);
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  getPartPrompt(): string {
    const range = this.partRanges[this.activePartIndex];
    if (!range) {
      return '';
    }

    const action = this.isListeningTest ? 'Listen to the audio and answer' : 'Read the text and answer';
    return `${action} questions ${range.min}-${range.max}`;
  }

  getPaneTitle(): string {
    if (this.isListeningTest) {
      return `Listening Section ${this.activePart?.number ?? 1}`;
    }

    return `Reading Passage ${this.activePart?.number ?? 1}`;
  }

  onPassageMouseUp(): void {
    if (!this.enableReadingAssist) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0 || selection.rangeCount === 0) {
      this.hideHighlightMenu();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      this.hideHighlightMenu();
      return;
    }

    this.selectionText = selection.toString().trim();
    this.selectionRange = range.cloneRange();
    this.menuPos = {
      x: rect.left + rect.width / 2,
      y: rect.top
    };
    this.showHighlightMenu = true;
  }

  applyHighlight(color: string): void {
    if (!this.selectionRange) {
      return;
    }

    if (color === 'transparent') {
      this.clearHighlights();
      this.hideHighlightMenu();
      return;
    }

    const range = this.selectionRange.cloneRange();
    const highlight = document.createElement('span');
    highlight.setAttribute('data-ielts-highlight', 'true');
    highlight.style.backgroundColor = color;
    highlight.style.borderRadius = '3px';
    highlight.style.padding = '0 1px';

    try {
      range.surroundContents(highlight);
    } catch {
      const fragment = range.extractContents();
      highlight.appendChild(fragment);
      range.insertNode(highlight);
    }

    this.hideHighlightMenu();
  }

  hideHighlightMenu(): void {
    this.showHighlightMenu = false;
    this.selectionText = '';
    this.menuPos = null;
    this.selectionRange = null;
    window.getSelection()?.removeAllRanges();
  }

  handlePassageClick(event: MouseEvent): void {
    if (!this.enableReadingAssist) {
      return;
    }

    const clearButton = this.getClosestElement(event.target, '[data-clear-gap]');
    if (clearButton) {
      const gapId = clearButton.getAttribute('data-clear-gap');
      if (gapId) {
        this.setAnswer(Number(gapId), '');
        const dropZone = clearButton.closest<HTMLElement>('.drop-zone');
        if (dropZone) {
          this.syncPassageDropZone(dropZone, '');
        }
      }
      this.hideHighlightMenu();
      return;
    }

    const dropZone = this.getClosestElement(event.target, '.drop-zone');
    const qid = dropZone?.getAttribute('data-qid');
    if (qid && this.getAnswer(Number(qid))) {
      this.setAnswer(Number(qid), '');
      this.hideHighlightMenu();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      this.hideHighlightMenu();
    }
  }

  getAnswer(questionId: number): string {
    return this.answers[String(questionId)] ?? '';
  }

  getFilledCount(part: TestPart): number {
    return this.partProgress[part.id]?.filled ?? 0;
  }

  getPartQuestionCount(part: TestPart): number {
    return this.partProgress[part.id]?.total ?? 0;
  }

  getGroupSelectedOptions(group: QuestionGroup): string[] {
    return group.questions
      .map((question) => this.getAnswer(question.id))
      .filter(Boolean);
  }

  toggleGroupOption(group: QuestionGroup, option: string): void {
    const selected = this.getGroupSelectedOptions(group);
    const limit = group.questions.length;
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    const sorted = next
      .sort((left, right) => this.getGroupOptionOrder(group, left) - this.getGroupOptionOrder(group, right))
      .slice(0, limit);

    group.questions.forEach((question, index) => {
      this.practiceStoreService.setAnswer(String(question.id), sorted[index] ?? '');
    });
  }

  isGroupOptionSelected(group: QuestionGroup, option: string): boolean {
    return this.getGroupSelectedOptions(group).includes(option);
  }

  getOptionLetter(option: string, index: number): string {
    const normalized = option.trim();
    return normalized.match(/^([A-Z])(?:[\.\)]|\s{1,2})\s*/)?.[1] ?? String.fromCharCode(65 + index);
  }

  getOptionText(option: string): string {
    return option.trim().replace(/^([A-Z])(?:[\.\)]|\s{1,2})\s*/, '');
  }

  getTemplateAnswerDisplay(questionId: number, group: QuestionGroup): string {
    const value = this.getAnswer(questionId);
    if (!value) {
      return this.isHeadingType(group.type) ? 'Drop heading here' : 'Drop here';
    }

    if (this.isOptionLetterValue(group, value)) {
      const match = (group.options ?? []).find((option, index) => this.getOptionLetter(option, index) === value);
      return match ? `${value}. ${this.getOptionText(match)}` : value;
    }

    return value;
  }

  getChoiceValue(group: QuestionGroup, option: string, index: number): string {
    return this.isBooleanType(group.type) ? option : this.getOptionLetter(option, index);
  }

  getChoiceOptions(group: QuestionGroup, questionId: number): string[] {
    const question = group.questions.find((item) => item.id === questionId);
    return question?.options?.length ? question.options : (group.options ?? []);
  }

  useCompactChoiceButtons(group: QuestionGroup, questionId: number): boolean {
    const question = group.questions.find((item) => item.id === questionId);
    const options = this.getChoiceOptions(group, questionId);
    return !question?.options?.length && options.length > 0 && options.length <= 4;
  }

  isChoiceSelected(questionId: number, group: QuestionGroup, option: string, index: number): boolean {
    const value = this.getAnswer(questionId);
    const expected = this.getChoiceValue(group, option, index);
    return value === expected || value === option;
  }

  isTemplateDragDrop(group: QuestionGroup): boolean {
    return group.type === 'Matching Sentence Endings' || group.interaction === 'drag-drop';
  }

  getMultiSelectPrompt(group: QuestionGroup): string {
    return group.text || group.questions.find((question) => question.text)?.text || '';
  }

  private clearHighlights(): void {
    const nodes = Array.from(document.querySelectorAll('[data-ielts-highlight="true"]'));
    for (const node of nodes) {
      const parent = node.parentNode;
      if (!parent) {
        continue;
      }

      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
    }
  }

  private getGroupOptionOrder(group: QuestionGroup, value: string): number {
    return (group.options ?? []).findIndex((option, index) => {
      const letter = this.getOptionLetter(option, index);
      return letter === value || option === value;
    });
  }

  private rebuildPartProgress(): void {
    if (!this.test) {
      this.partProgress = {};
      return;
    }

    this.partProgress = Object.fromEntries(
      this.test.parts.map((part) => {
        const total = part.questionGroups.reduce((sum, group) => sum + group.questions.length, 0);
        const filled = part.questionGroups
          .flatMap((group) => group.questions)
          .filter((question) => this.getAnswer(question.id))
          .length;
        return [part.id, { filled, total }];
      })
    );
  }

  private rebuildActiveGroups(): void {
    const part = this.activePart;
    if (!part) {
      this.activeGroups = [];
      return;
    }

    this.activeGroups = part.questionGroups.map((group) => ({
      raw: group,
      mode: this.getGroupMode(group),
      segments: this.parseTemplateSegments(group.template),
      headingChoices: (group.headings ?? []).map((heading, index) => ({
        value: heading.match(/^([ivxl]+)\.\s/i)?.[1] ?? String(index + 1),
        text: heading.replace(/^[ivxlIVXL]+\.\s+/, '')
      }))
    }));
  }

  private getGroupMode(group: QuestionGroup): PreparedGroup['mode'] {
    if (group.type === 'Matching Headings') {
      return 'headings';
    }

    if (group.template) {
      return 'template';
    }

    if (group.renderType === 'grid' || (!!group.columns?.length && ['Matching Features', 'Matching Information'].includes(group.type))) {
      return 'grid';
    }

    if (
      group.type === 'Multiple Choice (Multiple Answers)' ||
      (group.type === 'Multiple Choice' && !!group.options?.length && group.questions.length > 1 && group.questions.every((question) => !question.options?.length))
    ) {
      return 'multi-select';
    }

    if (group.questions.some((question) => !!question.options?.length) || !!group.options?.length || this.isBooleanType(group.type)) {
      return 'choice';
    }

    return 'input';
  }

  private parseTemplateSegments(template?: string): TemplateSegment[] {
    if (!template) {
      return [];
    }

    return template
      .split(/(\(\(\d+\)\))/g)
      .filter(Boolean)
      .map((segment) => {
        const match = segment.match(/\(\((\d+)\)\)/);
        return match ? { kind: 'blank', value: match[1] } : { kind: 'html', value: segment };
      });
  }

  private isBooleanType(type: string): boolean {
    return ['True - False - Not Given', 'Yes - No - Not Given'].includes(type);
  }

  private isHeadingType(type: string): boolean {
    return type === 'Matching Headings';
  }

  private isOptionLetterValue(group: QuestionGroup, value: string): boolean {
    return (group.options ?? []).some((option, index) => this.getOptionLetter(option, index) === value);
  }

  private buildPassageHtml(part: TestPart): string {
    const fallback = this.isListeningTest
      ? '<p>Nội dung hỗ trợ cho section sẽ hiện tại đây.</p>'
      : '<p>Nội dung passage sẽ được render tại đây.</p>';
    const html = part.passageHtml ?? fallback;

    if (this.isListeningTest) {
      return html;
    }

    return html.replace(/\[\[(\d+)\]\]/g, (_, rawId: string) => {
      const value = this.escapeHtml(this.getAnswer(Number(rawId)) || '');
      return `<div class="embedded-drop-zone passage-drop-zone drop-zone ${this.getAnswer(Number(rawId)) ? 'is-filled' : ''}" data-gap-id="${rawId}" data-qid="${rawId}" title="Drop heading here">
        <span class="embedded-drop-zone__label">Drop Heading for Paragraph ${rawId}</span>
        <div class="embedded-drop-zone__content content-div">
          <span class="embedded-drop-zone__value">${value || 'Drag a heading from the right and drop it here'}</span>
        </div>
        <button type="button" class="embedded-drop-zone__clear" data-clear-gap="${rawId}">×</button>
      </div>`;
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  onPassageDragOver(event: DragEvent): void {
    const dropZone = this.getClosestElement(event.target, '.drop-zone');
    if (!dropZone) {
      return;
    }

    event.preventDefault();
    this.hoveredGapId = dropZone.getAttribute('data-qid') ?? this.hoveredGapId;
    if (this.hoveredGapId) {
      document.documentElement.setAttribute('data-ielts-hover-gap', this.hoveredGapId);
    }
    dropZone.classList.add('is-hovered');
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onPassageDragLeave(event: DragEvent): void {
    const dropZone = this.getClosestElement(event.target, '.drop-zone');
    dropZone?.classList.remove('is-hovered');
  }

  onPassageDrop(event: DragEvent): void {
    event.preventDefault();
    const dropZone = this.getClosestElement(event.target, '.drop-zone');
    dropZone?.classList.remove('is-hovered');
    const gapId = dropZone?.getAttribute('data-qid') ?? this.hoveredGapId ?? document.documentElement.getAttribute('data-ielts-hover-gap');
    if (!gapId) {
      this.clearReadingDragState();
      return;
    }

    const value =
      event.dataTransfer?.getData('text/plain') ||
      event.dataTransfer?.getData('text') ||
      this.currentDraggedValue ||
      document.documentElement.getAttribute('data-ielts-drag-value') ||
      '';
    if (gapId && value) {
      this.setAnswer(Number(gapId), value);
      if (dropZone) {
        this.syncPassageDropZone(dropZone, value);
      }
    }
    this.clearReadingDragState();
  }

  onTemplateDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onTemplateDrop(event: DragEvent, questionId: number, group: QuestionGroup): void {
    event.preventDefault();
    const value = event.dataTransfer?.getData('text/plain') || event.dataTransfer?.getData('text') || this.currentDraggedValue;
    if (!value || !this.isTemplateDragDrop(group)) {
      return;
    }

    this.setAnswer(questionId, value);
    this.currentDraggedValue = '';
  }

  startDrag(event: DragEvent, value: string): void {
    this.currentDraggedValue = value;
    this.hoveredGapId = null;
    document.documentElement.setAttribute('data-ielts-drag-value', value);
    document.documentElement.removeAttribute('data-ielts-hover-gap');
    event.dataTransfer?.setData('text/plain', value);
    event.dataTransfer?.setData('application/id', value);
    event.dataTransfer?.setData('application/ielts-type', this.test?.skill ?? 'Reading');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  clearAnswer(questionId: number): void {
    this.setAnswer(questionId, '');
  }

  setCurrentDraggedValue(value: string): void {
    this.currentDraggedValue = value;
    document.documentElement.setAttribute('data-ielts-drag-value', value);
  }

  handleReadingDragEnd(event: DragEvent): void {
    const draggedValue = this.currentDraggedValue;
    const hoveredGapId = this.hoveredGapId ?? document.documentElement.getAttribute('data-ielts-hover-gap');

    window.setTimeout(() => {
      const liveDraggedValue = this.currentDraggedValue || document.documentElement.getAttribute('data-ielts-drag-value') || '';
      if (!liveDraggedValue || (draggedValue && liveDraggedValue !== draggedValue)) {
        this.clearReadingDragState();
        return;
      }

      const gapId = hoveredGapId ?? this.resolveGapTarget(event)?.getAttribute('data-gap-id') ?? null;
      if (!gapId) {
        this.clearReadingDragState();
        return;
      }

      this.setAnswer(Number(gapId), liveDraggedValue);
      const dropZone = document.querySelector<HTMLElement>(`.readingShell .drop-zone[data-qid="${gapId}"]`);
      if (dropZone) {
        this.syncPassageDropZone(dropZone, liveDraggedValue);
      }
      this.clearReadingDragState();
    }, 0);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  scrollToQuestion(questionId: number): void {
    this.currentQId = questionId;
    const nextPartIndex = this.findPartIndexByQuestionId(questionId);

    if (nextPartIndex !== -1 && nextPartIndex !== this.activePartIndex) {
      this.activePartIndex = nextPartIndex;
      this.rebuildActiveGroups();
      this.updateRenderedPassageHtml();
      window.setTimeout(() => this.scrollQuestionIntoView(questionId), 0);
      return;
    }

    this.scrollQuestionIntoView(questionId);
  }

  getQuestionIdsForPart(index: number): number[] {
    const range = this.partRanges[index];
    if (!range) {
      return [];
    }

    return this.allQuestionIds.filter((value) => value >= range.min && value <= range.max);
  }

  canGoToPreviousQuestion(): boolean {
    return this.getQuestionIndex(this.currentQId) > 0;
  }

  canGoToNextQuestion(): boolean {
    const currentIndex = this.getQuestionIndex(this.currentQId);
    return currentIndex !== -1 && currentIndex < this.allQuestionIds.length - 1;
  }

  goToPreviousQuestion(): void {
    const currentIndex = this.getQuestionIndex(this.currentQId);
    if (currentIndex <= 0) {
      return;
    }

    this.scrollToQuestion(this.allQuestionIds[currentIndex - 1]);
  }

  goToNextQuestion(): void {
    const currentIndex = this.getQuestionIndex(this.currentQId);
    if (currentIndex === -1 || currentIndex >= this.allQuestionIds.length - 1) {
      return;
    }

    this.scrollToQuestion(this.allQuestionIds[currentIndex + 1]);
  }

  private updateRenderedPassageHtml(): void {
    const part = this.activePart;
    this.renderedPassageHtml = part ? this.buildPassageHtml(part) : '';
  }

  private scrollQuestionIntoView(questionId: number): void {
    let el = document.getElementById(`q-box-${questionId}`);
    if (!el) {
      el = document.querySelector(`[data-gap-id="${questionId}"]`) as HTMLElement;
    }
    if (el) {
      if (el.classList.contains('gapCircle')) {
        const parentStack = el.closest('.questionItemStack');
        if (parentStack) {
          parentStack.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  private findPartIndexByQuestionId(questionId: number): number {
    return this.partRanges.findIndex((range) => questionId >= range.min && questionId <= range.max);
  }

  private getQuestionIndex(questionId: number): number {
    return this.allQuestionIds.indexOf(questionId);
  }

  private getClosestElement(target: EventTarget | null, selector: string): HTMLElement | null {
    if (target instanceof HTMLElement) {
      return target.closest<HTMLElement>(selector);
    }

    if (target instanceof Text) {
      return target.parentElement?.closest<HTMLElement>(selector) ?? null;
    }

    return null;
  }

  private resolveGapTarget(event: DragEvent): HTMLElement | null {
    const directTarget = this.getClosestElement(event.target, '[data-gap-id]');
    if (directTarget) {
      return directTarget;
    }

    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      const stack = document.elementsFromPoint(event.clientX, event.clientY);
      for (const element of stack) {
        const match = element.closest<HTMLElement>('[data-gap-id]');
        if (match) {
          return match;
        }
      }
    }

    return this.findNearestGapTarget(event);
  }

  private findNearestGapTarget(event: DragEvent): HTMLElement | null {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('.passageContent [data-gap-id]'));
    if (!candidates.length) {
      return null;
    }

    let closest: HTMLElement | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

      if (distance < minDistance) {
        minDistance = distance;
        closest = candidate;
      }
    }

    return minDistance <= 140 ? closest : null;
  }

  private syncPassageDropZone(dropZone: HTMLElement, value: string): void {
    const contentDiv = dropZone.querySelector<HTMLElement>('.content-div');
    if (!contentDiv) {
      return;
    }

    if (value) {
      contentDiv.innerHTML = `<span class="font-bold text-blue-700 pointer-events-none">${this.escapeHtml(value)}</span>`;
      dropZone.classList.add('is-filled');
    } else {
      contentDiv.innerHTML = '<span class="embedded-drop-zone__value">Drag a heading from the right and drop it here</span>';
      dropZone.classList.remove('is-filled');
    }
  }

  private clearReadingDragState(): void {
    this.currentDraggedValue = '';
    this.hoveredGapId = null;
    document.documentElement.removeAttribute('data-ielts-drag-value');
    document.documentElement.removeAttribute('data-ielts-hover-gap');
  }

  goBack(): void {
    void this.router.navigate(['/tests'], {
      queryParams: this.test ? { skill: this.test.skill } : undefined
    });
  }

  async submit(): Promise<void> {
    if (!this.test) {
      return;
    }

    const user = this.authService.currentUser ?? await this.authService.loginWithGoogle();
    this.result = await this.testDataService.submitTest(user.uid, this.test, this.answers);
    
    const duration = this.getDurationInSeconds(this.test);
    this.timeSpent = Math.max(0, duration - this.timeLeft);

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    this.showResultOverlay = true;
  }

  trackByPart(_: number, part: TestPart): string {
    return part.id;
  }

  trackByQuestion(_: number, question: { id: number }): number {
    return question.id;
  }

  trackByOption(_: number, option: string): string {
    return option;
  }

  trackByPreparedGroup(_: number, group: PreparedGroup): string {
    return group.raw.id;
  }

  trackByHeadingChoice(_: number, choice: HeadingChoice): string {
    return choice.value;
  }

  trackById(_: number, value: number): number {
    return value;
  }

  private getPartRange(part: TestPart): { min: number; max: number; total: number } {
    const ids = part.questionGroups.flatMap((group) => group.questions.map((question) => question.id));
    if (ids.length === 0) {
      return { min: 0, max: 0, total: 0 };
    }

    return {
      min: Math.min(...ids),
      max: Math.max(...ids),
      total: ids.length
    };
  }

  private getDurationInSeconds(test: Test | null): number {
    return test?.skill === 'Listening' ? 40 * 60 : 60 * 60;
  }

  private startTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    this.timerId = window.setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
    }, 1000);
  }
}
