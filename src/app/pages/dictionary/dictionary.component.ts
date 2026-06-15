import { Component } from '@angular/core';

export interface DictEntry {
  word: string;
  phonetic: string;
  pos: string;
  defVi: string;
  defEn: string;
  example: string;
  collocations?: string[];
  wordFamily?: { pos: string; word: string; def: string }[];
  ieltsNote?: string;
}

@Component({
  selector: 'app-dictionary',
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.scss']
})
export class DictionaryComponent {
  searchQuery = '';
  searched = false;
  result: DictEntry | null = null;
  savedWords = new Set<string>();

  readonly suggestions = [
    'sustainable', 'innovation', 'globalisation', 'urbanisation',
    'biodiversity', 'automation', 'inequality', 'literacy',
    'emissions', 'wellbeing', 'demographic', 'curriculum',
  ];

  readonly features = [
    { icon: '📖', title: 'Nghĩa song ngữ',  desc: 'Xem nghĩa tiếng Việt và tiếng Anh kèm ví dụ thực tế trong ngữ cảnh IELTS.' },
    { icon: '🔗', title: 'Collocations',     desc: 'Các cụm từ hay đi kèm — giúp viết và nói tự nhiên hơn trong bài thi.' },
    { icon: '🌳', title: 'Word family',       desc: 'Học cùng lúc danh từ, động từ, tính từ cùng gốc để mở rộng vốn từ nhanh hơn.' },
    { icon: '💡', title: 'Mẹo IELTS',        desc: 'Gợi ý cách dùng từ trong bài Reading, Listening, Writing và Speaking.' },
  ];

  private readonly dictionary: DictEntry[] = [
    {
      word: 'sustainable', phonetic: '/səˈsteɪnəbəl/', pos: 'adjective',
      defVi: 'Bền vững, có thể duy trì lâu dài mà không gây hại',
      defEn: 'able to be maintained at a certain rate or level without exhausting natural resources',
      example: 'Governments must invest in sustainable energy infrastructure to meet long-term climate commitments.',
      collocations: ['sustainable development', 'sustainable energy', 'sustainable growth', 'environmentally sustainable'],
      wordFamily: [
        { pos: 'noun',   word: 'sustainability', def: 'tính bền vững' },
        { pos: 'adverb', word: 'sustainably',    def: 'một cách bền vững' },
        { pos: 'verb',   word: 'sustain',        def: 'duy trì, chịu đựng' },
      ],
      ieltsNote: 'Từ này cực kỳ phổ biến trong đề Reading và Writing task 2 chủ đề môi trường. Dùng "sustainable development" thay "eco-friendly" để có vẻ academic hơn.'
    },
    {
      word: 'innovation', phonetic: '/ˌɪnəˈveɪʃən/', pos: 'noun',
      defVi: 'Sự đổi mới, sáng tạo — quá trình tạo ra ý tưởng hoặc sản phẩm mới',
      defEn: 'the action or process of introducing new ideas, methods, or products',
      example: 'Technological innovation has transformed how businesses operate on a global scale.',
      collocations: ['technological innovation', 'foster innovation', 'innovation hub', 'disruptive innovation'],
      wordFamily: [
        { pos: 'verb',      word: 'innovate',   def: 'đổi mới, sáng tạo' },
        { pos: 'adjective', word: 'innovative', def: 'sáng tạo, đột phá' },
        { pos: 'noun',      word: 'innovator',  def: 'người đổi mới' },
      ],
      ieltsNote: 'Trong Writing task 2 về công nghệ, dùng "foster/drive innovation" thay vì "make new things". Xen kẽ "innovation" và "advancement" để tránh lặp từ.'
    },
    {
      word: 'globalisation', phonetic: '/ˌɡləʊbəlaɪˈzeɪʃən/', pos: 'noun',
      defVi: 'Toàn cầu hóa — quá trình các nền kinh tế, văn hóa kết nối toàn cầu',
      defEn: 'the process by which businesses or other organisations develop international influence',
      example: 'Critics argue that globalisation has widened the gap between rich and poor nations.',
      collocations: ['economic globalisation', 'cultural globalisation', 'the effects of globalisation'],
      wordFamily: [
        { pos: 'verb',      word: 'globalise', def: 'toàn cầu hóa' },
        { pos: 'adjective', word: 'global',    def: 'toàn cầu' },
        { pos: 'adverb',    word: 'globally',  def: 'trên toàn thế giới' },
      ],
      ieltsNote: 'British spelling: "globalisation"; American: "globalization". Dùng nhất quán. Thường gặp trong task 2 chủ đề xã hội và kinh tế.'
    },
    {
      word: 'urbanisation', phonetic: '/ˌɜːbənaɪˈzeɪʃən/', pos: 'noun',
      defVi: 'Đô thị hóa — quá trình tập trung dân số vào các thành phố',
      defEn: 'the process by which towns and cities grow larger as more people begin living and working in them',
      example: 'Rapid urbanisation in developing nations has led to severe overcrowding and inadequate infrastructure.',
      collocations: ['rapid urbanisation', 'urban sprawl', 'urbanisation rate', 'cope with urbanisation'],
      wordFamily: [
        { pos: 'verb',      word: 'urbanise', def: 'đô thị hóa' },
        { pos: 'adjective', word: 'urban',    def: 'thuộc đô thị' },
      ],
      ieltsNote: 'Chủ đề đô thị hóa hay đi kèm: infrastructure, housing shortage, traffic congestion, migration. Nắm cụm từ sẽ xử lý được cả nhóm đề này.'
    },
    {
      word: 'biodiversity', phonetic: '/ˌbaɪəʊdaɪˈvɜːsɪti/', pos: 'noun',
      defVi: 'Đa dạng sinh học — sự phong phú của các loài động thực vật',
      defEn: 'the variety of plant and animal life in the world or in a particular habitat',
      example: 'Protecting biodiversity is essential for maintaining the balance of ecosystems worldwide.',
      collocations: ['protect biodiversity', 'loss of biodiversity', 'marine biodiversity', 'biodiversity hotspot'],
      wordFamily: [
        { pos: 'adjective', word: 'biodiverse', def: 'đa dạng sinh học' },
        { pos: 'noun',      word: 'diversity',  def: 'sự đa dạng' },
      ],
      ieltsNote: 'Thường xuất hiện cùng "deforestation", "habitat destruction", "endangered species". Học theo cụm để xử lý cả đoạn văn về môi trường.'
    },
    {
      word: 'automation', phonetic: '/ˌɔːtəˈmeɪʃən/', pos: 'noun',
      defVi: 'Tự động hóa — việc thay thế sức lao động con người bằng máy móc',
      defEn: 'the use of machines and computers to do work that was previously done by people',
      example: 'The automation of manufacturing processes has displaced millions of low-skilled workers globally.',
      collocations: ['industrial automation', 'automation of jobs', 'automation technology'],
      wordFamily: [
        { pos: 'verb',      word: 'automate',  def: 'tự động hóa' },
        { pos: 'adjective', word: 'automated', def: 'được tự động hóa' },
        { pos: 'adjective', word: 'automatic', def: 'tự động' },
      ],
      ieltsNote: 'Chủ đề tự động hóa hay gặp trong task 2 "Computers are replacing humans at work". Lập luận 2 phía: mất việc làm vs tạo ngành mới.'
    },
    {
      word: 'inequality', phonetic: '/ˌɪnɪˈkwɒlɪti/', pos: 'noun',
      defVi: 'Bất bình đẳng — sự chênh lệch không công bằng giữa các nhóm người',
      defEn: 'the unfair situation in society when some people have more opportunities than others',
      example: 'Growing income inequality remains one of the most pressing challenges facing developed economies.',
      collocations: ['income inequality', 'social inequality', 'gender inequality', 'widen inequality', 'address inequality'],
      wordFamily: [
        { pos: 'adjective', word: 'unequal',  def: 'không bình đẳng' },
        { pos: 'noun',      word: 'equality', def: 'sự bình đẳng' },
      ],
      ieltsNote: 'Task 2 hay hỏi "Is inequality increasing?" — dùng "income disparity" và "wealth gap" để tránh lặp từ.'
    },
    {
      word: 'literacy', phonetic: '/ˈlɪtərəsi/', pos: 'noun',
      defVi: 'Khả năng đọc viết; trình độ hiểu biết trong một lĩnh vực',
      defEn: 'the ability to read and write; competence or knowledge in a specific area',
      example: 'Improving digital literacy is crucial for ensuring equal participation in the modern economy.',
      collocations: ['digital literacy', 'media literacy', 'financial literacy', 'literacy rate'],
      wordFamily: [
        { pos: 'adjective', word: 'literate',   def: 'biết đọc biết viết' },
        { pos: 'noun',      word: 'illiteracy', def: 'nạn mù chữ' },
      ],
      ieltsNote: '"Literacy" không chỉ có nghĩa đọc viết — trong IELTS hay kết hợp: "digital literacy", "financial literacy", "health literacy".'
    },
    {
      word: 'emissions', phonetic: '/ɪˈmɪʃənz/', pos: 'noun (plural)',
      defVi: 'Khí thải — lượng khí được phát ra vào khí quyển',
      defEn: 'the production and discharge of something, especially gas or radiation',
      example: 'Developed nations must dramatically cut carbon emissions if climate targets are to be achieved.',
      collocations: ['carbon emissions', 'greenhouse gas emissions', 'cut/reduce emissions', 'zero emissions'],
      wordFamily: [
        { pos: 'verb', word: 'emit',     def: 'phát thải, thải ra' },
        { pos: 'noun', word: 'emission', def: 'sự phát thải (số ít)' },
      ],
      ieltsNote: 'Luôn dùng "carbon emissions" (không phải "carbon emission"). Từ đồng nghĩa trong Reading: pollutants, greenhouse gases, discharge.'
    },
    {
      word: 'wellbeing', phonetic: '/ˈwelbiɪŋ/', pos: 'noun',
      defVi: 'Sức khỏe và hạnh phúc tổng thể — cả thể chất lẫn tinh thần',
      defEn: 'the state of being comfortable, healthy, or happy',
      example: 'Employers are increasingly recognising that employee wellbeing directly impacts productivity.',
      collocations: ['mental wellbeing', 'emotional wellbeing', 'promote wellbeing', 'sense of wellbeing'],
      wordFamily: [
        { pos: 'noun', word: 'welfare', def: 'phúc lợi (formal hơn)' },
      ],
      ieltsNote: '"Wellbeing" ngày càng phổ biến trong đề về sức khỏe và xã hội. Đừng nhầm với "welfare" — wellbeing mang nghĩa cá nhân, welfare thiên về chính sách.'
    },
    {
      word: 'demographic', phonetic: '/ˌdeməˈɡræfɪk/', pos: 'adjective / noun',
      defVi: 'Thuộc về dân số học; một nhóm dân số cụ thể',
      defEn: 'relating to the structure of populations; a particular sector of a population',
      example: 'A significant demographic shift is underway as populations in developed nations age rapidly.',
      collocations: ['demographic change', 'demographic shift', 'demographic data', 'aging demographic'],
      wordFamily: [
        { pos: 'noun', word: 'demographics', def: 'số liệu dân số' },
        { pos: 'noun', word: 'demography',   def: 'khoa học dân số học' },
      ],
      ieltsNote: '"Demographic shift" = sự thay đổi cơ cấu dân số. Thường đi cùng: ageing population, birth rate, migration.'
    },
    {
      word: 'curriculum', phonetic: '/kəˈrɪkjʊləm/', pos: 'noun',
      defVi: 'Chương trình giảng dạy — toàn bộ các môn học trong một khóa học',
      defEn: 'the subjects comprising a course of study in a school or college',
      example: 'Many educators argue that critical thinking should be embedded across the entire curriculum.',
      collocations: ['school curriculum', 'national curriculum', 'curriculum design', 'introduce into the curriculum'],
      wordFamily: [
        { pos: 'noun (plural)', word: 'curricula',     def: 'các chương trình học (Latin)' },
        { pos: 'adjective',     word: 'extracurricular', def: 'ngoại khóa' },
      ],
      ieltsNote: 'Số nhiều: "curricula" hoặc "curriculums" — cả hai đều đúng. Task 2 về giáo dục hay hỏi nên đưa môn gì vào curriculum.'
    },
  ];

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) { this.result = null; this.searched = false; return; }
    this.searched = true;
    this.result = this.dictionary.find(e => e.word.toLowerCase() === q) ?? null;
  }

  searchWord(word: string): void { this.searchQuery = word; this.onSearch(); }

  clearSearch(): void { this.searchQuery = ''; this.result = null; this.searched = false; }

  toggleSave(word: string): void { this.savedWords.has(word) ? this.savedWords.delete(word) : this.savedWords.add(word); }

  playPronunciation(word: string): void {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}
