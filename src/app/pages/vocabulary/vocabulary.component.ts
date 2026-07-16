import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { VocabProgressService } from '../../core/services/vocab-progress.service';

export interface VocabWord {
  word: string;
  phonetic: string;
  pos: string;
  defVi: string;
  defEn: string;
  example: string;
  exampleVi?: string;
  note?: string;
  topic: string;
  band: number;
  collocations?: { phrase: string, vi: string }[];
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
export class VocabularyComponent implements OnInit, OnDestroy {
  private routerSubscription: Subscription;
  private authSubscription?: Subscription;
  userId = '';
  lastStudyDate = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private vocabProgressService: VocabProgressService
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      if (url === '/vocabulary' || url.startsWith('/vocabulary?')) {
        this.flashcardMode = false;
      }
    });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.user$.subscribe(async (user) => {
      this.userId = user?.uid || 'demo-user';
      await this.loadProgress();
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async loadProgress(): Promise<void> {
    const progress = await this.vocabProgressService.loadProgress(this.userId);
    this.streakDays = progress.streakDays;
    this.todayWordsLearned = progress.todayWordsLearned;
    this.savedWords = new Set(progress.savedWords);
    this.learnedWords = new Set(progress.learnedWords);
    this.learnedDays = new Set(progress.learnedDays);
    this.lastStudyDate = progress.lastStudyDate || '';
    this.sessionHistoryIndex = progress.index || [];

    // Tự động tính toán lại số từ tổng bằng số từ đã học thực tế
    this.totalLearnedCount = this.learnedWords.size;
    this.updatePosCounts();
    
    // Tự động sửa chữa giá trị kỷ lục
    const oldMax = progress.maxRecord || 0;
    if (oldMax <= this.learnedWords.size && this.learnedWords.size > 0) {
      this.maxRecord = this.learnedWords.size;
    } else {
      this.maxRecord = oldMax;
    }

    // Kiểm tra reset ngày mới
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (this.lastStudyDate !== yesterday && this.lastStudyDate) {
        this.streakDays = 0; // Đứt chuỗi streak
      }
      this.todayWordsLearned = 0;
      this.lastStudyDate = today;
      await this.saveCurrentProgress();
    }
  }

  updatePosCounts(): void {
    this.nounCount = 0;
    this.verbCount = 0;
    this.adjCount = 0;
    this.advCount = 0;
    for (const word of this.learnedWords) {
      const wordObj = this.words.find(w => w.word === word);
      if (wordObj) {
        if (wordObj.pos === 'noun') this.nounCount++;
        else if (wordObj.pos === 'verb') this.verbCount++;
        else if (wordObj.pos === 'adj') this.adjCount++;
        else if (wordObj.pos === 'adv') this.advCount++;
      }
    }
  }

  async saveCurrentProgress(): Promise<void> {
    if (!this.userId) return;
    this.totalLearnedCount = this.learnedWords.size;
    if (this.totalLearnedCount > this.maxRecord) {
      this.maxRecord = this.totalLearnedCount;
    }
    this.updatePosCounts();
    const progress = {
      streakDays: this.streakDays,
      todayWordsLearned: this.todayWordsLearned,
      totalLearnedCount: this.totalLearnedCount,
      maxRecord: this.maxRecord,
      savedWords: Array.from(this.savedWords),
      learnedWords: Array.from(this.learnedWords),
      learnedDays: Array.from(this.learnedDays),
      lastStudyDate: this.lastStudyDate,
      nounCount: this.nounCount,
      verbCount: this.verbCount,
      adjCount: this.adjCount,
      advCount: this.advCount,
      index: this.sessionHistoryIndex
    };
    await this.vocabProgressService.saveProgress(this.userId, progress);
  }

  // State quản lý giao diện
  selectedPos = 'noun';
  streakDays = 0;
  todayWordsLearned = 0;
  totalLearnedCount = 0;
  maxRecord = 0;
  
  nounCount = 0;
  verbCount = 0;
  adjCount = 0;
  advCount = 0;
  sessionHistoryIndex: any[] = [];
  sessionStartLearnedWords = new Set<string>();

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
    // Danh từ (noun) - Words from screenshot
    {
      word: 'industry',
      phonetic: "/'ɪndəstri/",
      pos: 'noun',
      defVi: 'Ngành công nghiệp, Công nghiệp',
      defEn: 'economic activity concerned with the processing of raw materials and manufacture of goods in factories',
      example: "The country's economy relies heavily on its manufacturing industry.",
      exampleVi: 'Nền kinh tế của đất nước phụ thuộc nhiều vào ngành công nghiệp sản xuất.',
      note: 'Thường dùng số ít (industry) khi nói về toàn bộ lĩnh vực sản xuất/kinh doanh, và số nhiều (industries) khi nói về các loại hình kinh doanh khác nhau.',
      topic: 'business',
      band: 5,
      collocations: [
        { phrase: 'the automotive/textile/tourism industry', vi: 'ngành công nghiệp ô tô/dệt may/du lịch' },
        { phrase: 'heavy/light industry', vi: 'công nghiệp nặng/nhẹ' },
        { phrase: 'primary/secondary/tertiary industry', vi: 'công nghiệp sơ cấp/thứ cấp/thứ ba' }
      ]
    },
    {
      word: 'brochure',
      phonetic: "/'broʊʃʊr/",
      pos: 'noun',
      defVi: 'Sách quảng cáo, tờ rơi',
      defEn: 'a small book or magazine containing pictures and information about a product or service',
      example: 'Please read our brochure for more details about the tour.',
      exampleVi: 'Vui lòng đọc sách quảng cáo của chúng tôi để biết thêm chi tiết về chuyến tham quan.',
      topic: 'business',
      band: 5
    },
    {
      word: 'problem',
      phonetic: "/'prɑːbləm/",
      pos: 'noun',
      defVi: 'Vấn đề, điều khó khăn',
      defEn: 'a matter or situation regarded as unwelcome or harmful and needing to be overcome',
      example: 'We are working to solve the customer service problem.',
      exampleVi: 'Chúng tôi đang làm việc để giải quyết vấn đề dịch vụ khách hàng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'order',
      phonetic: "/'bːrdər/",
      pos: 'noun',
      defVi: 'Đơn đặt hàng, trật tự',
      defEn: 'a request to make, supply, or deliver food or goods',
      example: 'I would like to place an order for a new laptop.',
      exampleVi: 'Tôi muốn đặt một đơn hàng cho máy tính xách tay mới.',
      topic: 'business',
      band: 4
    },
    {
      word: 'unit',
      phonetic: "/'juːnɪt/",
      pos: 'noun',
      defVi: 'Đơn vị, bộ phận',
      defEn: 'an individual thing or person regarded as single and complete',
      example: 'The course is divided into ten learning units.',
      exampleVi: 'Khóa học được chia thành mười đơn vị học tập.',
      topic: 'education',
      band: 4
    },
    {
      word: 'sporting',
      phonetic: "/'spɔːrtɪŋ/",
      pos: 'noun',
      defVi: 'Thể thao, hoạt động thể thao',
      defEn: 'connected with or interested in sports',
      example: 'It was a great sporting event.',
      exampleVi: 'Đó là một sự kiện thể thao tuyệt vời.',
      topic: 'sports',
      band: 5
    },
    {
      word: 'list',
      phonetic: "/'lɪst/",
      pos: 'noun',
      defVi: 'Danh sách',
      defEn: 'a number of connected items or names written consecutively',
      example: 'She made a list of things to buy.',
      exampleVi: 'Cô ấy đã lập một danh sách những thứ cần mua.',
      topic: 'general',
      band: 4
    },
    {
      word: 'choice',
      phonetic: "/'tʃɔɪs/",
      pos: 'noun',
      defVi: 'Sự lựa chọn',
      defEn: 'an act of selecting or making a decision when faced with two or more possibilities',
      example: 'You have a choice between coffee and tea.',
      exampleVi: 'Bạn có sự lựa chọn giữa cà phê và trà.',
      topic: 'general',
      band: 4
    },
    {
      word: 'mailing',
      phonetic: "/'meɪlɪŋ/",
      pos: 'noun',
      defVi: 'Gửi thư, đợt gửi thư',
      defEn: 'the action of sending mail',
      example: 'We are preparing the promotional mailing list.',
      exampleVi: 'Chúng tôi đang chuẩn bị danh sách gửi thư quảng cáo.',
      topic: 'business',
      band: 5
    },
    {
      word: 'advertisement',
      phonetic: "/əd'vɜːrtɪsmənt/",
      pos: 'noun',
      defVi: 'Quảng cáo',
      defEn: 'a notice or announcement in a public medium promoting a product, service, or event',
      example: 'The advertisement attracted many customers.',
      exampleVi: 'Quảng cáo đã thu hút nhiều khách hàng.',
      topic: 'business',
      band: 5
    },

    // Old Nouns
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
    const allPosWords = this.words.filter(w => w.pos === this.selectedPos);
    if (!allPosWords.length) return [];

    const parts = this.selectedDayId.split('-');
    const localDayNum = parts.length === 2 ? parseInt(parts[1], 10) : 1;

    const tab = this.posTabs.find(t => t.id === this.selectedPos);
    const totalDays = tab ? tab.totalDays : 6;

    const wordsPerDay = Math.max(1, Math.ceil(allPosWords.length / totalDays));
    const startIdx = ((localDayNum - 1) * wordsPerDay) % allPosWords.length;
    const endIdx = startIdx + wordsPerDay;

    if (endIdx <= allPosWords.length) {
      return allPosWords.slice(startIdx, endIdx);
    } else {
      return [...allPosWords.slice(startIdx), ...allPosWords.slice(0, endIdx - allPosWords.length)];
    }
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
    this.selectedDayId = `${posId}-1`;
    this.currentCardIndex = 0;
    this.cardFlipped = false;
  }

  getStartDayForPos(posId: string): number {
    let startDay = 1;
    for (const tab of this.posTabs) {
      if (tab.id === posId) {
        break;
      }
      startDay += tab.totalDays;
    }
    return startDay;
  }

  getDaysForActivePos(): any[] {
    const tab = this.posTabs.find(t => t.id === this.selectedPos);
    if (!tab) return [];
    
    const startDay = this.getStartDayForPos(this.selectedPos);
    const list = [];
    for (let i = 1; i <= tab.totalDays; i++) {
      const dayNum = startDay + i - 1;
      list.push({
        id: `${tab.id}-${i}`,
        dayNumber: dayNum,
        range: `Từ ${(dayNum - 1) * 50 + 1}-${dayNum * 50}`
      });
    }
    return list;
  }

  startLearning(dayId: string): void {
    this.sessionStartLearnedWords = new Set(this.learnedWords);
    if (dayId !== 'default') {
      this.selectedDayId = dayId;
      const parts = dayId.split('-');
      if (parts.length === 2) {
        const localDayNum = parseInt(parts[1], 10);
        const startDay = this.getStartDayForPos(parts[0]);
        this.selectedDayNumber = startDay + localDayNum - 1;
      }
    } else {
      this.selectedDayId = `${this.selectedPos}-1`;
      this.selectedDayNumber = this.getStartDayForPos(this.selectedPos);
    }
    this.flashcardMode = true;
    this.cardFlipped = false;
    this.currentCardIndex = 0;
    this.changeStudyTab('flashcard');
  }

  markDayCompleted(dayId: string, event: Event): void {
    event.stopPropagation();
    if (this.learnedDays.has(dayId)) {
      this.learnedDays.delete(dayId);
    } else {
      this.learnedDays.add(dayId);
      // Cộng streak & học từ hôm nay
      const today = new Date().toISOString().slice(0, 10);
      if (this.lastStudyDate !== today) {
        this.streakDays = this.streakDays + 1;
        this.lastStudyDate = today;
      } else if (this.streakDays === 0) {
        this.streakDays = 1;
      }
      this.todayWordsLearned = Math.min(10, this.todayWordsLearned + 3);
    }
    this.totalLearnedCount = this.learnedWords.size;
    if (this.totalLearnedCount > this.maxRecord) {
      this.maxRecord = this.totalLearnedCount;
    }
    this.saveCurrentProgress();
  }

  toggleFlashcard(): void {
    if (this.flashcardMode) {
      this.recordSession();
    }
    this.flashcardMode = !this.flashcardMode;
    this.currentCardIndex = 0;
    this.cardFlipped = false;
  }

  recordSession(): void {
    let sessionNouns = 0;
    let sessionVerbs = 0;
    let sessionAdjs = 0;
    let sessionAdvs = 0;

    for (const word of this.learnedWords) {
      if (!this.sessionStartLearnedWords.has(word)) {
        const wordObj = this.words.find(w => w.word === word);
        if (wordObj) {
          if (wordObj.pos === 'noun') sessionNouns++;
          else if (wordObj.pos === 'verb') sessionVerbs++;
          else if (wordObj.pos === 'adj') sessionAdjs++;
          else if (wordObj.pos === 'adv') sessionAdvs++;
        }
      }
    }

    const totalSessionWords = sessionNouns + sessionVerbs + sessionAdjs + sessionAdvs;
    if (totalSessionWords > 0) {
      const newSessionIndex = this.sessionHistoryIndex.length + 1;
      const record = {
        sessionIndex: newSessionIndex,
        date: new Date().toLocaleString('vi-VN'),
        nouns: sessionNouns,
        verbs: sessionVerbs,
        adjs: sessionAdjs,
        advs: sessionAdvs,
        total: totalSessionWords
      };
      this.sessionHistoryIndex.push(record);
      this.sessionStartLearnedWords = new Set(this.learnedWords);
      this.saveCurrentProgress();
    }
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
      this.saveCurrentProgress();
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
        this.totalLearnedCount = this.learnedWords.size;
        if (this.totalLearnedCount > this.maxRecord) {
          this.maxRecord = this.totalLearnedCount;
        }
        const today = new Date().toISOString().slice(0, 10);
        if (this.lastStudyDate !== today) {
          this.streakDays = this.streakDays + 1;
          this.lastStudyDate = today;
        } else if (this.streakDays === 0) {
          this.streakDays = 1;
        }
        this.todayWordsLearned = Math.min(10, this.todayWordsLearned + 3);
      }
      this.recordSession();
      this.saveCurrentProgress();
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
      options.add(word.defVi);
      
      const allDefs = this.words.map(w => w.defVi);
      while (options.size < Math.min(6, allDefs.length)) {
        const randomDef = allDefs[Math.floor(Math.random() * allDefs.length)];
        options.add(randomDef);
      }

      return {
        word: word,
        options: this.shuffleArray(Array.from(options)),
        correctAnswer: word.defVi
      };
    });
    
    setTimeout(() => {
      this.playWordAudio(this.listeningQuestions[0].word.word);
    }, 300);
  }

  playWordAudio(word: string, region: string = 'US'): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = region === 'GB' ? 'en-GB' : 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ phát âm thanh.');
    }
  }

  selectCardIndex(index: number): void {
    this.cardFlipped = false;
    if (index >= 0 && index < this.filteredWords.length) {
      this.currentCardIndex = index;
    }
  }

  selectListeningOption(option: string): void {
    if (this.listeningChecked) return;
    this.selectedListeningAnswer = option;
    this.listeningChecked = true;
    const currentQ = this.listeningQuestions[this.currentListeningIndex];
    if (option === currentQ.correctAnswer) {
      this.listeningScore++;
      this.learnedWords.add(currentQ.word.word);
      this.saveCurrentProgress();
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
      this.recordSession();
    }
  }

  restartListening(): void {
    this.initListening();
  }

  // Scramble Game State
  scrambleQuestions: any[] = [];
  currentScrambleIndex = 0;
  scrambleLetters: any[] = [];
  assembledLetters: any[] = [];
  scrambleChecked = false;
  scrambleFeedback: 'correct' | 'incorrect' | null = null;
  showScrambleResult = false;
  scrambleScore = 0;

  initMatching(): void {
    this.initScramble();
  }

  initScramble(): void {
    this.currentScrambleIndex = 0;
    this.scrambleScore = 0;
    this.showScrambleResult = false;
    this.scrambleFeedback = null;
    this.scrambleChecked = false;

    const list = this.filteredWords;
    if (list.length === 0) return;

    this.scrambleQuestions = list.map(word => {
      return {
        word: word,
        correctAnswer: word.word.toLowerCase()
      };
    });

    this.setupCurrentScramble();
  }

  setupCurrentScramble(): void {
    const currentQ = this.scrambleQuestions[this.currentScrambleIndex];
    if (!currentQ) return;

    this.scrambleFeedback = null;
    this.scrambleChecked = false;
    
    const chars = currentQ.word.word.toLowerCase().split('');
    let shuffled = this.shuffleArray(chars);
    let attempts = 0;
    while (shuffled.join('') === currentQ.word.word.toLowerCase() && attempts < 10 && chars.length > 1) {
      shuffled = this.shuffleArray(chars);
      attempts++;
    }

    this.scrambleLetters = shuffled.map((char: string, index: number) => {
      return { id: index, char: char, used: false };
    });

    this.assembledLetters = Array(chars.length).fill(null);
  }

  clickScrambleLetter(item: any): void {
    if (this.scrambleChecked) return;
    const firstEmptyIndex = this.assembledLetters.findIndex(x => x === null);
    if (firstEmptyIndex !== -1) {
      this.assembledLetters[firstEmptyIndex] = item;
      item.used = true;
    }
  }

  clickAssembledLetter(index: number): void {
    if (this.scrambleChecked) return;
    const item = this.assembledLetters[index];
    if (item !== null) {
      item.used = false;
      this.assembledLetters[index] = null;
    }
  }

  isAssembledIncomplete(): boolean {
    return this.assembledLetters.some(x => x === null);
  }

  checkScrambleAnswer(): void {
    if (this.scrambleChecked) return;
    
    const wordStr = this.assembledLetters.map(x => x ? x.char : '').join('');
    const correctStr = this.scrambleQuestions[this.currentScrambleIndex].correctAnswer;
    
    this.scrambleChecked = true;
    if (wordStr === correctStr) {
      this.scrambleFeedback = 'correct';
      this.scrambleScore++;
      this.learnedWords.add(this.scrambleQuestions[this.currentScrambleIndex].word.word);
      this.saveCurrentProgress();
    } else {
      this.scrambleFeedback = 'incorrect';
    }
  }

  revealScrambleAnswer(): void {
    if (this.scrambleChecked) return;
    const currentQ = this.scrambleQuestions[this.currentScrambleIndex];
    if (!currentQ) return;
    
    const chars = currentQ.word.word.toLowerCase().split('');
    this.assembledLetters = chars.map((char: string, index: number) => {
      return { id: index, char: char, used: true };
    });
    this.scrambleLetters.forEach(l => l.used = true);
    
    this.scrambleChecked = true;
    this.scrambleFeedback = 'incorrect';
  }

  nextScrambleQuestion(): void {
    this.scrambleFeedback = null;
    this.scrambleChecked = false;
    if (this.currentScrambleIndex < this.scrambleQuestions.length - 1) {
      this.currentScrambleIndex++;
      this.setupCurrentScramble();
    } else {
      this.showScrambleResult = true;
      this.recordSession();
    }
  }

  restartScramble(): void {
    this.initScramble();
  }

  // Writing Mode Logic
  // Writing Mode Logic
  writingInputs: { val: string }[] = [];

  initWriting(): void {
    this.currentWritingIndex = 0;
    this.writingScore = 0;
    this.writingChecked = false;
    this.writingFeedback = null;
    this.showWritingResult = false;
    this.writingQuestions = [...this.filteredWords];
    this.setupCurrentWriting();
  }

  setupCurrentWriting(): void {
    const currentQ = this.writingQuestions[this.currentWritingIndex];
    if (!currentQ) return;

    this.writingChecked = false;
    this.writingFeedback = null;
    this.writingInputs = Array(currentQ.word.length).fill(null).map(() => ({ val: '' }));
    
    // Auto focus first input box
    setTimeout(() => {
      const firstInput = document.getElementById('writing-input-0') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 150);
  }

  onCharInput(event: any, index: number): void {
    let value = event.target.value;
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
      this.writingInputs[index].val = value;
    }
    if (value && index < this.writingInputs.length - 1) {
      setTimeout(() => {
        const nextInput = document.getElementById(`writing-input-${index + 1}`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 50); // macro-task delay gives IME (Unikey/EVKey) time to finish its keyup cycle
    }
  }

  onCharKeydown(event: any, index: number): void {
    if (event.key === 'Backspace' && !this.writingInputs[index].val && index > 0) {
      this.writingInputs[index - 1].val = '';
      setTimeout(() => {
        const prevInput = document.getElementById(`writing-input-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }, 30);
    }
  }

  isWritingIncomplete(): boolean {
    return this.writingInputs.some(x => !x.val || x.val.trim() === '');
  }

  checkWritingAnswer(): void {
    if (this.writingChecked) return;
    
    const userWord = this.writingInputs.map(x => x.val).join('').toLowerCase();
    const currentQ = this.writingQuestions[this.currentWritingIndex];
    
    this.writingChecked = true;
    if (userWord === currentQ.word.toLowerCase()) {
      this.writingFeedback = 'correct';
      this.writingScore++;
      this.learnedWords.add(currentQ.word);
      this.saveCurrentProgress();
    } else {
      this.writingFeedback = 'incorrect';
    }
  }

  revealWritingAnswer(): void {
    if (this.writingChecked) return;
    const currentQ = this.writingQuestions[this.currentWritingIndex];
    if (!currentQ) return;
    
    this.writingInputs = currentQ.word.split('').map((char: string) => ({ val: char }));
    this.writingChecked = true;
    this.writingFeedback = 'incorrect';
  }

  nextWritingQuestion(): void {
    this.writingChecked = false;
    this.writingFeedback = null;
    if (this.currentWritingIndex < this.writingQuestions.length - 1) {
      this.currentWritingIndex++;
      this.setupCurrentWriting();
    } else {
      this.showWritingResult = true;
      this.recordSession();
    }
  }

  restartWriting(): void {
    this.initWriting();
  }

  trackByIndex(index: number, item: any): any {
    return index;
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
    this.saveCurrentProgress();
  }

  toggleLearned(word: string): void {
    if (this.learnedWords.has(word)) {
      this.learnedWords.delete(word);
    } else {
      this.learnedWords.add(word);
    }
    this.saveCurrentProgress();
  }

  triggerDictionary(): void {
    alert('Chức năng Tra từ nhanh đang được phát triển!');
  }
}

