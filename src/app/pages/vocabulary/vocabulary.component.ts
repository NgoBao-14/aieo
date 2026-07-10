import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface VocabWord {
  word: string;
  phonetic: string;
  pos: string;
  defVi: string;
  defEn: string;
  example: string;
  topic: string;
  band: number;
}

interface PosTab {
  id: string;
  name: string;
  icon: string;
  totalDays: number;
}

@Component({
  selector: 'app-vocabulary',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.scss']
})
export class VocabularyComponent implements OnDestroy {
  private routerSubscription: Subscription;

  constructor(private router: Router) {
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      if (url === '/vocabulary' || url.startsWith('/vocabulary?')) {
        this.flashcardMode = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // State quản lý giao diện
  selectedPos = 'noun';
  streakDays = 0;
  todayWordsLearned = 0;
  totalLearnedCount = 0;
  maxRecord = 0;

  // Trạng thái lưu từ & học từ
  savedWords = new Set<string>();
  learnedWords = new Set<string>();
  learnedDays = new Set<string>(); // Lưu vết ngày đã học, ví dụ: 'noun-1'

  // Trạng thái chế độ học flashcard/chi tiết
  flashcardMode = false;
  currentCardIndex = 0;
  cardFlipped = false;

  readonly posTabs: PosTab[] = [
    { id: 'noun', name: 'Danh từ', icon: '📝', totalDays: 6 },
    { id: 'verb', name: 'Động từ', icon: '⚡', totalDays: 6 },
    { id: 'adj', name: 'Tính từ', icon: '🎨', totalDays: 6 },
    { id: 'adv', name: 'Trạng từ', icon: '🚀', totalDays: 2 }
  ];

  readonly words: VocabWord[] = [
    // Danh từ (noun)
    { word: 'biodiversity', phonetic: '/ˌbaɪəʊdaɪˈvɜːsəti/', pos: 'noun', defVi: 'Đa dạng sinh học', defEn: 'the variety of plant and animal life in a habitat', example: 'Deforestation leads to a dramatic loss of biodiversity.', topic: 'environment', band: 7 },
    { word: 'deforestation', phonetic: '/diːˌfɒrɪˈsteɪʃən/', pos: 'noun', defVi: 'Nạn phá rừng', defEn: 'the action of clearing a wide area of trees', example: 'Rampant deforestation has severely impacted wildlife habitats.', topic: 'environment', band: 6 },
    { word: 'emissions', phonetic: '/ɪˈmɪʃənz/', pos: 'noun', defVi: 'Khí thải', defEn: 'the production and discharge of gas into the atmosphere', example: 'Countries must reduce carbon emissions to meet climate targets.', topic: 'environment', band: 6 },
    { word: 'conservation', phonetic: '/ˌkɒnsəˈveɪʃən/', pos: 'noun', defVi: 'Bảo tồn thiên nhiên', defEn: 'the protection of plants, animals and natural resources', example: 'Wildlife conservation efforts have brought several species back.', topic: 'environment', band: 6 },
    { word: 'innovation', phonetic: '/ˌɪnəˈveɪʃən/', pos: 'noun', defVi: 'Sự đổi mới, sáng tạo', defEn: 'a new idea, product, or way of doing something', example: 'Technological innovation has transformed the modern economy.', topic: 'technology', band: 6 },
    { word: 'automation', phonetic: '/ˌɔːtəˈmeɪʃən/', pos: 'noun', defVi: 'Tự động hóa', defEn: 'the use of machines to do work that humans used to do', example: 'Automation is displacing workers in manufacturing industries worldwide.', topic: 'technology', band: 6 },
    { word: 'algorithm', phonetic: '/ˈælɡərɪðəm/', pos: 'noun', defVi: 'Thuật toán', defEn: 'a set of rules followed in problem-solving operations', example: 'Social media platforms use complex algorithms to personalise content.', topic: 'technology', band: 7 },
    { word: 'surveillance', phonetic: '/sɜːˈveɪləns/', pos: 'noun', defVi: 'Sự giám sát, theo dõi', defEn: 'close observation, especially of a suspected person', example: 'Mass digital surveillance raises concerns about privacy.', topic: 'technology', band: 7 },
    { word: 'obesity', phonetic: '/əʊˈbiːsɪti/', pos: 'noun', defVi: 'Bệnh béo phì', defEn: 'the condition of being very overweight', example: 'Childhood obesity has become a major public health crisis.', topic: 'health', band: 6 },
    { word: 'malnutrition', phonetic: '/ˌmælnjuˈtrɪʃən/', pos: 'noun', defVi: 'Suy dinh dưỡng', defEn: 'lack of proper nutrition', example: 'Malnutrition remains a critical issue in sub-Saharan Africa.', topic: 'health', band: 6 },
    { word: 'wellbeing', phonetic: '/ˈwelbiɪŋ/', pos: 'noun', defVi: 'Sức khỏe và hạnh phúc', defEn: 'the state of being comfortable, healthy, or happy', example: 'Employers are recognising the importance of employee wellbeing.', topic: 'health', band: 5 },
    { word: 'urbanisation', phonetic: '/ˌɜːbənaɪˈzeɪʃən/', pos: 'noun', defVi: 'Đô thị hóa', defEn: 'the process by which towns and cities grow larger', example: 'Rapid urbanisation has led to overcrowding in megacities.', topic: 'society', band: 6 },
    { word: 'inequality', phonetic: '/ˌɪnɪˈkwɒlɪti/', pos: 'noun', defVi: 'Bất bình đẳng', defEn: 'difference in size, degree, or circumstances', example: 'Income inequality has widened significantly over the past three decades.', topic: 'society', band: 6 },
    { word: 'migration', phonetic: '/maɪˈɡreɪʃən/', pos: 'noun', defVi: 'Di cư, di dân', defEn: 'movement from one place to another', example: 'Economic migration has had both benefits and challenges for host countries.', topic: 'society', band: 5 },
    { word: 'curriculum', phonetic: '/kəˈrɪkjʊləm/', pos: 'noun', defVi: 'Chương trình học', defEn: 'the subjects comprising a course of study in a school', example: 'The school introduced coding into its curriculum.', topic: 'education', band: 6 },
    { word: 'literacy', phonetic: '/ˈlɪtərəsi/', pos: 'noun', defVi: 'Khả năng đọc viết', defEn: 'the ability to read and write', example: 'Improving digital literacy is essential for today\'s economy.', topic: 'education', band: 5 },
    { word: 'pedagogy', phonetic: '/ˈpedəɡɒdʒi/', pos: 'noun', defVi: 'Phương pháp sư phạm', defEn: 'the method and practice of teaching', example: 'Progressive pedagogy emphasises critical thinking over rote memorisation.', topic: 'education', band: 7 },
    { word: 'globalisation', phonetic: '/ˌɡləʊbəlaɪˈzeɪʃən/', pos: 'noun', defVi: 'Toàn cầu hóa', defEn: 'the process by which businesses develop international influence', example: 'Globalisation has enabled the rapid spread of goods and ideas.', topic: 'economy', band: 6 },
    { word: 'recession', phonetic: '/rɪˈseʃən/', pos: 'noun', defVi: 'Suy thoái kinh tế', defEn: 'a period of temporary economic decline', example: 'The 2008 recession caused unemployment to soar in western nations.', topic: 'economy', band: 6 },
    { word: 'entrepreneur', phonetic: '/ˌɒntrəprəˈnɜːr/', pos: 'noun', defVi: 'Nhà khởi nghiệp', defEn: 'a person who sets up a business taking on financial risks', example: 'Young entrepreneurs are using technology to disrupt traditional industries.', topic: 'economy', band: 5 },

    // Động từ (verb)
    { word: 'sustain', phonetic: '/səˈsteɪn/', pos: 'verb', defVi: 'Duy trì, chống đỡ', defEn: 'strengthen or support physically or mentally', example: 'This strategy will help sustain our business growth.', topic: 'economy', band: 6 },
    { word: 'innovate', phonetic: '/ˈɪnəveɪt/', pos: 'verb', defVi: 'Đổi mới, sáng tạo', defEn: 'make changes in something established, especially by introducing new methods', example: 'Companies must innovate to survive in the competitive market.', topic: 'technology', band: 6 },
    { word: 'implement', phonetic: '/ˈɪmplɪment/', pos: 'verb', defVi: 'Triển khai, thực hiện', defEn: 'put a decision, plan, or agreement into effect', example: 'The government decided to implement new environmental regulations.', topic: 'environment', band: 6 },
    { word: 'accelerate', phonetic: '/ækˈseləreɪt/', pos: 'verb', defVi: 'Thúc đẩy, tăng tốc', defEn: 'begin to run or go faster', example: 'We need to accelerate the deployment of clean energy.', topic: 'environment', band: 7 },
    { word: 'preserve', phonetic: '/prɪˈzɜːv/', pos: 'verb', defVi: 'Bảo tồn, gìn giữ', defEn: 'maintain something in its original or existing state', example: 'Efforts are being made to preserve historic buildings.', topic: 'society', band: 5 },
    { word: 'regulate', phonetic: '/ˈreɡjʊleɪt/', pos: 'verb', defVi: 'Điều tiết, quản lý', defEn: 'control or maintain the rate or speed of a process', example: 'The government needs to regulate financial systems carefully.', topic: 'economy', band: 6 },

    // Tính từ (adj)
    { word: 'sustainable', phonetic: '/səˈsteɪnəbəl/', pos: 'adj', defVi: 'Bền vững', defEn: 'able to continue without damaging the environment', example: 'We need sustainable energy sources to combat climate change.', topic: 'environment', band: 6 },
    { word: 'renewable', phonetic: '/rɪˈnjuːəbəl/', pos: 'adj', defVi: 'Tái tạo được', defEn: 'relating to natural resources that can be replaced after use', example: 'Solar and wind power are the most promising renewable energy sources.', topic: 'environment', band: 5 },
    { word: 'sedentary', phonetic: '/ˈsedənteri/', pos: 'adj', defVi: 'Ít vận động, ngồi nhiều', defEn: 'tending to spend much time seated; somewhat inactive', example: 'A sedentary lifestyle is linked to obesity and heart disease.', topic: 'health', band: 7 },
    { word: 'demographic', phonetic: '/ˌdeməˈɡræfɪk/', pos: 'adj', defVi: 'Thuộc về dân số học', defEn: 'relating to the structure of populations', example: 'A major demographic shift is underway as populations age rapidly.', topic: 'society', band: 7 },

    // Trạng từ (adv)
    { word: 'sustainably', phonetic: '/səˈsteɪnəbli/', pos: 'adv', defVi: 'Một cách bền vững', defEn: 'in a way that can be maintained at a certain level', example: 'The forest is sustainably managed.', topic: 'environment', band: 6 },
    { word: 'rapidly', phonetic: '/ˈræpɪdli/', pos: 'adv', defVi: 'Một cách nhanh chóng', defEn: 'very quickly; at a fast rate', example: 'The economy is growing rapidly.', topic: 'economy', band: 5 }
  ];

  get filteredWords(): VocabWord[] {
    return this.words.filter(w => w.pos === this.selectedPos);
  }

  get currentCard(): VocabWord {
    return this.filteredWords[this.currentCardIndex] ?? this.words[0];
  }

  get learnedPercent(): number {
    if (!this.filteredWords.length) return 0;
    const n = this.filteredWords.filter(w => this.learnedWords.has(w.word)).length;
    return Math.round((n / this.filteredWords.length) * 100);
  }

  // Đếm số ngày đã hoàn thành của từng loại từ
  getLearnedDaysCount(posId: string): number {
    return Array.from(this.learnedDays).filter(d => d.startsWith(posId)).length;
  }

  // Đếm tỷ lệ phần trăm tiến độ của từng loại từ để vẽ progress bar
  getPosProgressPercent(posTab: PosTab): number {
    const completed = this.getLearnedDaysCount(posTab.id);
    return Math.round((completed / posTab.totalDays) * 100);
  }

  currentStudyTab = 'quiz';
  selectedDayId = 'noun-1';
  selectedDayNumber = 1;

  // Quiz state
  quizQuestions: any[] = [];
  currentQuizIndex = 0;
  quizScore = 0;
  selectedAnswer: string | null = null;
  answerChecked = false;
  incorrectSelection: string | null = null;
  showQuizResult = false;

  // Listening Quiz state
  listeningQuestions: any[] = [];
  currentListeningIndex = 0;
  listeningScore = 0;
  selectedListeningAnswer: string | null = null;
  listeningChecked = false;
  incorrectListeningSelection: string | null = null;
  showListeningResult = false;

  // Matching game state
  matchingWords: any[] = [];
  matchingDefs: any[] = [];
  selectedWordMatch: any = null;
  selectedDefMatch: any = null;
  matchedPairs = new Set<string>();
  matchingStatusMessage = '';

  // Writing state
  writingQuestions: any[] = [];
  currentWritingIndex = 0;
  writingScore = 0;
  writingInput = '';
  writingChecked = false;
  writingFeedback: 'correct' | 'incorrect' | null = null;
  showWritingResult = false;

  selectPos(posId: string): void {
    this.selectedPos = posId;
    this.currentCardIndex = 0;
    this.cardFlipped = false;
  }

  getDaysForActivePos(): any[] {
    const tab = this.posTabs.find(t => t.id === this.selectedPos);
    if (!tab) return [];
    const list = [];
    for (let i = 1; i <= tab.totalDays; i++) {
      list.push({
        id: `${tab.id}-${i}`,
        dayNumber: i,
        range: `Từ ${(i - 1) * 50 + 1}-${i * 50}`
      });
    }
    return list;
  }

  startLearning(dayId: string): void {
    if (dayId !== 'default') {
      this.selectedDayId = dayId;
      const parts = dayId.split('-');
      if (parts.length === 2) {
        this.selectedDayNumber = parseInt(parts[1], 10);
      }
    } else {
      this.selectedDayId = `${this.selectedPos}-1`;
      this.selectedDayNumber = 1;
    }
    this.flashcardMode = true;
    this.cardFlipped = false;
    this.currentCardIndex = 0;
    this.changeStudyTab('quiz'); // Default to Quiz mode per request
  }

  markDayCompleted(dayId: string, event: Event): void {
    event.stopPropagation();
    if (this.learnedDays.has(dayId)) {
      this.learnedDays.delete(dayId);
      if (this.totalLearnedCount > 0) this.totalLearnedCount--;
    } else {
      this.learnedDays.add(dayId);
      this.totalLearnedCount++;
      if (this.totalLearnedCount > this.maxRecord) {
        this.maxRecord = this.totalLearnedCount;
      }
      // Cộng streak & học từ hôm nay
      this.streakDays = 1;
      this.todayWordsLearned = Math.min(10, this.todayWordsLearned + 3);
    }
  }

  toggleFlashcard(): void {
    this.flashcardMode = !this.flashcardMode;
    this.currentCardIndex = 0;
    this.cardFlipped = false;
  }

  changeStudyTab(tab: string): void {
    this.currentStudyTab = tab;
    if (tab === 'quiz') {
      this.initQuiz();
    } else if (tab === 'listening') {
      this.initListening();
    } else if (tab === 'matching') {
      this.initMatching();
    } else if (tab === 'writing') {
      this.initWriting();
    }
  }

  // Quiz Mode Logic
  initQuiz(): void {
    this.currentQuizIndex = 0;
    this.quizScore = 0;
    this.selectedAnswer = null;
    this.answerChecked = false;
    this.incorrectSelection = null;
    this.showQuizResult = false;

    const list = this.filteredWords;
    if (list.length === 0) return;

    this.quizQuestions = list.map(word => {
      const options = new Set<string>();
      options.add(word.word);
      
      const allWords = this.words.map(w => w.word);
      while (options.size < Math.min(6, allWords.length)) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        options.add(randomWord);
      }

      return {
        word: word,
        options: this.shuffleArray(Array.from(options)),
        correctAnswer: word.word
      };
    });
  }

  selectQuizOption(option: string): void {
    if (this.answerChecked) return;
    this.selectedAnswer = option;
    this.answerChecked = true;
    const currentQ = this.quizQuestions[this.currentQuizIndex];
    if (option === currentQ.correctAnswer) {
      this.quizScore++;
      this.learnedWords.add(currentQ.word.word);
    } else {
      this.incorrectSelection = option;
    }
  }

  nextQuizQuestion(): void {
    this.selectedAnswer = null;
    this.answerChecked = false;
    this.incorrectSelection = null;
    if (this.currentQuizIndex < this.quizQuestions.length - 1) {
      this.currentQuizIndex++;
    } else {
      this.showQuizResult = true;
      if (this.quizScore >= this.quizQuestions.length / 2) {
        this.learnedDays.add(this.selectedDayId);
        this.totalLearnedCount = this.learnedDays.size;
        if (this.totalLearnedCount > this.maxRecord) {
          this.maxRecord = this.totalLearnedCount;
        }
        this.streakDays = 1;
        this.todayWordsLearned = Math.min(10, this.todayWordsLearned + 3);
      }
    }
  }

  restartQuiz(): void {
    this.initQuiz();
  }

  // Listening Mode Logic
  initListening(): void {
    this.currentListeningIndex = 0;
    this.listeningScore = 0;
    this.selectedListeningAnswer = null;
    this.listeningChecked = false;
    this.incorrectListeningSelection = null;
    this.showListeningResult = false;

    const list = this.filteredWords;
    if (list.length === 0) return;

    this.listeningQuestions = list.map(word => {
      const options = new Set<string>();
      options.add(word.word);
      
      const allWords = this.words.map(w => w.word);
      while (options.size < Math.min(6, allWords.length)) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        options.add(randomWord);
      }

      return {
        word: word,
        options: this.shuffleArray(Array.from(options)),
        correctAnswer: word.word
      };
    });
    
    setTimeout(() => {
      this.playWordAudio(this.listeningQuestions[0].word.word);
    }, 300);
  }

  playWordAudio(word: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ phát âm thanh.');
    }
  }

  selectListeningOption(option: string): void {
    if (this.listeningChecked) return;
    this.selectedListeningAnswer = option;
    this.listeningChecked = true;
    const currentQ = this.listeningQuestions[this.currentListeningIndex];
    if (option === currentQ.correctAnswer) {
      this.listeningScore++;
    } else {
      this.incorrectListeningSelection = option;
    }
  }

  nextListeningQuestion(): void {
    this.selectedListeningAnswer = null;
    this.listeningChecked = false;
    this.incorrectListeningSelection = null;
    if (this.currentListeningIndex < this.listeningQuestions.length - 1) {
      this.currentListeningIndex++;
      setTimeout(() => {
        this.playWordAudio(this.listeningQuestions[this.currentListeningIndex].word.word);
      }, 200);
    } else {
      this.showListeningResult = true;
    }
  }

  restartListening(): void {
    this.initListening();
  }

  // Matching Mode Logic
  initMatching(): void {
    this.matchedPairs.clear();
    this.selectedWordMatch = null;
    this.selectedDefMatch = null;
    this.matchingStatusMessage = 'Hãy ghép từ tiếng Anh với nghĩa tương ứng!';

    const list = this.shuffleArray([...this.filteredWords]).slice(0, 5);
    if (list.length === 0) return;

    this.matchingWords = this.shuffleArray(list.map(w => ({ word: w.word, matched: false })));
    this.matchingDefs = this.shuffleArray(list.map(w => ({ word: w.word, defVi: w.defVi, matched: false })));
  }

  selectWordMatch(item: any): void {
    if (item.matched) return;
    this.selectedWordMatch = item;
    this.checkMatch();
  }

  selectDefMatch(item: any): void {
    if (item.matched) return;
    this.selectedDefMatch = item;
    this.checkMatch();
  }

  checkMatch(): void {
    if (this.selectedWordMatch && this.selectedDefMatch) {
      if (this.selectedWordMatch.word === this.selectedDefMatch.word) {
        this.selectedWordMatch.matched = true;
        this.selectedDefMatch.matched = true;
        this.matchedPairs.add(this.selectedWordMatch.word);
        this.selectedWordMatch = null;
        this.selectedDefMatch = null;
        
        if (this.matchedPairs.size === this.matchingWords.length) {
          this.matchingStatusMessage = '🎉 Xuất sắc! Bạn đã ghép đúng tất cả các từ!';
        } else {
          this.matchingStatusMessage = 'Chính xác! Tiếp tục ghép các từ còn lại.';
        }
      } else {
        this.matchingStatusMessage = '❌ Chưa chính xác, hãy thử lại!';
        this.selectedWordMatch = null;
        this.selectedDefMatch = null;
      }
    }
  }

  // Writing Mode Logic
  initWriting(): void {
    this.currentWritingIndex = 0;
    this.writingScore = 0;
    this.writingInput = '';
    this.writingChecked = false;
    this.writingFeedback = null;
    this.showWritingResult = false;
    this.writingQuestions = [...this.filteredWords];
  }

  checkWritingAnswer(): void {
    if (this.writingChecked) return;
    this.writingChecked = true;
    const currentQ = this.writingQuestions[this.currentWritingIndex];
    if (this.writingInput.trim().toLowerCase() === currentQ.word.toLowerCase()) {
      this.writingFeedback = 'correct';
      this.writingScore++;
    } else {
      this.writingFeedback = 'incorrect';
    }
  }

  nextWritingQuestion(): void {
    this.writingInput = '';
    this.writingChecked = false;
    this.writingFeedback = null;
    if (this.currentWritingIndex < this.writingQuestions.length - 1) {
      this.currentWritingIndex++;
    } else {
      this.showWritingResult = true;
    }
  }

  restartWriting(): void {
    this.initWriting();
  }

  // Helper utils
  shuffleArray(array: any[]): any[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  flipCard(): void {
    this.cardFlipped = !this.cardFlipped;
  }

  nextCard(): void {
    this.cardFlipped = false;
    if (this.filteredWords.length > 0) {
      this.currentCardIndex = (this.currentCardIndex + 1) % this.filteredWords.length;
    }
  }

  prevCard(): void {
    this.cardFlipped = false;
    if (this.filteredWords.length > 0) {
      this.currentCardIndex = (this.currentCardIndex - 1 + this.filteredWords.length) % this.filteredWords.length;
    }
  }

  toggleSave(word: string): void {
    if (this.savedWords.has(word)) {
      this.savedWords.delete(word);
    } else {
      this.savedWords.add(word);
    }
  }

  toggleLearned(word: string): void {
    if (this.learnedWords.has(word)) {
      this.learnedWords.delete(word);
    } else {
      this.learnedWords.add(word);
    }
  }

  triggerDictionary(): void {
    alert('Chức năng Tra từ nhanh đang được phát triển!');
  }
}

