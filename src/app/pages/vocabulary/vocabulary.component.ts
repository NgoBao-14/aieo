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
    // Danh từ (noun) - 50 Words from screenshots
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
      phonetic: "/'ɔːrdər/",
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
      phonetic: "/ˌæd.və'taɪz.mənt/",
      pos: 'noun',
      defVi: 'Quảng cáo',
      defEn: 'a notice or announcement in a public medium promoting a product, service, or event',
      example: 'The advertisement attracted many customers.',
      exampleVi: 'Quảng cáo đã thu hút nhiều khách hàng.',
      topic: 'business',
      band: 5
    },
    {
      word: 'cost',
      phonetic: "/kɔːst/",
      pos: 'noun',
      defVi: 'Chi phí, giá cả',
      defEn: 'an amount that has to be paid or spent to buy or obtain something',
      example: 'The cost of living has increased significantly.',
      exampleVi: 'Chi phí sinh hoạt đã tăng lên đáng kể.',
      topic: 'business',
      band: 4
    },
    {
      word: 'banquet',
      phonetic: "/'bæŋkwɪt/",
      pos: 'noun',
      defVi: 'Tiệc lớn, tiệc chiêu đãi',
      defEn: 'an elaborate and formal evening meal for many people',
      example: 'The banquet was held in the grand ballroom.',
      exampleVi: 'Buổi tiệc chiêu đãi được tổ chức tại phòng khiêu vũ lớn.',
      topic: 'events',
      band: 5
    },
    {
      word: 'game',
      phonetic: "/ɡeɪm/",
      pos: 'noun',
      defVi: 'Trò chơi, trận đấu',
      defEn: 'an activity that one engages in for amusement or fun',
      example: 'We played a game of chess.',
      exampleVi: 'Chúng tôi đã chơi một ván cờ.',
      topic: 'general',
      band: 4
    },
    {
      word: 'apology',
      phonetic: "/ə'pɑː.lə.dʒi/",
      pos: 'noun',
      defVi: 'Lời xin lỗi',
      defEn: 'a regretful acknowledgment of an offense or failure',
      example: 'Please accept my apology for the delay.',
      exampleVi: 'Xin vui lòng chấp nhận lời xin lỗi của tôi vì sự chậm trễ.',
      topic: 'general',
      band: 5
    },
    {
      word: 'reception',
      phonetic: "/rɪ'sepʃən/",
      pos: 'noun',
      defVi: 'Sự đón tiếp, tiệc chiêu đãi, quầy lễ tân',
      defEn: 'the action of admitting or welcoming people; a formal social occasion',
      example: 'The wedding reception was held at a hotel.',
      exampleVi: 'Tiệc cưới được tổ chức tại một khách sạn.',
      topic: 'events',
      band: 5
    },
    {
      word: 'collection',
      phonetic: "/kə'lekʃən/",
      pos: 'noun',
      defVi: 'Bộ sưu tập, sự thu thập',
      defEn: 'a group of things or people',
      example: 'He has a large collection of stamps.',
      exampleVi: 'Anh ấy có một bộ sưu tập tem lớn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'community',
      phonetic: "/kə'mjuː.nə.ti/",
      pos: 'noun',
      defVi: 'Cộng đồng',
      defEn: 'a group of people living in the same place or having a particular characteristic in common',
      example: 'We live in a close-knit community.',
      exampleVi: 'Chúng tôi sống trong một cộng đồng gắn kết.',
      topic: 'society',
      band: 5
    },
    {
      word: 'entry',
      phonetic: "/'entri/",
      pos: 'noun',
      defVi: 'Lối vào, sự đi vào, bài dự thi',
      defEn: 'an act of going or coming in; an item written in a diary or list',
      example: 'The side entry is locked at night.',
      exampleVi: 'Lối vào bên hông bị khóa vào ban đêm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'ticket',
      phonetic: "/'tɪk.ɪt/",
      pos: 'noun',
      defVi: 'Vé',
      defEn: 'a piece of paper or card that gives the holder a certain right, especially to travel or enter a place',
      example: 'You need a ticket to enter the theatre.',
      exampleVi: 'Bạn cần một chiếc vé để vào rạp hát.',
      topic: 'general',
      band: 4
    },
    {
      word: 'guest',
      phonetic: "/ɡest/",
      pos: 'noun',
      defVi: 'Khách mời, khách trọ',
      defEn: 'a person who is invited to visit someone\'s home or attend a particular social event',
      example: 'She was the guest of honour at the dinner.',
      exampleVi: 'Cô ấy là khách mời danh dự tại bữa tối.',
      topic: 'general',
      band: 4
    },
    {
      word: 'dining',
      phonetic: "/'daɪnɪŋ/",
      pos: 'noun',
      defVi: 'Việc ăn uống, phòng ăn',
      defEn: 'the activity of eating dinner',
      example: 'We have a spacious dining room.',
      exampleVi: 'Chúng tôi có một phòng ăn rộng rãi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'opportunity',
      phonetic: "/ˌɑːpər'tuːnə.ti/",
      pos: 'noun',
      defVi: 'Cơ hội',
      defEn: 'a set of circumstances that makes it possible to do something',
      example: 'Don\'t miss this opportunity to study abroad.',
      exampleVi: 'Đừng bỏ lỡ cơ hội đi du học này.',
      topic: 'general',
      band: 5
    },
    {
      word: 'invitation',
      phonetic: "/ˌɪnvɪ'teɪʃən/",
      pos: 'noun',
      defVi: 'Lời mời, thiệp mời',
      defEn: 'a written or verbal request inviting someone to go somewhere or to do something',
      example: 'Thank you for the invitation to your party.',
      exampleVi: 'Cảm ơn vì lời mời đến bữa tiệc của bạn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'expo',
      phonetic: "/'ekspoʊ/",
      pos: 'noun',
      defVi: 'Hội chợ triển lãm',
      defEn: 'a large international exhibition or trade show',
      example: 'We attended the technology expo.',
      exampleVi: 'Chúng tôi đã tham dự triển lãm công nghệ.',
      topic: 'events',
      band: 5
    },
    {
      word: 'information',
      phonetic: "/ˌɪn.fər'meɪ.ʃən/",
      pos: 'noun',
      defVi: 'Thông tin',
      defEn: 'facts provided or learned about something or someone',
      example: 'For more information, please visit our website.',
      exampleVi: 'Để biết thêm thông tin, xin vui lòng truy cập trang web của chúng tôi.',
      topic: 'general',
      band: 4
    },
    {
      word: 'offer',
      phonetic: "/'ɔː.fər/",
      pos: 'noun',
      defVi: 'Lời đề nghị, sự cung cấp',
      defEn: 'an expression of readiness to do or give something if desired',
      example: 'Thank you for your generous offer.',
      exampleVi: 'Cảm ơn lời đề nghị hào phóng của bạn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'concern',
      phonetic: "/kən'sɜːrn/",
      pos: 'noun',
      defVi: 'Sự lo ngại, mối bận tâm',
      defEn: 'a matter of interest or importance to someone',
      example: 'Global warming is a matter of great concern.',
      exampleVi: 'Nóng lên toàn cầu là một vấn đề rất đáng lo ngại.',
      topic: 'general',
      band: 5
    },
    {
      word: 'booth',
      phonetic: "/buːθ/",
      pos: 'noun',
      defVi: 'Quầy, phòng nhỏ (điện thoại, triển lãm)',
      defEn: 'a temporary structure for keeping or selling goods or for displaying information',
      example: 'We visited the exhibition booth.',
      exampleVi: 'Chúng tôi đã ghé thăm quầy triển lãm.',
      topic: 'events',
      band: 5
    },
    {
      word: 'newspaper',
      phonetic: "/'nuːz,peɪpər/",
      pos: 'noun',
      defVi: 'Báo giấy',
      defEn: 'a printed publication consisting of folded sheets and containing news, articles, and advertisements',
      example: 'He reads the daily newspaper every morning.',
      exampleVi: 'Anh ấy đọc tờ báo hàng ngày mỗi sáng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'corner',
      phonetic: "/'cɔːrnər/",
      pos: 'noun',
      defVi: 'Góc (tường, đường)',
      defEn: 'a place or angle where two sides or edges meet',
      example: 'There is a cafe on the corner of the street.',
      exampleVi: 'Có một quán cà phê ở góc đường.',
      topic: 'general',
      band: 4
    },
    {
      word: 'cosmetics',
      phonetic: "/kɑːz'metɪks/",
      pos: 'noun',
      defVi: 'Mỹ phẩm',
      defEn: 'substances put on the face or body to improve the appearance',
      example: 'She spent a lot of money on cosmetics.',
      exampleVi: 'Cô ấy đã chi rất nhiều tiền vào mỹ phẩm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'competition',
      phonetic: "/ˌcɑːmpə'tɪʃn/",
      pos: 'noun',
      defVi: 'Cuộc thi, sự cạnh tranh',
      defEn: 'an event or contest in which people compete',
      example: 'She won first prize in the competition.',
      exampleVi: 'Cô ấy đã đoạt giải nhất trong cuộc thi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'festival',
      phonetic: "/'festɪvəl/",
      pos: 'noun',
      defVi: 'Lễ hội',
      defEn: 'a day or period of celebration, typically a religious one',
      example: 'The music festival attracts thousands of visitors.',
      exampleVi: 'Lễ hội âm nhạc thu hút hàng ngàn du khách.',
      topic: 'events',
      band: 5
    },
    {
      word: 'sale',
      phonetic: "/seɪl/",
      pos: 'noun',
      defVi: 'Việc bán hàng, đợt giảm giá',
      defEn: 'the exchange of a commodity for money; the action of selling something',
      example: 'The house is up for sale.',
      exampleVi: 'Ngôi nhà đang được rao bán.',
      topic: 'business',
      band: 4
    },
    {
      word: 'budget',
      phonetic: "/'bʌdʒɪt/",
      pos: 'noun',
      defVi: 'Ngân sách',
      defEn: 'an estimate of income and expenditure for a set period of time',
      example: 'We must stay within our budget.',
      exampleVi: 'Chúng ta phải chi tiêu trong phạm vi ngân sách của mình.',
      topic: 'business',
      band: 5
    },
    {
      word: 'assignment',
      phonetic: "/ə'saɪnmənt/",
      pos: 'noun',
      defVi: 'Nhiệm vụ, bài tập',
      defEn: 'a task or piece of work assigned to someone as part of a job or course of study',
      example: 'The teacher gave us a difficult assignment.',
      exampleVi: 'Giáo viên đã cho chúng tôi một bài tập khó.',
      topic: 'education',
      band: 5
    },
    {
      word: 'area',
      phonetic: "/'eə.ri.ə/",
      pos: 'noun',
      defVi: 'Khu vực, diện tích',
      defEn: 'a part of a town, a country, or the world',
      example: 'This is a residential area.',
      exampleVi: 'Đây là một khu dân cư.',
      topic: 'general',
      band: 4
    },
    {
      word: 'convention',
      phonetic: "/kən'venʃən/",
      pos: 'noun',
      defVi: 'Hội nghị, hiệp ước, tục lệ',
      defEn: 'a large meeting or conference, especially of members of a political party or a particular profession',
      example: 'The annual convention is held in Chicago.',
      exampleVi: 'Hội nghị thường niên được tổ chức tại Chicago.',
      topic: 'events',
      band: 5
    },
    {
      word: 'campaign',
      phonetic: "/kæm'peɪn/",
      pos: 'noun',
      defVi: 'Chiến dịch',
      defEn: 'a series of military operations intended to achieve a sole objective',
      example: 'The marketing campaign was very successful.',
      exampleVi: 'Chiến dịch tiếp thị đã rất thành công.',
      topic: 'business',
      band: 5
    },
    {
      word: 'transportation',
      phonetic: "/ˌtrænspər'teɪʃn/",
      pos: 'noun',
      defVi: 'Giao thông vận tải, phương tiện đi lại',
      defEn: 'the action of transporting someone or something or the process of being transported',
      example: 'Public transportation is very convenient in this city.',
      exampleVi: 'Giao thông công cộng rất tiện lợi ở thành phố này.',
      topic: 'general',
      band: 5
    },
    {
      word: 'tour',
      phonetic: "/tʊr/",
      pos: 'noun',
      defVi: 'Chuyến du lịch, cuộc tham quan',
      defEn: 'a journey for pleasure in which several different places are visited',
      example: 'We took a guided tour of the museum.',
      exampleVi: 'Chúng tôi đã đi tham quan bảo tàng có hướng dẫn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'fee',
      phonetic: "/fiː/",
      pos: 'noun',
      defVi: 'Phí, học phí',
      defEn: 'a payment made to a professional person or public body in exchange for advice or services',
      example: 'The entrance fee is ten dollars.',
      exampleVi: 'Phí vào cổng là mười đô la.',
      topic: 'general',
      band: 5
    },
    {
      word: 'product',
      phonetic: "/'prɑː.dʌkt/",
      pos: 'noun',
      defVi: 'Sản phẩm',
      defEn: 'an article or substance that is manufactured or refined for sale',
      example: 'The company manufactures dairy products.',
      exampleVi: 'Công ty sản xuất các sản phẩm sữa.',
      topic: 'business',
      band: 4
    },
    {
      word: 'line',
      phonetic: "/laɪn/",
      pos: 'noun',
      defVi: 'Dòng, hàng, đường kẻ',
      defEn: 'a long, narrow mark or band',
      example: 'Please stand in line.',
      exampleVi: 'Vui lòng đứng xếp hàng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'sense',
      phonetic: "/sens/",
      pos: 'noun',
      defVi: 'Giác quan, ý thức, phán đoán',
      defEn: 'a faculty by which the body perceives an external stimulus',
      example: 'He has a good sense of humour.',
      exampleVi: 'Anh ấy có khiếu hài hước tốt.',
      topic: 'general',
      band: 4
    },
    {
      word: 'idea',
      phonetic: "/aɪ'diːə/",
      pos: 'noun',
      defVi: 'Ý tưởng, quan niệm',
      defEn: 'a thought or suggestion as to a possible course of action',
      example: "That's a very good idea.",
      exampleVi: 'Đó là một ý tưởng rất hay.',
      topic: 'general',
      band: 4
    },
    {
      word: 'package',
      phonetic: "/'pækɪdʒ/",
      pos: 'noun',
      defVi: 'Gói hàng, bưu kiện',
      defEn: 'an object or group of objects wrapped in paper or packed in a box',
      example: 'The package was delivered this afternoon.',
      exampleVi: 'Gói hàng đã được giao chiều nay.',
      topic: 'general',
      band: 4
    },
    {
      word: 'program',
      phonetic: "/'proʊɡræm/",
      pos: 'noun',
      defVi: 'Chương trình',
      defEn: 'a planned series of future events, items, or performances',
      example: 'What is your favourite television program?',
      exampleVi: 'Chương trình truyền hình yêu thích của bạn là gì?',
      topic: 'general',
      band: 4
    },
    {
      word: 'opening',
      phonetic: "/'oʊpnɪŋ/",
      pos: 'noun',
      defVi: 'Khe hở, lễ khai mạc, vị trí khuyết',
      defEn: 'an aperture or gap; a beginning',
      example: 'We attended the gallery opening.',
      exampleVi: 'Chúng tôi đã tham dự lễ khai trương phòng trưng bày.',
      topic: 'events',
      band: 5
    },
    {
      word: 'show',
      phonetic: "/ʃoʊ/",
      pos: 'noun',
      defVi: 'Buổi trình diễn, triển lãm',
      defEn: 'a spectacle or display of something, typically an impressive one',
      example: "Let's watch the magic show.",
      exampleVi: 'Hãy cùng xem buổi biểu diễn ảo thuật.',
      topic: 'general',
      band: 4
    },

    // Danh từ (noun) - 48 Words from screenshots Day 2
    {
      word: 'editor',
      phonetic: "/'edɪtər/",
      pos: 'noun',
      defVi: 'Người biên tập, biên tập viên',
      defEn: 'a person who is in charge of and determines the final content of a text, particularly a newspaper or magazine',
      example: 'She works as an editor for a local newspaper.',
      exampleVi: 'Cô ấy làm biên tập viên cho một tờ báo địa phương.',
      topic: 'general',
      band: 5
    },
    {
      word: 'shipment',
      phonetic: "/'ʃɪpmənt/",
      pos: 'noun',
      defVi: 'Sự vận chuyển, lô hàng',
      defEn: 'an amount of goods shipped; cargo',
      example: 'The shipment of new books has arrived.',
      exampleVi: 'Lô hàng sách mới đã được giao tới.',
      topic: 'business',
      band: 5
    },
    {
      word: 'department',
      phonetic: "/dɪ'pɑːrtmənt/",
      pos: 'noun',
      defVi: 'Bộ phận, phòng ban',
      defEn: 'a division of a large organization such as a government, university, or business',
      example: 'He is the head of the marketing department.',
      exampleVi: 'Anh ấy là trưởng bộ phận tiếp thị.',
      topic: 'business',
      band: 4
    },
    {
      word: 'error',
      phonetic: "/'erər/",
      pos: 'noun',
      defVi: 'Lỗi, sai sót',
      defEn: 'a mistake',
      example: 'The computer program contains a spelling error.',
      exampleVi: 'Chương trình máy tính có chứa một lỗi chính tả.',
      topic: 'general',
      band: 4
    },
    {
      word: 'application',
      phonetic: "/ˌæplɪ'keɪʃn/",
      pos: 'noun',
      defVi: 'Đơn ứng tuyển, ứng dụng',
      defEn: 'a formal request to an authority for something; a software program',
      example: 'She submitted her job application yesterday.',
      exampleVi: 'Cô ấy đã nộp đơn ứng tuyển xin việc vào ngày hôm qua.',
      topic: 'general',
      band: 5
    },
    {
      word: 'representative',
      phonetic: "/ˌreprɪ'zentətɪv/",
      pos: 'noun',
      defVi: 'Người đại diện',
      defEn: 'a person chosen or appointed to act or speak for others',
      example: 'Our customer service representative will help you.',
      exampleVi: 'Đại diện dịch vụ khách hàng của chúng tôi sẽ giúp bạn.',
      topic: 'business',
      band: 5
    },
    {
      word: 'decorations',
      phonetic: "/ˌdekə'reɪʃnz/",
      pos: 'noun',
      defVi: 'Đồ trang trí, sự trang trí',
      defEn: 'things that make something look more attractive on special occasions',
      example: 'They put up Christmas decorations in the living room.',
      exampleVi: 'Họ treo những đồ trang trí Giáng sinh trong phòng khách.',
      topic: 'general',
      band: 5
    },
    {
      word: 'recommendation',
      phonetic: "/ˌrekəmen'deɪʃn/",
      pos: 'noun',
      defVi: 'Sự đề xuất, thư giới thiệu',
      defEn: 'a suggestion or proposal as to the best course of action',
      example: 'The committee made several recommendations for change.',
      exampleVi: 'Ủy ban đã đưa ra một số khuyến nghị thay đổi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'message',
      phonetic: "/'mesɪdʒ/",
      pos: 'noun',
      defVi: 'Tin nhắn',
      defEn: 'a verbal, written, or recorded communication sent to or left for a recipient',
      example: 'Please leave a message after the tone.',
      exampleVi: 'Vui lòng để lại tin nhắn sau tiếng bíp.',
      topic: 'general',
      band: 4
    },
    {
      word: 'status',
      phonetic: "/'stætəs/",
      pos: 'noun',
      defVi: 'Trạng thái, địa vị',
      defEn: 'the relative social, professional, or other standing of someone or something',
      example: 'What is the delivery status of my order?',
      exampleVi: 'Trạng thái giao hàng của đơn hàng của tôi là gì?',
      topic: 'general',
      band: 5
    },
    {
      word: 'charge',
      phonetic: "/tʃɑːrdʒ/",
      pos: 'noun',
      defVi: 'Tiền phí, nhiệm vụ',
      defEn: 'a price asked for goods or services; responsibility',
      example: 'There is no extra charge for delivery.',
      exampleVi: 'Không tính thêm phí vận chuyển.',
      topic: 'business',
      band: 4
    },
    {
      word: 'appliance',
      phonetic: "/ə'plaɪəns/",
      pos: 'noun',
      defVi: 'Thiết bị, dụng cụ',
      defEn: 'a device or piece of equipment designed to perform a specific task, typically a domestic one',
      example: 'They sell a wide range of kitchen appliances.',
      exampleVi: 'Họ bán rất nhiều loại thiết bị nhà bếp.',
      topic: 'general',
      band: 5
    },
    {
      word: 'estate',
      phonetic: "/ɪ'steɪt/",
      pos: 'noun',
      defVi: 'Bất động sản, di sản',
      defEn: 'an area of land; all the money and property owned by a particular person',
      example: 'She works for a real estate agency.',
      exampleVi: 'Cô ấy làm việc cho một văn phòng bất động sản.',
      topic: 'business',
      band: 5
    },
    {
      word: 'service',
      phonetic: "/'sɜːrvɪs/",
      pos: 'noun',
      defVi: 'Dịch vụ',
      defEn: 'the action of helping or doing work for someone',
      example: 'The hotel is known for its excellent service.',
      exampleVi: 'Khách sạn nổi tiếng với dịch vụ xuất sắc.',
      topic: 'general',
      band: 4
    },
    {
      word: 'article',
      phonetic: "/'ɑːrtɪkl/",
      pos: 'noun',
      defVi: 'Bài báo, điều khoản',
      defEn: 'a piece of writing included with others in a newspaper, magazine, or other publication',
      example: 'I read an interesting article about artificial intelligence.',
      exampleVi: 'Tôi đã đọc một bài báo thú vị về trí tuệ nhân tạo.',
      topic: 'general',
      band: 4
    },
    {
      word: 'record',
      phonetic: "/'rekərd/",
      pos: 'noun',
      defVi: 'Hồ sơ, kỷ lục, ghi chép',
      defEn: 'a thing constituting a piece of evidence about the past',
      example: 'Keep a record of your expenses.',
      exampleVi: 'Hãy giữ một ghi chép về các khoản chi tiêu của bạn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'gardening',
      phonetic: "/'ɡɑːrdənɪŋ/",
      pos: 'noun',
      defVi: 'Công việc làm vườn',
      defEn: 'the activity of tending and cultivating a garden',
      example: 'My grandfather enjoys gardening in his free time.',
      exampleVi: 'Ông tôi thích làm vườn vào thời gian rảnh rỗi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'quality',
      phonetic: "/'kwɑːləti/",
      pos: 'noun',
      defVi: 'Chất lượng',
      defEn: 'the standard of something as measured against other things of a similar kind',
      example: 'We aim to provide products of the highest quality.',
      exampleVi: 'Chúng tôi hướng tới việc cung cấp các sản phẩm có chất lượng cao nhất.',
      topic: 'general',
      band: 4
    },
    {
      word: 'pay',
      phonetic: "/peɪ/",
      pos: 'noun',
      defVi: 'Tiền lương',
      defEn: 'money paid to someone for regular work or services',
      example: 'The workers are demanding better pay and conditions.',
      exampleVi: 'Các công nhân đang yêu cầu mức lương và điều kiện tốt hơn.',
      topic: 'business',
      band: 4
    },
    {
      word: 'employee',
      phonetic: "/ɪm'plɔɪiː/",
      pos: 'noun',
      defVi: 'Nhân viên',
      defEn: 'a person employed for wages or salary, especially at non-executive level',
      example: 'The company has over five hundred employees.',
      exampleVi: 'Công ty có hơn năm trăm nhân viên.',
      topic: 'business',
      band: 4
    },
    {
      word: 'magazine',
      phonetic: "/'mæɡəziːn/",
      pos: 'noun',
      defVi: 'Tạp chí',
      defEn: 'a periodical publication containing articles and illustrations, typically on a particular subject',
      example: 'She reads a fashion magazine every week.',
      exampleVi: 'Cô ấy đọc tạp chí thời trang mỗi tuần.',
      topic: 'general',
      band: 4
    },
    {
      word: 'supplier',
      phonetic: "/sə'plaɪər/",
      pos: 'noun',
      defVi: 'Nhà cung cấp',
      defEn: 'a person or organization that provides something needed, such as a product or service',
      example: 'They are the main supplier of office equipment.',
      exampleVi: 'Họ là nhà cung cấp thiết bị văn phòng chính.',
      topic: 'business',
      band: 5
    },
    {
      word: 'auto',
      phonetic: "/'ɔːtoʊ/",
      pos: 'noun',
      defVi: 'Ô tô, tự động',
      defEn: 'an automobile; car',
      example: 'He works in the auto industry.',
      exampleVi: 'Anh ấy làm việc trong ngành công nghiệp ô tô.',
      topic: 'general',
      band: 5
    },
    {
      word: 'belongings',
      phonetic: "/bɪ'lɔːŋɪŋz/",
      pos: 'noun',
      defVi: 'Đồ dùng cá nhân, đồ sở hữu',
      defEn: 'one\'s movable personal property',
      example: 'Please make sure you have all your personal belongings.',
      exampleVi: 'Vui lòng kiểm tra chắc chắn bạn mang theo tất cả đồ dùng cá nhân.',
      topic: 'general',
      band: 5
    },
    {
      word: 'vacuum',
      phonetic: "/'vækjuːm/",
      pos: 'noun',
      defVi: 'Máy hút bụi, chân không',
      defEn: 'a vacuum cleaner; a space entirely devoid of matter',
      example: 'She cleaned the carpet with a vacuum.',
      exampleVi: 'Cô ấy đã làm sạch thảm bằng máy hút bụi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'control',
      phonetic: "/kən'troʊl/",
      pos: 'noun',
      defVi: 'Sự kiểm soát',
      defEn: 'the power to influence or direct people\'s behavior or the course of events',
      example: 'The government has lost control of the situation.',
      exampleVi: 'Chính phủ đã mất kiểm soát tình hình.',
      topic: 'general',
      band: 4
    },
    {
      word: 'responsibility',
      phonetic: "/rɪˌspɑːnsə'bɪləti/",
      pos: 'noun',
      defVi: 'Trách nhiệm',
      defEn: 'the state or fact of having a duty to deal with something',
      example: 'It is your responsibility to lock the door.',
      exampleVi: 'Trách nhiệm của bạn là khóa cửa.',
      topic: 'general',
      band: 5
    },
    {
      word: 'maintenance',
      phonetic: "/'meɪntənəns/",
      pos: 'noun',
      defVi: 'Sự bảo trì, bảo dưỡng',
      defEn: 'the process of maintaining or preserving someone or something',
      example: 'The car needs regular maintenance.',
      exampleVi: 'Chiếc xe cần được bảo trì thường xuyên.',
      topic: 'business',
      band: 5
    },
    {
      word: 'manufacturing',
      phonetic: "/ˌmænju'fæktʃərɪŋ/",
      pos: 'noun',
      defVi: 'Sự sản xuất, chế tạo',
      defEn: 'the making of articles on a large scale using machinery',
      example: 'Manufacturing jobs have decreased in the region.',
      exampleVi: 'Các công việc sản xuất đã giảm trong khu vực.',
      topic: 'business',
      band: 5
    },
    {
      word: 'party',
      phonetic: "/'pɑːrti/",
      pos: 'noun',
      defVi: 'Bữa tiệc, các bên liên quan, đảng phái',
      defEn: 'a social gathering of invited guests; a political group',
      example: 'Are you going to the party tonight?',
      exampleVi: 'Bạn có đi dự tiệc tối nay không?',
      topic: 'general',
      band: 4
    },
    {
      word: 'gear',
      phonetic: "/ɡɪr/",
      pos: 'noun',
      defVi: 'Thiết bị, bánh răng, số xe',
      defEn: 'one of a set of toothed wheels; equipment used for a particular activity',
      example: 'Make sure you have the right gear for climbing.',
      exampleVi: 'Hãy chắc chắn bạn có đúng thiết bị để leo núi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'mechanic',
      phonetic: "/mə'kænɪk/",
      pos: 'noun',
      defVi: 'Thợ cơ khí',
      defEn: 'a person who repairs and maintains machinery',
      example: 'The mechanic is repairing my car.',
      exampleVi: 'Người thợ cơ khí đang sửa xe của tôi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'column',
      phonetic: "/'kɑːləm/",
      pos: 'noun',
      defVi: 'Cột (báo, nhà)',
      defEn: 'an upright pillar; a vertical division of a page',
      example: 'She writes a weekly column for the newspaper.',
      exampleVi: 'Cô ấy viết một cột báo hàng tuần cho tờ báo.',
      topic: 'general',
      band: 5
    },
    {
      word: 'item',
      phonetic: "/'aɪtəm/",
      pos: 'noun',
      defVi: 'Mặt hàng, khoản',
      defEn: 'an individual article or unit, especially one that is part of a list',
      example: 'The item was listed on the receipt.',
      exampleVi: 'Mặt hàng đã được liệt kê trên biên lai.',
      topic: 'general',
      band: 4
    },
    {
      word: 'client',
      phonetic: "/'klaɪənt/",
      pos: 'noun',
      defVi: 'Khách hàng',
      defEn: 'a person or organization using the services of a lawyer or other professional person',
      example: 'We must focus on meeting the client\'s needs.',
      exampleVi: 'Chúng ta phải tập trung vào việc đáp ứng nhu cầu của khách hàng.',
      topic: 'business',
      band: 5
    },
    {
      word: 'schedule',
      phonetic: "/'skedʒuːl/",
      pos: 'noun',
      defVi: 'Lịch trình, thời khóa biểu',
      defEn: 'a plan for carrying out a process or procedure',
      example: 'We are running behind schedule.',
      exampleVi: 'Chúng tôi đang chạy chậm hơn lịch trình.',
      topic: 'general',
      band: 5
    },
    {
      word: 'publisher',
      phonetic: "/'pʌblɪʃər/",
      pos: 'noun',
      defVi: 'Nhà xuất bản',
      defEn: 'a person or company that prepares and issues books, journals, or music for sale',
      example: 'The publisher decided to release a new edition.',
      exampleVi: 'Nhà xuất bản quyết định phát hành một phiên bản mới.',
      topic: 'general',
      band: 5
    },
    {
      word: 'part',
      phonetic: "/pɑːrt/",
      pos: 'noun',
      defVi: 'Phần, bộ phận',
      defEn: 'an element or constituent that is separated, or can be considered separately',
      example: 'This is the best part of the movie.',
      exampleVi: 'Đây là phần hay nhất của bộ phim.',
      topic: 'general',
      band: 4
    },
    {
      word: 'supply',
      phonetic: "/sə'plaɪ/",
      pos: 'noun',
      defVi: 'Nguồn cung cấp, sự cung cấp',
      defEn: 'a stock of a resource from which a person or place can be provided',
      example: 'The water supply was cut off during the repairs.',
      exampleVi: 'Nguồn cung cấp nước đã bị cắt trong quá trình sửa chữa.',
      topic: 'general',
      band: 4
    },
    {
      word: 'track',
      phonetic: "/træk/",
      pos: 'noun',
      defVi: 'Đường ray, dấu vết, đường mòn',
      defEn: 'a rough path or road; a mark left by something',
      example: 'We followed the track through the forest.',
      exampleVi: 'Chúng tôi đi theo con đường mòn xuyên qua khu rừng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'sales',
      phonetic: "/seɪlz/",
      pos: 'noun',
      defVi: 'Doanh thu, việc bán hàng',
      defEn: 'the exchange of a commodity for money; activities relating to selling',
      example: 'Sales have increased by ten percent this month.',
      exampleVi: 'Doanh số bán hàng đã tăng mười phần trăm trong tháng này.',
      topic: 'business',
      band: 4
    },
    {
      word: 'interest',
      phonetic: "/'ɪntrɪst/",
      pos: 'noun',
      defVi: 'Sở thích, lãi suất, sự quan tâm',
      defEn: 'the state of wanting to know or learn about something; money paid regularly at a particular rate',
      example: 'He has an interest in photography.',
      exampleVi: 'Anh ấy có sở thích chụp ảnh.',
      topic: 'general',
      band: 4
    },
    {
      word: 'workshop',
      phonetic: "/'wɜːrkʃɑːp/",
      pos: 'noun',
      defVi: 'Hội thảo, xưởng',
      defEn: 'a meeting at which a group of people engage in intensive discussion and activity on a particular subject',
      example: 'We attended a creative writing workshop.',
      exampleVi: 'Chúng tôi đã tham dự một buổi hội thảo viết lách sáng tạo.',
      topic: 'general',
      band: 5
    },
    {
      word: 'agency',
      phonetic: "/'eɪdʒənsi/",
      pos: 'noun',
      defVi: 'Đại lý, cơ quan',
      defEn: 'a business or organization established to provide a particular service',
      example: 'She works for an advertising agency.',
      exampleVi: 'Cô ấy làm việc cho một công ty quảng cáo.',
      topic: 'business',
      band: 5
    },
    {
      word: 'warehouse',
      phonetic: "/'werhaʊs/",
      pos: 'noun',
      defVi: 'Nhà kho',
      defEn: 'a large building where raw materials or manufactured goods may be stored before their export or sale',
      example: 'The goods are stored in the warehouse.',
      exampleVi: 'Hàng hóa được lưu trữ trong nhà kho.',
      topic: 'business',
      band: 5
    },
    {
      word: 'raise',
      phonetic: "/reɪz/",
      pos: 'noun',
      defVi: 'Sự tăng lương',
      defEn: 'an increase in salary',
      example: 'She asked her boss for a raise.',
      exampleVi: 'Cô ấy đã xin sếp tăng lương.',
      topic: 'business',
      band: 5
    },
    {
      word: 'delivery',
      phonetic: "/dɪ'lɪvəri/",
      pos: 'noun',
      defVi: 'Sự giao hàng',
      defEn: 'the action of delivering letters, packages, or ordered goods',
      example: 'We offer free delivery on orders over fifty dollars.',
      exampleVi: 'Chúng tôi cung cấp dịch vụ giao hàng miễn phí cho các đơn hàng trên năm mươi đô la.',
      topic: 'business',
      band: 5
    },
    {
      word: 'strategy',
      phonetic: "/'strætədʒi/",
      pos: 'noun',
      defVi: 'Chiến lược',
      defEn: 'a plan of action or policy designed to achieve a major or overall aim',
      example: 'We need to develop a new marketing strategy.',
      exampleVi: 'Chúng ta cần xây dựng một chiến lược tiếp thị mới.',
      topic: 'business',
      band: 5
    },

    // Danh từ (noun) - 50 Words from screenshots Day 3
    {
      word: 'utility',
      phonetic: "/juː'tɪləti/",
      pos: 'noun',
      defVi: 'Tiện ích, dịch vụ công cộng',
      defEn: 'the state of being useful, profitable, or beneficial; a public utility service',
      example: 'The cost of utilities has gone up this year.',
      exampleVi: 'Chi phí các dịch vụ tiện ích đã tăng lên trong năm nay.',
      topic: 'general',
      band: 5
    },
    {
      word: 'driver',
      phonetic: "/'draɪvər/",
      pos: 'noun',
      defVi: 'Tài xế, trình điều khiển',
      defEn: 'a person who drives a vehicle; a factor that causes something to happen',
      example: 'He works as a taxi driver in New York.',
      exampleVi: 'Anh ấy làm nghề lái xe taxi ở New York.',
      topic: 'general',
      band: 4
    },
    {
      word: 'assembly',
      phonetic: "/ə'sembli/",
      pos: 'noun',
      defVi: 'Cuộc họp, sự lắp ráp, hội đồng',
      defEn: 'a group of people gathered together in one place for a common purpose; the action of fitting together component parts',
      example: 'The cars are put together on an assembly line.',
      exampleVi: 'Các ô tô được lắp ráp trên một dây chuyền lắp ráp.',
      topic: 'general',
      band: 5
    },
    {
      word: 'counselor',
      phonetic: "/'kaʊnsələr/",
      pos: 'noun',
      defVi: 'Người cố vấn, người tư vấn',
      defEn: 'a person trained to give guidance on personal, social, or psychological problems',
      example: 'She went to see a marriage counselor.',
      exampleVi: 'Cô ấy đã đi gặp người cố vấn hôn nhân.',
      topic: 'general',
      band: 5
    },
    {
      word: 'apartment',
      phonetic: "/ə'pɑːrtmənt/",
      pos: 'noun',
      defVi: 'Căn hộ',
      defEn: 'a suite of rooms forming one residence, typically in a building containing other suites',
      example: 'They live in a small apartment in the city center.',
      exampleVi: 'Họ sống trong một căn hộ nhỏ ở trung tâm thành phố.',
      topic: 'general',
      band: 4
    },
    {
      word: 'decision',
      phonetic: "/dɪ'sɪʒn/",
      pos: 'noun',
      defVi: 'Quyết định',
      defEn: 'a conclusion or resolution reached after consideration',
      example: 'It was a difficult decision to make.',
      exampleVi: 'Đó là một quyết định khó khăn để đưa ra.',
      topic: 'general',
      band: 4
    },
    {
      word: 'equipment',
      phonetic: "/ɪ'kwɪpmənt/",
      pos: 'noun',
      defVi: 'Thiết bị, dụng cụ',
      defEn: 'the necessary items for a particular purpose',
      example: 'The laboratory is fitted with state-of-the-art equipment.',
      exampleVi: 'Phòng thí nghiệm được trang bị các thiết bị tối tân.',
      topic: 'general',
      band: 4
    },
    {
      word: 'factory',
      phonetic: "/'fæktəri/",
      pos: 'noun',
      defVi: 'Nhà máy',
      defEn: 'a building or group of buildings where goods are manufactured or assembled chiefly by machine',
      example: 'He works in a shoe factory.',
      exampleVi: 'Anh ấy làm việc trong một nhà máy giày.',
      topic: 'general',
      band: 4
    },
    {
      word: 'agent',
      phonetic: "/'eɪdʒənt/",
      pos: 'noun',
      defVi: 'Đại lý, điệp viên, tác nhân',
      defEn: 'a person who acts on behalf of another person or group',
      example: 'She works as a real estate agent.',
      exampleVi: 'Cô ấy làm việc như một đại lý bất động sản.',
      topic: 'general',
      band: 4
    },
    {
      word: 'salesperson',
      phonetic: "/'seɪlzˌpɜːrsn/",
      pos: 'noun',
      defVi: 'Nhân viên bán hàng',
      defEn: 'an individual of either sex who sells goods',
      example: 'The salesperson explained the features of the car.',
      exampleVi: 'Nhân viên bán hàng đã giải thích các tính năng của chiếc xe.',
      topic: 'general',
      band: 5
    },
    {
      word: 'supervisor',
      phonetic: "/'suːpərvaɪzər/",
      pos: 'noun',
      defVi: 'Người giám sát',
      defEn: 'a person who stands over or supervises a person or activity',
      example: 'You must report the issue to your supervisor.',
      exampleVi: 'Bạn phải báo cáo vấn đề cho người giám sát của bạn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'accounting',
      phonetic: "/ə'kaʊntɪŋ/",
      pos: 'noun',
      defVi: 'Kế toán, ngành kế toán',
      defEn: 'the action or process of keeping financial accounts',
      example: 'She is studying accounting at university.',
      exampleVi: 'Cô ấy đang học ngành kế toán tại trường đại học.',
      topic: 'general',
      band: 5
    },
    {
      word: 'walk',
      phonetic: "/wɔːk/",
      pos: 'noun',
      defVi: 'Đi bộ, lối đi bộ',
      defEn: 'an act of traveling or going on foot; a path',
      example: 'Let\'s go for a walk in the park.',
      exampleVi: 'Chúng ta hãy đi dạo trong công viên.',
      topic: 'general',
      band: 4
    },
    {
      word: 'contractor',
      phonetic: "/'kɑːnˌtræktər/",
      pos: 'noun',
      defVi: 'Nhà thầu',
      defEn: 'a person or company that undertakes a contract to provide materials or labor',
      example: 'They hired a contractor to renovate the kitchen.',
      exampleVi: 'Họ đã thuê một nhà thầu để cải tạo nhà bếp.',
      topic: 'general',
      band: 5
    },
    {
      word: 'consumer',
      phonetic: "/kən'suːmər/",
      pos: 'noun',
      defVi: 'Người tiêu dùng',
      defEn: 'a person who purchases goods and services for personal use',
      example: 'Consumer spending has increased this quarter.',
      exampleVi: 'Chi tiêu tiêu dùng đã tăng trong quý này.',
      topic: 'general',
      band: 5
    },
    {
      word: 'station',
      phonetic: "/'steɪʃn/",
      pos: 'noun',
      defVi: 'Trạm, nhà ga',
      defEn: 'a place where passenger trains or buses regularly stop; a broadcasting company',
      example: 'Meet me at the train station.',
      exampleVi: 'Gặp tôi ở nhà ga xe lửa.',
      topic: 'general',
      band: 4
    },
    {
      word: 'directions',
      phonetic: "/daɪ'rekʃnz/",
      pos: 'noun',
      defVi: 'Chỉ dẫn, phương hướng',
      defEn: 'instructions on how to reach a place or how to do something',
      example: 'Can you give me directions to the post office?',
      exampleVi: 'Bạn có thể chỉ đường cho tôi đến bưu điện không?',
      topic: 'general',
      band: 5
    },
    {
      word: 'construction',
      phonetic: "/kən'strʌkʃn/",
      pos: 'noun',
      defVi: 'Sự xây dựng, ngành xây dựng',
      defEn: 'the building of something, typically a large structure',
      example: 'The road is closed due to construction.',
      exampleVi: 'Con đường bị đóng cửa do đang thi công xây dựng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'retail',
      phonetic: "/'riːteɪl/",
      pos: 'noun',
      defVi: 'Bán lẻ',
      defEn: 'the sale of goods to the public in relatively small quantities for use or consumption',
      example: 'She works in the retail trade.',
      exampleVi: 'Cô ấy làm việc trong ngành buôn bán bán lẻ.',
      topic: 'general',
      band: 5
    },
    {
      word: 'appointment',
      phonetic: "/ə'pɔɪntmənt/",
      pos: 'noun',
      defVi: 'Cuộc hẹn, sự bổ nhiệm',
      defEn: 'an arrangement to meet someone at a particular time and place',
      example: 'I have an appointment with the doctor at ten.',
      exampleVi: 'Tôi có một cuộc hẹn với bác sĩ lúc mười giờ.',
      topic: 'general',
      band: 5
    },
    {
      word: 'subway',
      phonetic: "/'sʌbˌweɪ/",
      pos: 'noun',
      defVi: 'Tàu điện ngầm',
      defEn: 'an underground railway system',
      example: 'I take the subway to work every morning.',
      exampleVi: 'Tôi đi tàu điện ngầm đi làm mỗi sáng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'expressway',
      phonetic: "/ɪk'presweɪ/",
      pos: 'noun',
      defVi: 'Đường cao tốc',
      defEn: 'a highway designed for fast travel',
      example: 'The expressway connects the airport to the city.',
      exampleVi: 'Đường cao tốc nối sân bay với thành phố.',
      topic: 'general',
      band: 5
    },
    {
      word: 'process',
      phonetic: "/'prɑːses/",
      pos: 'noun',
      defVi: 'Quá trình, quy trình',
      defEn: 'a series of actions or steps taken in order to achieve a particular end',
      example: 'The application process takes three weeks.',
      exampleVi: 'Quy trình nộp đơn mất ba tuần.',
      topic: 'general',
      band: 4
    },
    {
      word: 'attention',
      phonetic: "/ə'tenʃn/",
      pos: 'noun',
      defVi: 'Sự chú ý',
      defEn: 'notice taken of someone or something; the regarding of someone or something as interesting or important',
      example: 'Please pay attention to the safety instructions.',
      exampleVi: 'Vui lòng chú ý đến các hướng dẫn an toàn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'group',
      phonetic: "/ɡruːp/",
      pos: 'noun',
      defVi: 'Nhóm',
      defEn: 'a number of people or things that are located close together or are considered or classed together',
      example: 'A group of students stood outside.',
      exampleVi: 'Một nhóm học sinh đứng bên ngoài.',
      topic: 'general',
      band: 4
    },
    {
      word: 'system',
      phonetic: "/'sɪstəm/",
      pos: 'noun',
      defVi: 'Hệ thống',
      defEn: 'a set of things working together as parts of a mechanism or an interconnecting network',
      example: 'The school system has undergone reform.',
      exampleVi: 'Hệ thống trường học đã trải qua cải cách.',
      topic: 'general',
      band: 4
    },
    {
      word: 'pharmacist',
      phonetic: "/'fɑːrməsɪst/",
      pos: 'noun',
      defVi: 'Dược sĩ',
      defEn: 'a person who is professionally qualified to prepare and dispense medicinal drugs',
      example: 'Ask the pharmacist for advice on over-the-counter medicine.',
      exampleVi: 'Hãy hỏi dược sĩ lời khuyên về các loại thuốc không kê đơn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'payroll',
      phonetic: "/'peɪroʊl/",
      pos: 'noun',
      defVi: 'Bảng lương, tổng quỹ lương',
      defEn: 'a list of a company\'s employees and the amount of money they are to be paid',
      example: 'The company has over three thousand people on the payroll.',
      exampleVi: 'Công ty có hơn ba nghìn người trong danh sách trả lương.',
      topic: 'general',
      band: 5
    },
    {
      word: 'profits',
      phonetic: "/'prɑːfɪts/",
      pos: 'noun',
      defVi: 'Lợi nhuận',
      defEn: 'a financial gain, especially the difference between the amount earned and the amount spent',
      example: 'Company profits rose by twenty percent.',
      exampleVi: 'Lợi nhuận của công ty đã tăng hai mươi phần trăm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'receptionist',
      phonetic: "/rɪ'sepʃənɪst/",
      pos: 'noun',
      defVi: 'Nhân viên lễ tân',
      defEn: 'a person who greets and deals with clients and visitors calling at an office, hotel, or other establishment',
      example: 'The receptionist welcomed us to the office.',
      exampleVi: 'Nhân viên lễ tân chào đón chúng tôi đến văn phòng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'location',
      phonetic: "/loʊ'keɪʃn/",
      pos: 'noun',
      defVi: 'Vị trí, địa điểm',
      defEn: 'a particular place or position',
      example: 'The hotel is in a beautiful location.',
      exampleVi: 'Khách sạn nằm ở một vị trí đẹp.',
      topic: 'general',
      band: 4
    },
    {
      word: 'machine',
      phonetic: "/mə'ʃiːn/",
      pos: 'noun',
      defVi: 'Máy móc, thiết bị',
      defEn: 'an apparatus using mechanical power and having several parts, each with a definite function',
      example: 'The washing machine is broken.',
      exampleVi: 'Máy giặt đã bị hỏng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'hiring',
      phonetic: "/'haɪərɪŋ/",
      pos: 'noun',
      defVi: 'Việc tuyển dụng',
      defEn: 'the action of employing someone',
      example: 'The company is freezing new hiring for this quarter.',
      exampleVi: 'Công ty đang đóng băng việc tuyển dụng mới cho quý này.',
      topic: 'general',
      band: 5
    },
    {
      word: 'release',
      phonetic: "/rɪ'liːs/",
      pos: 'noun',
      defVi: 'Sự phát hành, giải phóng',
      defEn: 'the action or process of releasing or being released; publication',
      example: 'The release of the new movie was delayed.',
      exampleVi: 'Sự ra mắt bộ phim mới đã bị trì hoãn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'document',
      phonetic: "/'dɑːkjumənt/",
      pos: 'noun',
      defVi: 'Tài liệu, văn kiện',
      defEn: 'a piece of written, printed, or electronic matter that provides information or evidence',
      example: 'Please sign this document.',
      exampleVi: 'Vui lòng ký tên vào tài liệu này.',
      topic: 'general',
      band: 4
    },
    {
      word: 'procedure',
      phonetic: "/prə'siːdʒər/",
      pos: 'noun',
      defVi: 'Thủ tục, quy trình',
      defEn: 'an established or official way of doing something',
      example: 'What is the standard procedure for applying for a visa?',
      exampleVi: 'Thủ tục tiêu chuẩn để xin thị thực là gì?',
      topic: 'general',
      band: 5
    },
    {
      word: 'facility',
      phonetic: "/fə'sɪləti/",
      pos: 'noun',
      defVi: 'Cơ sở vật chất, trang thiết bị',
      defEn: 'a place, amenity, or piece of equipment provided for a particular purpose',
      example: 'The school has excellent sports facilities.',
      exampleVi: 'Trường học có cơ sở vật chất thể thao xuất sắc.',
      topic: 'general',
      band: 5
    },
    {
      word: 'library',
      phonetic: "/'laɪbreri/",
      pos: 'noun',
      defVi: 'Thư viện',
      defEn: 'a building or room containing collections of books, periodicals, and sometimes films and recorded music',
      example: 'I spent the afternoon studying in the library.',
      exampleVi: 'Tôi dành cả buổi chiều học trong thư viện.',
      topic: 'general',
      band: 4
    },
    {
      word: 'situation',
      phonetic: "/ˌsɪtʃu'eɪʃn/",
      pos: 'noun',
      defVi: 'Tình huống, tình hình',
      defEn: 'a set of circumstances in which one finds oneself',
      example: 'The situation is under control.',
      exampleVi: 'Tình hình đang được kiểm soát.',
      topic: 'general',
      band: 4
    },
    {
      word: 'electronics',
      phonetic: "/ɪˌlek'trɑːnɪks/",
      pos: 'noun',
      defVi: 'Điện tử học, đồ điện tử',
      defEn: 'the branch of physics concerned with electronic circuits; electronic equipment',
      example: 'The store sells consumer electronics.',
      exampleVi: 'Cửa hàng bán đồ điện tử tiêu dùng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'membership',
      phonetic: "/'membərʃɪp/",
      pos: 'noun',
      defVi: 'Tư cách thành viên, thẻ thành viên',
      defEn: 'the state of being a member of a group, club, or organization',
      example: 'Annual membership costs one hundred dollars.',
      exampleVi: 'Tư cách thành viên hàng năm có giá một trăm đô la.',
      topic: 'general',
      band: 5
    },
    {
      word: 'career',
      phonetic: "/kə'rɪr/",
      pos: 'noun',
      defVi: 'Sự nghiệp',
      defEn: 'an occupation undertaken for a significant period of a person\'s life and with opportunities for progress',
      example: 'She decided to pursue a career in medicine.',
      exampleVi: 'Cô ấy quyết định theo đuổi sự nghiệp y khoa.',
      topic: 'general',
      band: 4
    },
    {
      word: 'research',
      phonetic: "/'riːsɜːrtʃ/",
      pos: 'noun',
      defVi: 'Nghiên cứu',
      defEn: 'the systematic investigation into and study of materials and sources in order to establish facts',
      example: 'She is doing research into solar energy.',
      exampleVi: 'Cô ấy đang nghiên cứu về năng lượng mặt trời.',
      topic: 'general',
      band: 4
    },
    {
      word: 'details',
      phonetic: "/'diːteɪlz/",
      pos: 'noun',
      defVi: 'Chi tiết',
      defEn: 'an individual fact or item',
      example: 'Send us your details.',
      exampleVi: 'Hãy gửi cho chúng tôi thông tin chi tiết của bạn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'address',
      phonetic: "/'ædres/",
      pos: 'noun',
      defVi: 'Địa chỉ',
      defEn: 'the particulars of the place where someone lives or an organization is situated',
      example: 'Please write down your name and address.',
      exampleVi: 'Vui lòng ghi lại tên và địa chỉ của bạn.',
      topic: 'general',
      band: 4
    },
    {
      word: 'option',
      phonetic: "/'ɑːpʃn/",
      pos: 'noun',
      defVi: 'Lựa chọn',
      defEn: 'a thing that is or may be chosen',
      example: 'We have several options available.',
      exampleVi: 'Chúng tôi có một vài lựa chọn sẵn có.',
      topic: 'general',
      band: 4
    },
    {
      word: 'complaint',
      phonetic: "/kəm'pleɪnt/",
      pos: 'noun',
      defVi: 'Lời phàn nàn, sự khiếu nại',
      defEn: 'a statement that something is unsatisfactory or unacceptable',
      example: 'The company received several complaints about the service.',
      exampleVi: 'Công ty nhận được một số phàn nàn về dịch vụ.',
      topic: 'general',
      band: 5
    },
    {
      word: 'guide',
      phonetic: "/ɡaɪd/",
      pos: 'noun',
      defVi: 'Hướng dẫn viên, sách hướng dẫn',
      defEn: 'a person who advises or shows the way to others; a book',
      example: 'Our guide showed us around the city.',
      exampleVi: 'Hướng dẫn viên chỉ cho chúng tôi xung quanh thành phố.',
      topic: 'general',
      band: 4
    },
    {
      word: 'expense',
      phonetic: "/ɪk'spens/",
      pos: 'noun',
      defVi: 'Chi phí, khoản chi tiêu',
      defEn: 'the cost required for something; the money spent on something',
      example: 'The company pays for travel expenses.',
      exampleVi: 'Công ty chi trả cho các khoản chi phí đi lại.',
      topic: 'general',
      band: 5
    },
    {
      word: 'furniture',
      phonetic: "/'fɜːrnɪtʃər/",
      pos: 'noun',
      defVi: 'Đồ nội thất, bàn ghế',
      defEn: 'large movable equipment, such as tables and chairs, used to make a house or office suitable for living or working',
      example: 'They bought some new furniture for the living room.',
      exampleVi: 'Họ đã mua một số đồ nội thất mới cho phòng khách.',
      topic: 'general',
      band: 4
    },

    // Danh từ (noun) - 50 Words from screenshots Day 4
    {
      word: 'paperwork',
      phonetic: "/'peɪpərwɜːrk/",
      pos: 'noun',
      defVi: 'Giấy tờ, thủ tục giấy tờ',
      defEn: 'routine clerical or administrative work for a particular job or project',
      example: 'I spent the whole morning doing paperwork.',
      exampleVi: 'Tôi đã dành cả buổi sáng để làm thủ tục giấy tờ.',
      topic: 'general',
      band: 5
    },
    {
      word: 'device',
      phonetic: "/dɪ'vaɪs/",
      pos: 'noun',
      defVi: 'Thiết bị, dụng cụ',
      defEn: 'a thing made or adapted for a particular purpose, especially a piece of mechanical or electronic equipment',
      example: 'This device is used to measure heart rate.',
      exampleVi: 'Thiết bị này được sử dụng để đo nhịp tim.',
      topic: 'general',
      band: 4
    },
    {
      word: 'rush',
      phonetic: "/rʌʃ/",
      pos: 'noun',
      defVi: 'Sự vội vã, giờ cao điểm',
      defEn: 'a sudden rapid flow or movement; a flurry of activity',
      example: 'What is the rush? We have plenty of time.',
      exampleVi: 'Có gì mà phải vội? Chúng ta có nhiều thời gian.',
      topic: 'general',
      band: 4
    },
    {
      word: 'display',
      phonetic: "/dɪ'spleɪ/",
      pos: 'noun',
      defVi: 'Sự trưng bày, màn hình hiển thị',
      defEn: 'a performance, show, or event for people\'s interest or entertainment; screen',
      example: 'The fireworks display was spectacular.',
      exampleVi: 'Màn trình diễn pháo hoa thật ngoạn mục.',
      topic: 'general',
      band: 4
    },
    {
      word: 'supplies',
      phonetic: "/sə'plaɪz/",
      pos: 'noun',
      defVi: 'Nguồn cung cấp, nhu yếu phẩm, đồ dùng',
      defEn: 'necessary items, such as food, equipment, or other goods',
      example: 'We bought office supplies like paper and pens.',
      exampleVi: 'Chúng tôi đã mua văn phòng phẩm như giấy và bút.',
      topic: 'general',
      band: 5
    },
    {
      word: 'chain',
      phonetic: "/tʃeɪn/",
      pos: 'noun',
      defVi: 'Chuỗi (nhà hàng, cửa hàng), dây xích',
      defEn: 'a series of linked metal rings; a group of businesses owned by the same company',
      example: 'He owns a chain of restaurants.',
      exampleVi: 'Anh ấy sở hữu một chuỗi nhà hàng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'executive',
      phonetic: "/ɪɡ'zekjətɪv/",
      pos: 'noun',
      defVi: 'Ủy viên ban điều hành, người quản lý cấp cao',
      defEn: 'a person with senior managerial responsibility in a business organization',
      example: 'She is a top executive in a global software company.',
      exampleVi: 'Cô ấy là một nhà điều hành hàng đầu trong một công ty phần mềm toàn cầu.',
      topic: 'general',
      band: 5
    },
    {
      word: 'stationery',
      phonetic: "/'steɪʃəneri/",
      pos: 'noun',
      defVi: 'Văn phòng phẩm',
      defEn: 'writing materials and office supplies',
      example: 'You can buy envelopes and pens at the stationery store.',
      exampleVi: 'Bạn có thể mua phong bì và bút tại cửa hàng văn phòng phẩm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'exposition',
      phonetic: "/ˌekspə'zɪʃn/",
      pos: 'noun',
      defVi: 'Cuộc triển lãm, hội chợ',
      defEn: 'a large public exhibition of art or trade goods',
      example: 'The international exposition attracted millions of visitors.',
      exampleVi: 'Cuộc triển lãm quốc tế thu hút hàng triệu du khách.',
      topic: 'general',
      band: 5
    },
    {
      word: 'colleague',
      phonetic: "/'kɑːliːɡ/",
      pos: 'noun',
      defVi: 'Đồng nghiệp',
      defEn: 'a person with whom one works in a profession or business',
      example: 'He is a colleague of mine from the bank.',
      exampleVi: 'Anh ấy là một đồng nghiệp của tôi ở ngân hàng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'moment',
      phonetic: "/'moʊmənt/",
      pos: 'noun',
      defVi: 'Khoảnh khắc, chốc lát',
      defEn: 'a very brief period of time',
      example: 'Please wait a moment.',
      exampleVi: 'Vui lòng chờ một lát.',
      topic: 'general',
      band: 4
    },
    {
      word: 'parking',
      phonetic: "/'pɑːrkɪŋ/",
      pos: 'noun',
      defVi: 'Bãi đỗ xe, việc đỗ xe',
      defEn: 'the act of placing a vehicle in a designated space',
      example: 'Is there free parking near the hotel?',
      exampleVi: 'Có bãi đậu xe miễn phí gần khách sạn không?',
      topic: 'general',
      band: 4
    },
    {
      word: 'merchandise',
      phonetic: "/'mɜːrtʃəndaɪz/",
      pos: 'noun',
      defVi: 'Hàng hóa',
      defEn: 'goods to be bought and sold',
      example: 'The store sells a variety of official merchandise.',
      exampleVi: 'Cửa hàng bán rất nhiều mặt hàng lưu niệm chính thức.',
      topic: 'general',
      band: 5
    },
    {
      word: 'counter',
      phonetic: "/'counter/",
      pos: 'noun',
      defVi: 'Quầy bar, quầy thu ngân',
      defEn: 'a long flat-topped structure in a shop, bank, or restaurant across which transactions are made',
      example: 'Please pay at the counter.',
      exampleVi: 'Vui lòng thanh toán tại quầy.',
      topic: 'general',
      band: 4
    },
    {
      word: 'specialist',
      phonetic: "/'speʃəlɪst/",
      pos: 'noun',
      defVi: 'Chuyên gia',
      defEn: 'a person who concentrates on a particular subject or activity',
      example: 'He is a specialist in international law.',
      exampleVi: 'Anh ấy là một chuyên gia về luật quốc tế.',
      topic: 'general',
      band: 5
    },
    {
      word: 'solution',
      phonetic: "/sə'luːʃn/",
      pos: 'noun',
      defVi: 'Giải pháp, dung dịch',
      defEn: 'a means of solving a problem or dealing with a difficult situation',
      example: 'We are looking for a creative solution to this problem.',
      exampleVi: 'Chúng tôi đang tìm kiếm một giải pháp sáng tạo cho vấn đề này.',
      topic: 'general',
      band: 4
    },
    {
      word: 'fingerprint',
      phonetic: "/'fɪŋɡərprɪnt/",
      pos: 'noun',
      defVi: 'Dấu vân tay',
      defEn: 'an impression or mark made on a surface by a person\'s fingertip',
      example: 'The police found fingerprints on the glass.',
      exampleVi: 'Cảnh sát tìm thấy dấu vân tay trên ly thủy tinh.',
      topic: 'general',
      band: 5
    },
    {
      word: 'garage',
      phonetic: "/ɡə'rɑːʒ/",
      pos: 'noun',
      defVi: 'Nhà để xe, xưởng sửa xe',
      defEn: 'a building for housing a motor vehicle or vehicles',
      example: 'The car is in the garage.',
      exampleVi: 'Chiếc xe đang ở trong nhà để xe.',
      topic: 'general',
      band: 4
    },
    {
      word: 'session',
      phonetic: "/'seʃn/",
      pos: 'noun',
      defVi: 'Buổi, phiên (họp, học)',
      defEn: 'a meeting of an official body to conduct its business; a period devoted to a particular activity',
      example: 'The training session starts at nine o\'clock.',
      exampleVi: 'Buổi đào tạo bắt đầu lúc chín giờ.',
      topic: 'general',
      band: 5
    },
    {
      word: 'description',
      phonetic: "/dɪ'skrɪpʃn/",
      pos: 'noun',
      defVi: 'Sự mô tả, bản mô tả',
      defEn: 'a spoken or written representation or account of a person, object, or event',
      example: 'Please write a brief description of the product.',
      exampleVi: 'Vui lòng viết một bản mô tả ngắn gọn về sản phẩm.',
      topic: 'general',
      band: 4
    },
    {
      word: 'distributor',
      phonetic: "/dɪ'strɪbjuːtər/",
      pos: 'noun',
      defVi: 'Nhà phân phối',
      defEn: 'an agent who supplies goods to retailers',
      example: 'They are the sole distributor of this brand in Asia.',
      exampleVi: 'Họ là nhà phân phối độc quyền thương hiệu này tại Châu Á.',
      topic: 'general',
      band: 5
    },
    {
      word: 'behalf',
      phonetic: "/bɪ'hæf/",
      pos: 'noun',
      defVi: 'Thay mặt, nhân danh',
      defEn: 'in the interests of a person, group, or principle',
      example: 'I am speaking on behalf of my colleagues.',
      exampleVi: 'Tôi đang phát biểu thay mặt cho các đồng nghiệp của mình.',
      topic: 'general',
      band: 5
    },
    {
      word: 'discussion',
      phonetic: "/dɪ'skʌʃn/",
      pos: 'noun',
      defVi: 'Sự thảo luận, thảo luận',
      defEn: 'the action or process of talking about something in order to reach a decision or to exchange ideas',
      example: 'We had a useful discussion about the budget.',
      exampleVi: 'Chúng tôi đã có một cuộc thảo luận hữu ích về ngân sách.',
      topic: 'general',
      band: 4
    },
    {
      word: 'partner',
      phonetic: "/'pɑːrtnər/",
      pos: 'noun',
      defVi: 'Đối tác, bạn đời',
      defEn: 'a person who takes part in an undertaking with another or others, especially in a business',
      example: 'They are looking for a business partner.',
      exampleVi: 'Họ đang tìm kiếm một đối tác kinh doanh.',
      topic: 'general',
      band: 4
    },
    {
      word: 'license',
      phonetic: "/'laɪsns/",
      pos: 'noun',
      defVi: 'Giấy phép, bằng lái',
      defEn: 'a permit from an authority to own or use something, do something, or carry on a trade',
      example: 'Do you have a driver\'s license?',
      exampleVi: 'Bạn có bằng lái xe không?',
      topic: 'general',
      band: 5
    },
    {
      word: 'consultation',
      phonetic: "/ˌcɑːnsl'teɪʃn/",
      pos: 'noun',
      defVi: 'Sự tư vấn, sự hội ý',
      defEn: 'the action or process of formally consulting or discussing',
      example: 'The decision was made in consultation with the staff.',
      exampleVi: 'Quyết định được đưa ra sau khi tham khảo ý kiến của nhân viên.',
      topic: 'general',
      band: 5
    },
    {
      word: 'promotion',
      phonetic: "/prə'moʊʃn/",
      pos: 'noun',
      defVi: 'Sự thăng chức, sự quảng bá',
      defEn: 'activity that supports or encourages a cause, venture, or aim; advancement to a higher position',
      example: 'She got a promotion to sales manager.',
      exampleVi: 'Cô ấy đã được thăng chức lên quản lý bán hàng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'professional',
      phonetic: "/prə'feʃənl/",
      pos: 'noun',
      defVi: 'Chuyên gia, người chuyên nghiệp',
      defEn: 'a person engaged or qualified in a profession',
      example: 'She is a healthcare professional.',
      exampleVi: 'Cô ấy là một chuyên gia chăm sóc sức khỏe.',
      topic: 'general',
      band: 5
    },
    {
      word: 'hospitality',
      phonetic: "/ˌhɑːspɪ'tæləti/",
      pos: 'noun',
      defVi: 'Lòng mến khách, ngành dịch vụ (khách sạn, ăn uống)',
      defEn: 'the friendly and generous reception and entertainment of guests or strangers',
      example: 'Thank you for your warm hospitality.',
      exampleVi: 'Cảm ơn lòng mến khách nồng hậu của bạn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'selection',
      phonetic: "/sɪ'lekʃn/",
      pos: 'noun',
      defVi: 'Sự lựa chọn, tuyển tập',
      defEn: 'the action or fact of carefully choosing someone or something as being the best or most suitable',
      example: 'The shop offers a wide selection of books.',
      exampleVi: 'Cửa hàng cung cấp nhiều sự lựa chọn sách.',
      topic: 'general',
      band: 5
    },
    {
      word: 'brand',
      phonetic: "/brænd/",
      pos: 'noun',
      defVi: 'Thương hiệu',
      defEn: 'a type of product manufactured by a particular company under a particular name',
      example: 'This is my favorite brand of coffee.',
      exampleVi: 'Đây là thương hiệu cà phê yêu thích của tôi.',
      topic: 'general',
      band: 4
    },
    {
      word: 'checkout',
      phonetic: "/'tʃekaʊt/",
      pos: 'noun',
      defVi: 'Quầy thanh toán, sự làm thủ tục ra về',
      defEn: 'a point at which goods are paid for in a supermarket or other store',
      example: 'There was a long line at the checkout.',
      exampleVi: 'Có một hàng dài xếp hàng ở quầy thanh toán.',
      topic: 'general',
      band: 5
    },
    {
      word: 'staff',
      phonetic: "/stæf/",
      pos: 'noun',
      defVi: 'Nhân viên, đội ngũ nhân viên',
      defEn: 'all the people employed by a particular organization',
      example: 'The school has a very friendly staff.',
      exampleVi: 'Trường học có đội ngũ nhân viên rất thân thiện.',
      topic: 'general',
      band: 4
    },
    {
      word: 'board',
      phonetic: "/bɔːrd/",
      pos: 'noun',
      defVi: 'Ban giám đốc, bảng gỗ, tấm ván',
      defEn: 'a long, thin, flat piece of wood or other hard material; a group of people who manage an organization',
      example: 'He was invited to join the board of directors.',
      exampleVi: 'Anh ấy đã được mời tham gia vào ban giám đốc.',
      topic: 'general',
      band: 4
    },
    {
      word: 'orientation',
      phonetic: "/ˌɔːriən'teɪʃn/",
      pos: 'noun',
      defVi: 'Sự định hướng, buổi định hướng',
      defEn: 'the action of orienting someone or something; introduction session',
      example: 'The company provides an orientation session for new hires.',
      exampleVi: 'Công ty cung cấp một buổi định hướng cho nhân viên mới tuyển dụng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'candidate',
      phonetic: "/'kændɪdət/",
      pos: 'noun',
      defVi: 'Ứng viên',
      defEn: 'a person who applies for a job or is nominated for election',
      example: 'There are three candidates for the position.',
      exampleVi: 'Có ba ứng cử viên cho vị trí này.',
      topic: 'general',
      band: 5
    },
    {
      word: 'materials',
      phonetic: "/mə'tɪriəlz/",
      pos: 'noun',
      defVi: 'Tài liệu, nguyên vật liệu',
      defEn: 'information or resources; physical substances',
      example: 'We need to prepare the study materials.',
      exampleVi: 'Chúng ta cần chuẩn bị tài liệu học tập.',
      topic: 'general',
      band: 5
    },
    {
      word: 'automobile',
      phonetic: "/'ɔːtəməbiːl/",
      pos: 'noun',
      defVi: 'Xe ô tô',
      defEn: 'a road vehicle, typically with four wheels, powered by an internal combustion engine',
      example: 'The automobile industry is changing fast.',
      exampleVi: 'Ngành công nghiệp ô tô đang thay đổi nhanh chóng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'dish',
      phonetic: "/dɪʃ/",
      pos: 'noun',
      defVi: 'Món ăn, đĩa đựng thức ăn',
      defEn: 'a shallow flat-bottomed container for cooking or serving food; a particular food prepared in a certain way',
      example: 'Pizza is a very popular dish.',
      exampleVi: 'Pizza là một món ăn rất phổ biến.',
      topic: 'general',
      band: 4
    },
    {
      word: 'reporter',
      phonetic: "/rɪ'pɔːrtər/",
      pos: 'noun',
      defVi: 'Phóng viên, nhà báo',
      defEn: 'a person who reports news or conducts interviews for newspapers or broadcasts',
      example: 'The reporter asked several tough questions.',
      exampleVi: 'Phóng viên đã đặt một số câu hỏi hóc búa.',
      topic: 'general',
      band: 5
    },
    {
      word: 'meal',
      phonetic: "/miːl/",
      pos: 'noun',
      defVi: 'Bữa ăn',
      defEn: 'any of the regular occasions in a day when a reasonably large amount of food is eaten',
      example: 'Breakfast is the most important meal of the day.',
      exampleVi: 'Bữa sáng là bữa ăn quan trọng nhất trong ngày.',
      topic: 'general',
      band: 4
    },
    {
      word: 'citizen',
      phonetic: "/'sɪtɪzn/",
      pos: 'noun',
      defVi: 'Công dân',
      defEn: 'a legally recognized subject or national of a state or commonwealth',
      example: 'She is a citizen of both France and Canada.',
      exampleVi: 'Cô ấy là công dân của cả Pháp và Canada.',
      topic: 'general',
      band: 4
    },
    {
      word: 'experience',
      phonetic: "/ɪk'spɪriəns/",
      pos: 'noun',
      defVi: 'Kinh nghiệm, trải nghiệm',
      defEn: 'practical contact with and observation of facts or events',
      example: 'She has five years of experience in teaching.',
      exampleVi: 'Cô ấy có năm năm kinh nghiệm giảng dạy.',
      topic: 'general',
      band: 4
    },
    {
      word: 'farm',
      phonetic: "/fɑːrm/",
      pos: 'noun',
      defVi: 'Trang trại',
      defEn: 'an area of land and its buildings used for growing crops and rearing animals',
      example: 'My uncle lives on a dairy farm.',
      exampleVi: 'Chú tôi sống trên một trang trại sữa.',
      topic: 'general',
      band: 4
    },
    {
      word: 'exhibition',
      phonetic: "/ˌeksɪ'bɪʃn/",
      pos: 'noun',
      defVi: 'Triển lãm, cuộc trưng bày',
      defEn: 'a public display of works of art or items of interest, held in an art gallery or museum',
      example: 'We visited the modern art exhibition.',
      exampleVi: 'Chúng tôi đã ghé thăm triển lãm nghệ thuật hiện đại.',
      topic: 'general',
      band: 5
    },
    {
      word: 'chef',
      phonetic: "/ʃef/",
      pos: 'noun',
      defVi: 'Đầu bếp, bếp trưởng',
      defEn: 'a professional cook, typically the chief cook in a restaurant or hotel',
      example: 'The chef prepared a special dessert.',
      exampleVi: 'Đầu bếp đã chuẩn bị một món tráng miệng đặc biệt.',
      topic: 'general',
      band: 5
    },
    {
      word: 'screen',
      phonetic: "/skriːn/",
      pos: 'noun',
      defVi: 'Màn hình, màn che',
      defEn: 'a flat panel or area on an electronic device on which images and data are displayed',
      example: 'My phone screen is cracked.',
      exampleVi: 'Màn hình điện thoại của tôi bị nứt.',
      topic: 'general',
      band: 4
    },
    {
      word: 'stock',
      phonetic: "/stɑːk/",
      pos: 'noun',
      defVi: 'Cổ phiếu, hàng tồn kho',
      defEn: 'goods or merchandise kept on the premises; share in the ownership of a company',
      example: 'The store has a large stock of winter coats.',
      exampleVi: 'Cửa hàng có một lượng lớn áo khoác mùa đông trong kho.',
      topic: 'general',
      band: 4
    },
    {
      word: 'clothing',
      phonetic: "/'kloʊðɪŋ/",
      pos: 'noun',
      defVi: 'Quần áo',
      defEn: 'clothes collectively',
      example: 'You should wear warm clothing in the winter.',
      exampleVi: 'Bạn nên mặc quần áo ấm vào mùa đông.',
      topic: 'general',
      band: 4
    },
    {
      word: 'review',
      phonetic: "/rɪ'vjuː/",
      pos: 'noun',
      defVi: 'Đánh giá, nhận xét, sự xem lại',
      defEn: 'a formal assessment of something with the possibility or intention of instituting change',
      example: 'He wrote a review of the new restaurant.',
      exampleVi: 'Anh ấy đã viết một bài đánh giá về nhà hàng mới.',
      topic: 'general',
      band: 4
    },

    // Danh từ (noun) - 50 Words from screenshots Day 5
    {
      word: 'credit',
      phonetic: "/'kredɪt/",
      pos: 'noun',
      defVi: 'Tín dụng, lòng tin, danh tiếng',
      defEn: 'the ability of a customer to obtain goods or services before payment, based on the trust that payment will be made in the future',
      example: 'The bank granted them a line of credit.',
      exampleVi: 'Ngân hàng đã cấp cho họ một hạn mức tín dụng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'crew',
      phonetic: "/kruː/",
      pos: 'noun',
      defVi: 'Thành viên tổ lái, phi hành đoàn, đội',
      defEn: 'a group of people who work on and operate a ship, aircraft, etc.',
      example: 'The ambulance crew arrived within minutes.',
      exampleVi: 'Đội xe cứu thương đã đến trong vòng vài phút.',
      topic: 'general',
      band: 4
    },
    {
      word: 'speakers',
      phonetic: "/'spiːkərz/",
      pos: 'noun',
      defVi: 'Loa phóng thanh, diễn giả',
      defEn: 'people who deliver a speech or devices that output sound',
      example: 'The speakers at the conference were very inspiring.',
      exampleVi: 'Các diễn giả tại hội nghị rất truyền cảm hứng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'firm',
      phonetic: "/fɜːrm/",
      pos: 'noun',
      defVi: 'Công ty, hãng',
      defEn: 'a business concern, especially one involving a partnership of two or more people',
      example: 'She works for a prestigious law firm.',
      exampleVi: 'Cô ấy làm việc cho một công ty luật uy tín.',
      topic: 'general',
      band: 4
    },
    {
      word: 'map',
      phonetic: "/mæp/",
      pos: 'noun',
      defVi: 'Bản đồ',
      defEn: 'a diagrammatic representation of an area of land or sea showing physical features',
      example: 'We used a map to find our way around the city.',
      exampleVi: 'Chúng tôi đã sử dụng bản đồ để tìm đường xung quanh thành phố.',
      topic: 'general',
      band: 4
    },
    {
      word: 'vendor',
      phonetic: "/'ven.dər/",
      pos: 'noun',
      defVi: 'Người bán hàng, nhà cung cấp',
      defEn: 'a person or company offering something for sale, especially a trader in the street',
      example: 'We bought some hot dogs from a street vendor.',
      exampleVi: 'Chúng tôi đã mua một ít bánh mì kẹp xúc xích từ một người bán hàng rong.',
      topic: 'general',
      band: 5
    },
    {
      word: 'permission',
      phonetic: "/pər'mɪʃn/",
      pos: 'noun',
      defVi: 'Sự cho phép, quyền hạn',
      defEn: 'consent or authorization',
      example: 'You must ask for permission to use this room.',
      exampleVi: 'Bạn phải xin phép để sử dụng căn phòng này.',
      topic: 'general',
      band: 5
    },
    {
      word: 'partnership',
      phonetic: "/'pɑːrtnərʃɪp/",
      pos: 'noun',
      defVi: 'Quan hệ đối tác, sự cộng tác',
      defEn: 'an association of two or more people as partners',
      example: 'The two companies entered into a strategic partnership.',
      exampleVi: 'Hai công ty đã bước vào một mối quan hệ đối tác chiến lược.',
      topic: 'general',
      band: 5
    },
    {
      word: 'expert',
      phonetic: "/'ekspɜːrt/",
      pos: 'noun',
      defVi: 'Chuyên gia',
      defEn: 'a person who has a comprehensive and authoritative knowledge of or skill in a particular area',
      example: 'She is an expert in child psychology.',
      exampleVi: 'Cô ấy là một chuyên gia về tâm lý học trẻ em.',
      topic: 'general',
      band: 5
    },
    {
      word: 'committee',
      phonetic: "/kə'mɪti/",
      pos: 'noun',
      defVi: 'Ủy ban',
      defEn: 'a group of people appointed for a specific function, typically consisting of members of a larger group',
      example: 'The committee met to discuss the proposal.',
      exampleVi: 'Ủy ban đã họp để thảo luận về đề xuất.',
      topic: 'general',
      band: 5
    },
    {
      word: 'coupon',
      phonetic: "/'kuːpɑːn/",
      pos: 'noun',
      defVi: 'Phiếu giảm giá, vé mua hàng',
      defEn: 'a voucher entitling the holder to a discount for a particular product',
      example: 'Use this coupon to get a ten percent discount.',
      exampleVi: 'Sử dụng phiếu mua hàng này để được giảm giá mười phần trăm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'architecture',
      phonetic: "/'auto/",
      pos: 'noun',
      defVi: 'Kiến trúc, ngành kiến trúc',
      defEn: 'the art or practice of designing and constructing buildings',
      example: 'He is interested in modern architecture.',
      exampleVi: 'Anh ấy quan tâm đến kiến trúc hiện đại.',
      topic: 'general',
      band: 5
    },
    {
      word: 'intern',
      phonetic: "/'ɪntɜːrn/",
      pos: 'noun',
      defVi: 'Thực tập sinh',
      defEn: 'a student or trainee who works, sometimes without pay, at a trade or career in order to gain work experience',
      example: 'She works as an intern at a local hospital.',
      exampleVi: 'Cô ấy làm thực tập sinh tại một bệnh viện địa phương.',
      topic: 'general',
      band: 5
    },
    {
      word: 'catalog',
      phonetic: "/'kætəlɔːɡ/",
      pos: 'noun',
      defVi: 'Danh mục, tập giới thiệu sản phẩm',
      defEn: 'a complete list of items, typically one in systematic order',
      example: 'Please send us your latest catalog.',
      exampleVi: 'Vui lòng gửi cho chúng tôi danh mục sản phẩm mới nhất của bạn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'landlord',
      phonetic: "/'lændlɔːrd/",
      pos: 'noun',
      defVi: 'Chủ nhà, chủ đất',
      defEn: 'a person, especially a man, who rents land, a building, or an apartment to a tenant',
      example: 'The landlord agreed to repair the roof.',
      exampleVi: 'Chủ nhà đã đồng ý sửa mái nhà.',
      topic: 'general',
      band: 5
    },
    {
      word: 'town',
      phonetic: "/taʊn/",
      pos: 'noun',
      defVi: 'Thị trấn, thành phố nhỏ',
      defEn: 'an urban area that has a name, defined boundaries, and local government, that is larger than a village and generally smaller than a city',
      example: 'We spent the weekend in a small coastal town.',
      exampleVi: 'Chúng tôi đã dành cuối tuần ở một thị trấn nhỏ ven biển.',
      topic: 'general',
      band: 4
    },
    {
      word: 'permit',
      phonetic: "/pər'mɪt/",
      pos: 'noun',
      defVi: 'Giấy phép',
      defEn: 'an official document giving someone authorization to do something',
      example: 'You need a permit to park here.',
      exampleVi: 'Bạn cần có giấy phép để đỗ xe ở đây.',
      topic: 'general',
      band: 5
    },
    {
      word: 'tool',
      phonetic: "/tuːl/",
      pos: 'noun',
      defVi: 'Công cụ, dụng cụ',
      defEn: 'a device or implement, especially one held in the hand, used to carry out a particular function',
      example: 'A hammer is a very useful tool.',
      exampleVi: 'Búa là một công cụ rất hữu ích.',
      topic: 'general',
      band: 4
    },
    {
      word: 'vacation',
      phonetic: "/veɪ'keɪʃn/",
      pos: 'noun',
      defVi: 'Kỳ nghỉ, ngày nghỉ',
      defEn: 'an extended period of recreation, especially one spent away from home or in traveling',
      example: 'We are going on vacation next week.',
      exampleVi: 'Chúng tôi sẽ đi nghỉ mát vào tuần tới.',
      topic: 'general',
      band: 4
    },
    {
      word: 'agreement',
      phonetic: "/ə'ɡriːmənt/",
      pos: 'noun',
      defVi: 'Thỏa thuận, hợp đồng, sự đồng ý',
      defEn: 'harmony or accordance in opinion or feeling; a negotiated arrangement',
      example: 'The two countries signed a trade agreement.',
      exampleVi: 'Hai nước đã ký một thỏa thuận thương mại.',
      topic: 'general',
      band: 4
    },
    {
      word: 'range',
      phonetic: "/reɪndʒ/",
      pos: 'noun',
      defVi: 'Phạm vi, dãy, loại',
      defEn: 'the area of variation between upper and lower limits on a particular scale',
      example: 'The hotel offers a wide range of facilities.',
      exampleVi: 'Khách sạn cung cấp nhiều loại cơ sở vật chất.',
      topic: 'general',
      band: 4
    },
    {
      word: 'stadium',
      phonetic: "/'stɪdiəm/",
      pos: 'noun',
      defVi: 'Sân vận động',
      defEn: 'a sports arena with tiers of seats for spectators',
      example: 'The match was played in a packed stadium.',
      exampleVi: 'Trận đấu được diễn ra trong một sân vận động chật kín khán giả.',
      topic: 'general',
      band: 5
    },
    {
      word: 'trip',
      phonetic: "/trɪp/",
      pos: 'noun',
      defVi: 'Chuyến đi, cuộc hành trình',
      defEn: 'a journey or excursion, especially for pleasure',
      example: 'How was your business trip to Tokyo?',
      exampleVi: 'Chuyến công tác đến Tokyo của bạn thế nào?',
      topic: 'general',
      band: 4
    },
    {
      word: 'vehicle',
      phonetic: "/'viːɪkəl/",
      pos: 'noun',
      defVi: 'Phương tiện giao thông, xe cộ',
      defEn: 'a thing used for transporting people or goods, especially on land',
      example: 'The police are searching for the stolen vehicle.',
      exampleVi: 'Cảnh sát đang tìm kiếm chiếc xe bị đánh cắp.',
      topic: 'general',
      band: 4
    },
    {
      word: 'catering',
      phonetic: "/'keɪtərɪŋ/",
      pos: 'noun',
      defVi: 'Dịch vụ ăn uống, phục vụ tiệc',
      defEn: 'the provision of food and drink at a social event or other gathering',
      example: 'The company handles all the catering for the wedding.',
      exampleVi: 'Công ty đảm nhận toàn bộ việc cung cấp đồ ăn thức uống cho đám cưới.',
      topic: 'general',
      band: 5
    },
    {
      word: 'outlet',
      phonetic: "/'aʊtlet/",
      pos: 'noun',
      defVi: 'Cửa hàng đại lý, lối thoát',
      defEn: 'a point from which an industry distributes its products; a socket',
      example: 'They opened a new retail outlet in town.',
      exampleVi: 'Họ đã mở một đại lý bán lẻ mới trong thị trấn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'food',
      phonetic: "/fuːd/",
      pos: 'noun',
      defVi: 'Thực phẩm, thức ăn',
      defEn: 'any nutritious substance that people or animals eat or drink or that plants absorb in order to maintain life and growth',
      example: 'We bought fresh food at the market.',
      exampleVi: 'Chúng tôi đã mua thực phẩm tươi sống ở chợ.',
      topic: 'general',
      band: 4
    },
    {
      word: 'inconvenience',
      phonetic: "/ˌɪnkən'viːniəns/",
      pos: 'noun',
      defVi: 'Sự bất tiện',
      defEn: 'trouble or difficulty caused to one\'s personal comfort or plans',
      example: 'We apologize for any inconvenience caused.',
      exampleVi: 'Chúng tôi xin lỗi vì bất kỳ sự bất tiện nào đã gây ra.',
      topic: 'general',
      band: 5
    },
    {
      word: 'council',
      phonetic: "/'kaʊnsl/",
      pos: 'noun',
      defVi: 'Hội đồng',
      defEn: 'an advisory, deliberative, or legislative body of people formally constituted and meeting regularly',
      example: 'The city council voted on the budget.',
      exampleVi: 'Hội đồng thành phố đã bỏ phiếu về ngân sách.',
      topic: 'general',
      band: 5
    },
    {
      word: 'draft',
      phonetic: "/dræft/",
      pos: 'noun',
      defVi: 'Bản nháp, bản phác thảo',
      defEn: 'a preliminary version of a piece of writing',
      example: 'I need to write a second draft of the essay.',
      exampleVi: 'Tôi cần viết bản thảo thứ hai cho bài luận.',
      topic: 'general',
      band: 4
    },
    {
      word: 'revision',
      phonetic: "/rɪ'vɪʒn/",
      pos: 'noun',
      defVi: 'Sự ôn tập, sự sửa đổi',
      defEn: 'the action of revising',
      example: 'He is doing some history revision for the exam.',
      exampleVi: 'Cậu ấy đang ôn tập môn lịch sử cho kỳ thi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'complex',
      phonetic: "/'kɑːmpleks/",
      pos: 'noun',
      defVi: 'Khu phức hợp, sự phức tạp',
      defEn: 'a group of similar buildings or facilities on the same site; a related group of repressed ideas',
      example: 'They live in an apartment complex.',
      exampleVi: 'Họ sống trong một khu căn hộ phức hợp.',
      topic: 'general',
      band: 5
    },
    {
      word: 'shift',
      phonetic: "/ʃɪft/",
      pos: 'noun',
      defVi: 'Ca làm việc, sự chuyển đổi',
      defEn: 'a period of time worked by a group of workers who start work as another group finishes',
      example: 'She works the night shift at the factory.',
      exampleVi: 'Cô ấy làm việc ca đêm ở nhà máy.',
      topic: 'general',
      band: 4
    },
    {
      word: 'neighborhood',
      phonetic: "/'neɪbərhʊd/",
      pos: 'noun',
      defVi: 'Khu phố, vùng lân cận',
      defEn: 'a district, especially one forming a community within a town or city',
      example: 'We live in a quiet neighborhood.',
      exampleVi: 'Chúng tôi sống ở một khu phố yên tĩnh.',
      topic: 'general',
      band: 4
    },
    {
      word: 'banquet',
      phonetic: "/'bæŋkwɪt/",
      pos: 'noun',
      defVi: 'Tiệc chiêu đãi, tiệc lớn',
      defEn: 'an elaborate and formal evening meal for many people',
      example: 'A grand banquet was held in honor of the president.',
      exampleVi: 'Một buổi tiệc chiêu đãi lớn được tổ chức để vinh danh tổng thống.',
      topic: 'general',
      band: 5
    },
    {
      word: 'rent',
      phonetic: "/rent/",
      pos: 'noun',
      defVi: 'Tiền thuê nhà, tiền thuê',
      defEn: 'a tenant\'s regular payment to a landlord for the use of property or land',
      example: 'The rent is due on the first of the month.',
      exampleVi: 'Tiền thuê nhà phải đóng vào ngày đầu tháng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'while',
      phonetic: "/waɪl/",
      pos: 'noun',
      defVi: 'Khoảng thời gian, chốc lát',
      defEn: 'a period of time',
      example: 'I haven\'t seen her for a while.',
      exampleVi: 'Tôi đã không gặp cô ấy trong một thời gian.',
      topic: 'general',
      band: 4
    },
    {
      word: 'negotiation',
      phonetic: "/nɪˌdoʊʃi'eɪʃn/",
      pos: 'noun',
      defVi: 'Sự đàm phán, thương lượng',
      defEn: 'discussion aimed at reaching an agreement',
      example: 'The contract is still under negotiation.',
      exampleVi: 'Hợp đồng vẫn đang trong quá trình đàm phán.',
      topic: 'general',
      band: 5
    },
    {
      word: 'elevator',
      phonetic: "/'elɪveɪtər/",
      pos: 'noun',
      defVi: 'Thang máy',
      defEn: 'a platform or compartment housed in a shaft for raising and lowering people or things',
      example: 'We took the elevator to the tenth floor.',
      exampleVi: 'Chúng tôi đã đi thang máy lên tầng mười.',
      topic: 'general',
      band: 5
    },
    {
      word: 'news',
      phonetic: "/nuːz/",
      pos: 'noun',
      defVi: 'Tin tức',
      defEn: 'newly received or noteworthy information, especially about recent or important events',
      example: 'I heard some good news today.',
      exampleVi: 'Tôi đã nghe một vài tin tốt ngày hôm nay.',
      topic: 'general',
      band: 4
    },
    {
      word: 'security',
      phonetic: "/sə'kjʊrəti/",
      pos: 'noun',
      defVi: 'An ninh, bảo an',
      defEn: 'the state of being free from danger or threat',
      example: 'Security has been tightened at the airport.',
      exampleVi: 'An ninh đã được thắt chặt tại sân bay.',
      topic: 'general',
      band: 5
    },
    {
      word: 'museum',
      phonetic: "/mju'ziːəm/",
      pos: 'noun',
      defVi: 'Bảo tàng',
      defEn: 'a building in which objects of historical, scientific, artistic, or cultural interest are stored and exhibited',
      example: 'We visited the museum of natural history.',
      exampleVi: 'Chúng tôi đã đến thăm bảo tàng lịch sử tự nhiên.',
      topic: 'general',
      band: 4
    },
    {
      word: 'receipt',
      phonetic: "/rɪ'siːt/",
      pos: 'noun',
      defVi: 'Biên lai, hóa đơn',
      defEn: 'a written acknowledgment that a specified article or sum of money has been received',
      example: 'Please keep the receipt in case you want to return the item.',
      exampleVi: 'Vui lòng giữ lại biên lai trong trường hợp bạn muốn trả lại hàng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'deal',
      phonetic: "/diːl/",
      pos: 'noun',
      defVi: 'Thỏa thuận, giao dịch',
      defEn: 'an agreement entered into by two or more parties for their mutual benefit',
      example: 'We made a deal to share the profits.',
      exampleVi: 'Chúng tôi đã đạt được một thỏa thuận để chia sẻ lợi nhuận.',
      topic: 'general',
      band: 4
    },
    {
      word: 'visitor',
      phonetic: "/'vɪzɪtər/",
      pos: 'noun',
      defVi: 'Khách tham quan, khách thăm',
      defEn: 'a person visiting a person or place',
      example: 'The museum attracts thousands of visitors every day.',
      exampleVi: 'Bảo tàng thu hút hàng ngàn du khách mỗi ngày.',
      topic: 'general',
      band: 4
    },
    {
      word: 'floor',
      phonetic: "/flɔːr/",
      pos: 'noun',
      defVi: 'Sàn nhà, tầng (nhà)',
      defEn: 'the lower surface of a room, on which one stands; a level of a building',
      example: 'Our office is on the third floor.',
      exampleVi: 'Vui lòng đứng xếp hàng.',
      topic: 'general',
      band: 4
    },
    {
      word: 'drink',
      phonetic: "/drɪŋk/",
      pos: 'noun',
      defVi: 'Đồ uống',
      defEn: 'a liquid for swallowing',
      example: 'Would you like a cold drink?',
      exampleVi: 'Bạn có muốn một đồ uống lạnh không?',
      topic: 'general',
      band: 4
    },
    {
      word: 'commute',
      phonetic: "/kə'mjuːt/",
      pos: 'noun',
      defVi: 'Hành trình đi làm (đều đặn hàng ngày)',
      defEn: 'a regular journey of some distance to and from one\'s place of work',
      example: 'He has a long commute to work every day.',
      exampleVi: 'Anh ấy có một hành trình đi làm dài mỗi ngày.',
      topic: 'general',
      band: 5
    },
    {
      word: 'stairs',
      phonetic: "/sterz/",
      pos: 'noun',
      defVi: 'Cầu thang',
      defEn: 'a set of steps leading from one floor of a building to another',
      example: 'We ran up the stairs to the second floor.',
      exampleVi: 'Chúng tôi chạy lên cầu thang lên tầng hai.',
      topic: 'general',
      band: 4
    },
    {
      word: 'milestone',
      phonetic: "/'maɪlstoʊn/",
      pos: 'noun',
      defVi: 'Cột mốc, sự kiện quan trọng',
      defEn: 'an action or event marking a significant change or stage in development',
      example: 'Graduation is an important milestone in life.',
      exampleVi: 'Tốt nghiệp là một cột mốc quan trọng trong cuộc đời.',
      topic: 'general',
      band: 5
    },

    // Danh từ (noun) - 50 Words from screenshots Day 6
    {
      word: 'approval',
      phonetic: "/a'pruːvəl/",
      pos: 'noun',
      defVi: 'Sự phê duyệt, sự chấp thuận',
      defEn: 'the belief that someone or something is good or acceptable; official permission',
      example: 'The plans have already received official approval.',
      exampleVi: 'Các kế hoạch đã nhận được sự chấp thuận chính thức.',
      topic: 'general',
      band: 5
    },
    {
      word: 'expertise',
      phonetic: "/ˌekspər'tiːz/",
      pos: 'noun',
      defVi: 'Sự thành thạo, kiến thức chuyên môn',
      defEn: 'expert skill or knowledge in a particular field',
      example: 'She has considerable expertise in international law.',
      exampleVi: 'Cô ấy có kiến thức chuyên môn đáng kể về luật quốc tế.',
      topic: 'general',
      band: 5
    },
    {
      word: 'random',
      phonetic: "/'rændəm/",
      pos: 'noun',
      defVi: 'Sự ngẫu nhiên',
      defEn: 'made, done, or happening without method or conscious decision',
      example: 'The contestants were chosen at random.',
      exampleVi: 'Các thí sinh được chọn ngẫu nhiên.',
      topic: 'general',
      band: 5
    },
    {
      word: 'presentation',
      phonetic: "/ˌprez.ən'teɪʃn/",
      pos: 'noun',
      defVi: 'Bài thuyết trình, sự trình bày',
      defEn: 'a speech or talk in which a new product, idea, or piece of work is shown and explained to an audience',
      example: 'He gave a presentation on the new project.',
      exampleVi: 'Anh ấy đã thuyết trình về dự án mới.',
      topic: 'general',
      band: 5
    },
    {
      word: 'entrance',
      phonetic: "/'en.trəns/",
      pos: 'noun',
      defVi: 'Lối vào, cổng vào',
      defEn: 'an opening, such as a door, passage, or gate, that allows access to a place',
      example: 'The main entrance of the building was locked.',
      exampleVi: 'Lối vào chính của tòa nhà đã bị khóa.',
      topic: 'general',
      band: 4
    },
    {
      word: 'preference',
      phonetic: "/'prefrəns/",
      pos: 'noun',
      defVi: 'Sự ưu tiên, sự ưa thích hơn',
      defEn: 'a greater liking for one alternative over another or others',
      example: 'Do you have a preference for red or white wine?',
      exampleVi: 'Bạn có sự ưu tiên cho vang đỏ hay vang trắng không?',
      topic: 'general',
      band: 5
    },
    {
      word: 'remodeling',
      phonetic: "/ˌriː'mɑː.dəl.ɪŋ/",
      pos: 'noun',
      defVi: 'Sự tái cấu trúc, sự tu sửa',
      defEn: 'the act of reconstructing or changing the structure of a building',
      example: 'The remodeling of the kitchen took three weeks.',
      exampleVi: 'Việc sửa sang lại nhà bếp mất ba tuần.',
      topic: 'general',
      band: 5
    },
    {
      word: 'proposal',
      phonetic: "/prə'poʊzl/",
      pos: 'noun',
      defVi: 'Đề xuất, sự cầu hôn',
      defEn: 'a plan or suggestion, especially a formal or written one, put forward for consideration',
      example: 'The board rejected the proposal.',
      exampleVi: 'Ban giám đốc đã bác bỏ đề xuất.',
      topic: 'general',
      band: 5
    },
    {
      word: 'imaged',
      phonetic: "/'ɪmɪdʒd/",
      pos: 'noun',
      defVi: 'Được chụp ảnh, được khắc họa',
      defEn: 'created a representation of the form of something',
      example: 'The internal organs can be imaged using ultrasound.',
      exampleVi: 'Các cơ quan nội tạng có thể được ghi hình bằng siêu âm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'venue',
      phonetic: "/'venjuː/",
      pos: 'noun',
      defVi: 'Địa điểm tổ chức (sự kiện, hội nghị)',
      defEn: 'the place where something happens, especially an organized event such as a concert, conference, or sports event',
      example: 'The hotel is an ideal venue for conferences.',
      exampleVi: 'Khách sạn là một địa điểm lý tưởng cho các hội nghị.',
      topic: 'general',
      band: 5
    },
    {
      word: 'rate',
      phonetic: "/reɪt/",
      pos: 'noun',
      defVi: 'Tỷ lệ, tốc độ, mức giá',
      defEn: 'a measure, quantity, or frequency, typically one measured against some other quantity or measure',
      example: 'The interest rate has risen recently.',
      exampleVi: 'Lãi suất đã tăng lên gần đây.',
      topic: 'general',
      band: 4
    },
    {
      word: 'feedback',
      phonetic: "/'fiːdbæk/",
      pos: 'noun',
      defVi: 'Ý kiến phản hồi, thông tin phản hồi',
      defEn: 'information about reactions to a product, a person\'s performance of a task, etc. which is used as a basis for improvement',
      example: 'We welcome feedback from our customers.',
      exampleVi: 'Chúng tôi hoan nghênh ý kiến phản hồi từ khách hàng.',
      topic: 'general',
      band: 5
    },
    {
      word: 'advantage',
      phonetic: "/əd'væn.tɪdʒ/",
      pos: 'noun',
      defVi: 'Lợi thế, ưu điểm',
      defEn: 'a condition or circumstance that puts one in a favorable or superior position',
      example: 'Being bilingual is a great advantage in this job.',
      exampleVi: 'Biết hai thứ tiếng là một lợi thế lớn trong công việc này.',
      topic: 'general',
      band: 4
    },
    {
      word: 'area',
      phonetic: "/'eə.ri.ə/",
      pos: 'noun',
      defVi: 'Khu vực, diện tích, lĩnh vực',
      defEn: 'a part of a town, a country, or the world; a subject or range of activity',
      example: 'The dining area is spacious.',
      exampleVi: 'Khu vực ăn uống rộng rãi.',
      topic: 'general',
      band: 4
    },
    {
      word: 'capacity',
      phonetic: "/kə'pæs.ə.ti/",
      pos: 'noun',
      defVi: 'Sức chứa, năng lực',
      defEn: 'the maximum amount that something can contain; the ability or power to do something',
      example: 'The theater has a seating capacity of five hundred.',
      exampleVi: 'Nhà hát có sức chứa năm trăm chỗ ngồi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'trade',
      phonetic: "/treɪd/",
      pos: 'noun',
      defVi: 'Thương mại, sự mua bán',
      defEn: 'the action of buying and selling goods and services',
      example: 'International trade is vital for the economy.',
      exampleVi: 'Thương mại quốc tế là cực kỳ quan trọng đối với nền kinh tế.',
      topic: 'general',
      band: 4
    },
    {
      word: 'vegetarian',
      phonetic: "/ˌvedʒɪ'teriən/",
      pos: 'noun',
      defVi: 'Người ăn chay',
      defEn: 'a person who does not eat meat for moral, religious, or health reasons',
      example: 'She has been a vegetarian for ten years.',
      exampleVi: 'Cô ấy đã ăn chay được mười năm.',
      topic: 'general',
      band: 5
    },
    {
      word: 'play',
      phonetic: "/pleɪ/",
      pos: 'noun',
      defVi: 'Vở kịch, sự vui chơi',
      defEn: 'a dramatic work for the stage or to be broadcast',
      example: 'We went to see a play at the theater.',
      exampleVi: 'Chúng tôi đã đi xem một vở kịch ở nhà hát.',
      topic: 'general',
      band: 4
    },
    {
      word: 'badge',
      phonetic: "/bædʒ/",
      pos: 'noun',
      defVi: 'Huy hiệu, thẻ tên',
      defEn: 'a distinctive emblem worn as a mark of office, membership, achievement, licensed status, etc.',
      example: 'All employees must wear their security badges.',
      exampleVi: 'Tất cả nhân viên phải đeo thẻ an ninh.',
      topic: 'general',
      band: 5
    },
    {
      word: 'sponsor',
      phonetic: "/'spɑːn.sər/",
      pos: 'noun',
      defVi: 'Nhà tài trợ',
      defEn: 'a person or organization that provides funds for a project or activity carried out by another',
      example: 'The event was supported by a major corporate sponsor.',
      exampleVi: 'Sự kiện được hỗ trợ bởi một nhà tài trợ doanh nghiệp lớn.',
      topic: 'general',
      band: 5
    },
    {
      word: 'level',
      phonetic: "/'levəl/",
      pos: 'noun',
      defVi: 'Mức độ, cấp độ',
      defEn: 'a position on a real or imaginary scale of amount, quantity, extent, or quality',
      example: 'His English is at an advanced level.',
      exampleVi: 'Tiếng Anh của anh ấy ở trình độ nâng cao.',
      topic: 'general',
      band: 4
    },
    {
      word: 'notice',
      phonetic: "/'noʊtɪs/",
      pos: 'noun',
      defVi: 'Thông báo, sự chú ý',
      defEn: 'notification or warning of something, especially to allow preparations to be made',
      example: 'The building will be closed until further notice.',
      exampleVi: 'Tòa nhà sẽ đóng cửa cho đến khi có thông báo mới.',
      topic: 'general',
      band: 4
    },
    {
      word: 'section',
      phonetic: "/'sekʃn/",
      pos: 'noun',
      defVi: 'Phần, mục, khu vực',
      defEn: 'any of the more or less distinct parts into which something is or may be divided or from which it is made up',
      example: 'Please fill in this section of the form.',
      exampleVi: 'Vui lòng điền vào phần này của biểu mẫu.',
      topic: 'general',
      band: 4
    },
    {
      word: 'creation',
      phonetic: "/kri'eɪʃən/",
      pos: 'noun',
      defVi: 'Sự sáng tạo, tác phẩm',
      defEn: 'the action or process of bringing something into existence',
      example: 'The creation of new jobs is a priority.',
      exampleVi: 'Việc tạo ra các công việc mới là một ưu tiên.',
      topic: 'general',
      band: 5
    },
    {
      word: 'microwave',
      phonetic: "/'maɪkrəweɪv/",
      pos: 'noun',
      defVi: 'Lò vi sóng',
      defEn: 'an electromagnetic wave or an oven that uses microwaves to cook or heat food',
      example: 'Put the soup in the microwave for two minutes.',
      exampleVi: 'Cho súp vào lò vi sóng trong hai phút.',
      topic: 'general',
      band: 5
    },
    {
      word: 'task',
      phonetic: "/tæsk/",
      pos: 'noun',
      defVi: 'Nhiệm vụ, công việc',
      defEn: 'a piece of work to be done or undertaken',
      example: 'Completing the project was a challenging task.',
      exampleVi: 'Hoàn thành dự án là một nhiệm vụ đầy thử thách.',
      topic: 'general',
      band: 4
    },
    {
      word: 'design',
      phonetic: "/dɪ'zaɪn/",
      pos: 'noun',
      defVi: 'Thiết kế, bản thiết kế',
      defEn: 'a plan or drawing produced to show the look and function or workings of a building, garment, or other object before it is built or made',
      example: 'I like the simple design of this chair.',
      exampleVi: 'Tôi thích thiết kế đơn giản của chiếc ghế này.',
      topic: 'general',
      band: 4
    },
    {
      word: 'employment',
      phonetic: "/ɪm'plɔɪmənt/",
      pos: 'noun',
      defVi: 'Việc làm, sự tuyển dụng',
      defEn: 'the state of having paid work',
      example: 'She is looking for full-time employment.',
      exampleVi: 'Cô ấy đang tìm kiếm một công việc toàn thời gian.',
      topic: 'general',
      band: 5
    },
    {
      word: 'concert',
      phonetic: "/'kɑːnsərt/",
      pos: 'noun',
      defVi: 'Buổi hòa nhạc',
      defEn: 'a musical performance given in public, typically by several performers or of several separate compositions',
      example: 'We went to an outdoor rock concert.',
      exampleVi: 'Chúng tôi đã đi xem một buổi hòa nhạc rock ngoài trời.',
      topic: 'general',
      band: 4
    },
    {
      word: 'script',
      phonetic: "/skrɪpt/",
      pos: 'noun',
      defVi: 'Kịch bản, chữ viết',
      defEn: 'the written text of a play, movie, or broadcast',
      example: 'The actors read through the script together.',
      exampleVi: 'Các diễn viên đọc qua kịch bản cùng nhau.',
      topic: 'general',
      band: 5
    },
    {
      word: 'preparation',
      phonetic: "/ˌprepə'reɪʃən/",
      pos: 'noun',
      defVi: 'Sự chuẩn bị',
      defEn: 'the action or process of making ready or being made ready for use or consideration',
      example: 'The preparations for the festival are underway.',
      exampleVi: 'Công tác chuẩn bị cho lễ hội đang được tiến hành.',
      topic: 'general',
      band: 5
    },
    {
      word: 'stage',
      phonetic: "/steɪdʒ/",
      pos: 'noun',
      defVi: 'Sân khấu, giai đoạn',
      defEn: 'a raised floor or platform on which actors, entertainers, or speakers perform; a point in a process',
      example: 'The band performed on the main stage.',
      exampleVi: 'Ban nhạc đã biểu diễn trên sân khấu chính.',
      topic: 'general',
      band: 4
    },
    {
      word: 'value',
      phonetic: "/'væljuː/",
      pos: 'noun',
      defVi: 'Giá trị',
      defEn: 'the regard that something is held to deserve; the importance, worth, or usefulness of something',
      example: 'The property has increased in value.',
      exampleVi: 'Bất động sản đã tăng giá trị.',
      topic: 'general',
      band: 4
    },
    {
      word: 'identification',
      phonetic: "/aɪˌden.tɪ.fɪ'keɪʃn/",
      pos: 'noun',
      defVi: 'Giấy tờ tùy thân, sự nhận diện',
      defEn: 'the action or process of identifying someone or something or the fact of being identified',
      example: 'Please show your identification at the entrance.',
      exampleVi: 'Vui lòng trình giấy tờ tùy thân tại lối vào.',
      topic: 'general',
      band: 5
    },
    {
      word: 'banner',
      phonetic: "/'bænər/",
      pos: 'noun',
      defVi: 'Biểu ngữ, băng rôn',
      defEn: 'a long strip of cloth bearing a slogan or design, carried in a demonstration or procession or hung in a public place',
      example: 'A large banner hung above the stage.',
      exampleVi: 'Một tấm băng rôn lớn được treo phía trên sân khấu.',
      topic: 'general',
      band: 5
    },
    {
      word: 'associate',
      phonetic: "/ə'soʊ.ʃi.eɪt/",
      pos: 'noun',
      defVi: 'Cộng sự, đối tác',
      defEn: 'a partner or colleague in business or at work',
      example: 'He is a close business associate of mine.',
      exampleVi: 'Anh ấy là một cộng sự kinh doanh thân thiết của tôi.',
      topic: 'general',
      band: 5
    },
    {
      word: 'commercial',
      phonetic: "/kə'mɜːrʃl/",
      pos: 'noun',
      defVi: 'Quảng cáo thương mại (trên TV/radio)',
      defEn: 'a television or radio advertisement',
      example: 'I hate the commercials on television.',
      exampleVi: 'Tôi ghét các chương trình quảng cáo trên truyền hình.',
      topic: 'general',
      band: 5
    },
    {
      word: 'adjustment',
      phonetic: "/a'dʒʌst.mənt/",
      pos: 'noun',
      defVi: 'Sự điều chỉnh',
      defEn: 'a small alteration or movement made to achieve a desired fit, appearance, or result',
      example: 'We made some minor adjustments to the plan.',
      exampleVi: 'Chúng tôi đã có một số điều chỉnh nhỏ đối với kế hoạch.',
      topic: 'general',
      band: 5
    },
    {
      word: 'advice',
      phonetic: "/əd'vaɪs/",
      pos: 'noun',
      defVi: 'Lời khuyên',
      defEn: 'guidance or recommendations offered with regard to prudent future action',
      example: 'He gave me some very good advice.',
      exampleVi: 'Anh ấy đã cho tôi một lời khuyên rất hay.',
      topic: 'general',
      band: 4
    },
    {
      word: 'content',
      phonetic: "/'kɑːn.tent/",
      pos: 'noun',
      defVi: 'Nội dung',
      defEn: 'the subjects or topics covered in a book, document, website, etc.',
      example: 'The content of the website is updated daily.',
      exampleVi: 'Nội dung của trang web được cập nhật hàng ngày.',
      topic: 'general',
      band: 5
    },
    {
      word: 'break',
      phonetic: "/breɪk/",
      pos: 'noun',
      defVi: 'Giờ nghỉ, giờ giải lao',
      defEn: 'a pause in work or activity; an interval',
      example: 'Let\'s take a short break.',
      exampleVi: 'Chúng ta hãy nghỉ giải lao một lát.',
      topic: 'general',
      band: 4
    },
    {
      word: 'reputation',
      phonetic: "/ˌrepjə'teɪʃən/",
      pos: 'noun',
      defVi: 'Uy tín, danh tiếng',
      defEn: 'the beliefs or opinions that are generally held about someone or something',
      example: 'The school has an excellent reputation.',
      exampleVi: 'Trường học có một danh tiếng tuyệt vời.',
      topic: 'general',
      band: 5
    },
    {
      word: 'retirement',
      phonetic: "/rɪ'taɪərmənt/",
      pos: 'noun',
      defVi: 'Sự nghỉ hưu',
      defEn: 'the action or fact of leaving one\'s job and ceasing to work',
      example: 'She is looking forward to her retirement.',
      exampleVi: 'Cô ấy đang rất mong chờ sự nghỉ hưu của mình.',
      topic: 'general',
      band: 5
    },
    {
      word: 'charity',
      phonetic: "/'tʃer.ə.tɪ/",
      pos: 'noun',
      defVi: 'Tổ chức từ thiện, lòng từ thiện',
      defEn: 'an organization set up to provide help and raise money for those in need',
      example: 'All the money raised will go to charity.',
      exampleVi: 'Tất cả số tiền quyên góp được sẽ được đưa vào quỹ từ thiện.',
      topic: 'general',
      band: 5
    },
    {
      word: 'salary',
      phonetic: "/'sæləri/",
      pos: 'noun',
      defVi: 'Lương tháng',
      defEn: 'a fixed regular payment, typically paid on a monthly basis',
      example: 'The company offers a competitive salary.',
      exampleVi: 'Công ty đưa ra một mức lương cạnh tranh.',
      topic: 'general',
      band: 4
    },
    {
      word: 'present',
      phonetic: "/'prez.ənt/",
      pos: 'noun',
      defVi: 'Món quà, hiện tại',
      defEn: 'a thing given to someone as a gift; the period of time now occurring',
      example: 'They gave her a beautiful birthday present.',
      exampleVi: 'Họ đã tặng cô ấy một món quà sinh nhật thật đẹp.',
      topic: 'general',
      band: 4
    },
    {
      word: 'applicant',
      phonetic: "/'æplɪkənt/",
      pos: 'noun',
      defVi: 'Người nộp đơn, ứng viên tuyển dụng',
      defEn: 'a person who makes a formal application for something, especially a job',
      example: 'The successful applicant will start next month.',
      exampleVi: 'Ứng viên thành công sẽ bắt đầu làm việc vào tháng tới.',
      topic: 'general',
      band: 5
    },
    {
      word: 'total',
      phonetic: "/'toʊtl/",
      pos: 'noun',
      defVi: 'Tổng số, tổng cộng',
      defEn: 'the whole amount of something',
      example: 'The total cost of the trip was five hundred dollars.',
      exampleVi: 'Tổng chi phí của chuyến đi là năm trăm đô la.',
      topic: 'general',
      band: 4
    },
    {
      word: 'honor',
      phonetic: "/'ɑːnər/",
      pos: 'noun',
      defVi: 'Danh dự, niềm vinh dự',
      defEn: 'high respect; great esteem',
      example: 'It is a great honor to be here tonight.',
      exampleVi: 'Thật là một vinh dự lớn khi có mặt ở đây tối nay.',
      topic: 'general',
      band: 5
    },
    {
      word: 'demonstration',
      phonetic: "/ˌdemən'streɪʃən/",
      pos: 'noun',
      defVi: 'Sự trình diễn, sự biểu tình',
      defEn: 'an action showing other people how to do or use something; a public meeting',
      example: 'The chef gave a demonstration of bread making.',
      exampleVi: 'Đầu bếp đã trình diễn cách làm bánh mì.',
      topic: 'general',
      band: 5
    },

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

    // Phân vùng chính xác theo số từ thực tế của từng ngày đối với danh từ (noun)
    if (this.selectedPos === 'noun') {
      if (localDayNum === 1) {
        return allPosWords.slice(0, 50);
      } else if (localDayNum === 2) {
        return allPosWords.slice(50, 98);
      } else if (localDayNum === 3) {
        return allPosWords.slice(98, 148);
      } else if (localDayNum === 4) {
        return allPosWords.slice(148, 198);
      } else if (localDayNum === 5) {
        return allPosWords.slice(198, 248);
      } else if (localDayNum === 6) {
        return allPosWords.slice(248, 298);
      }
    }

    // Phân chia 50 từ cho các ngày khác hoặc từ loại khác
    const wordsPerDay = 50;
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

