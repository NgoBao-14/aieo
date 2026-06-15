import { Component } from '@angular/core';

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

interface Topic { id: string; name: string; icon: string; }

@Component({
  selector: 'app-vocabulary',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.scss']
})
export class VocabularyComponent {
  flashcardMode = false;
  selectedTopic = '';
  selectedBand = '';
  currentCardIndex = 0;
  cardFlipped = false;
  savedWords   = new Set<string>();
  learnedWords = new Set<string>();

  readonly topics: Topic[] = [
    { id: 'environment', name: 'Môi trường', icon: '🌿' },
    { id: 'technology',  name: 'Công nghệ',  icon: '💻' },
    { id: 'health',      name: 'Sức khỏe',   icon: '🏥' },
    { id: 'society',     name: 'Xã hội',     icon: '🏘️' },
    { id: 'education',   name: 'Giáo dục',   icon: '🎓' },
    { id: 'economy',     name: 'Kinh tế',    icon: '💹' },
  ];

  readonly bands = ['5', '6', '7'];

  readonly words: VocabWord[] = [
    { word: 'sustainable',   phonetic: '/səˈsteɪnəbəl/',       pos: 'adj',  defVi: 'Bền vững',                    defEn: 'able to continue without damaging the environment',                            example: 'We need sustainable energy sources to combat climate change.',             topic: 'environment', band: 6 },
    { word: 'biodiversity',  phonetic: '/ˌbaɪəʊdaɪˈvɜːsəti/', pos: 'noun', defVi: 'Đa dạng sinh học',            defEn: 'the variety of plant and animal life in a habitat',                             example: 'Deforestation leads to a dramatic loss of biodiversity.',                  topic: 'environment', band: 7 },
    { word: 'deforestation', phonetic: '/diːˌfɒrɪˈsteɪʃən/',  pos: 'noun', defVi: 'Nạn phá rừng',               defEn: 'the action of clearing a wide area of trees',                                  example: 'Rampant deforestation has severely impacted wildlife habitats.',            topic: 'environment', band: 6 },
    { word: 'emissions',     phonetic: '/ɪˈmɪʃənz/',           pos: 'noun', defVi: 'Khí thải',                   defEn: 'the production and discharge of gas into the atmosphere',                       example: 'Countries must reduce carbon emissions to meet climate targets.',           topic: 'environment', band: 6 },
    { word: 'renewable',     phonetic: '/rɪˈnjuːəbəl/',        pos: 'adj',  defVi: 'Tái tạo được',               defEn: 'relating to natural resources that can be replaced after use',                   example: 'Solar and wind power are the most promising renewable energy sources.',     topic: 'environment', band: 5 },
    { word: 'conservation',  phonetic: '/ˌkɒnsəˈveɪʃən/',     pos: 'noun', defVi: 'Bảo tồn thiên nhiên',        defEn: 'the protection of plants, animals and natural resources',                       example: 'Wildlife conservation efforts have brought several species back.',          topic: 'environment', band: 6 },
    { word: 'innovation',    phonetic: '/ˌɪnəˈveɪʃən/',        pos: 'noun', defVi: 'Sự đổi mới, sáng tạo',      defEn: 'a new idea, product, or way of doing something',                               example: 'Technological innovation has transformed the modern economy.',             topic: 'technology',  band: 6 },
    { word: 'automation',    phonetic: '/ˌɔːtəˈmeɪʃən/',       pos: 'noun', defVi: 'Tự động hóa',               defEn: 'the use of machines to do work that humans used to do',                         example: 'Automation is displacing workers in manufacturing industries worldwide.',  topic: 'technology',  band: 6 },
    { word: 'algorithm',     phonetic: '/ˈælɡərɪðəm/',         pos: 'noun', defVi: 'Thuật toán',                 defEn: 'a set of rules followed in problem-solving operations',                         example: 'Social media platforms use complex algorithms to personalise content.',    topic: 'technology',  band: 7 },
    { word: 'surveillance',  phonetic: '/sɜːˈveɪləns/',        pos: 'noun', defVi: 'Sự giám sát, theo dõi',     defEn: 'close observation, especially of a suspected person',                           example: 'Mass digital surveillance raises concerns about privacy.',                 topic: 'technology',  band: 7 },
    { word: 'sedentary',     phonetic: '/ˈsedənteri/',          pos: 'adj',  defVi: 'Ít vận động, ngồi nhiều',   defEn: 'tending to spend much time seated; somewhat inactive',                          example: 'A sedentary lifestyle is linked to obesity and heart disease.',            topic: 'health',      band: 7 },
    { word: 'obesity',       phonetic: '/əʊˈbiːsɪti/',         pos: 'noun', defVi: 'Bệnh béo phì',              defEn: 'the condition of being very overweight',                                        example: 'Childhood obesity has become a major public health crisis.',               topic: 'health',      band: 6 },
    { word: 'malnutrition',  phonetic: '/ˌmælnjuˈtrɪʃən/',    pos: 'noun', defVi: 'Suy dinh dưỡng',            defEn: 'lack of proper nutrition',                                                      example: 'Malnutrition remains a critical issue in sub-Saharan Africa.',            topic: 'health',      band: 6 },
    { word: 'wellbeing',     phonetic: '/ˈwelbiɪŋ/',           pos: 'noun', defVi: 'Sức khỏe và hạnh phúc',    defEn: 'the state of being comfortable, healthy, or happy',                             example: 'Employers are recognising the importance of employee wellbeing.',          topic: 'health',      band: 5 },
    { word: 'urbanisation',  phonetic: '/ˌɜːbənaɪˈzeɪʃən/',   pos: 'noun', defVi: 'Đô thị hóa',               defEn: 'the process by which towns and cities grow larger',                             example: 'Rapid urbanisation has led to overcrowding in megacities.',               topic: 'society',     band: 6 },
    { word: 'inequality',    phonetic: '/ˌɪnɪˈkwɒlɪti/',      pos: 'noun', defVi: 'Bất bình đẳng',             defEn: 'difference in size, degree, or circumstances',                                  example: 'Income inequality has widened significantly over the past three decades.', topic: 'society',     band: 6 },
    { word: 'demographic',   phonetic: '/ˌdeməˈɡræfɪk/',      pos: 'adj',  defVi: 'Thuộc về dân số học',       defEn: 'relating to the structure of populations',                                      example: 'A major demographic shift is underway as populations age rapidly.',       topic: 'society',     band: 7 },
    { word: 'migration',     phonetic: '/maɪˈɡreɪʃən/',        pos: 'noun', defVi: 'Di cư, di dân',             defEn: 'movement from one place to another',                                            example: 'Economic migration has had both benefits and challenges for host countries.', topic: 'society',  band: 5 },
    { word: 'curriculum',    phonetic: '/kəˈrɪkjʊləm/',        pos: 'noun', defVi: 'Chương trình học',          defEn: 'the subjects comprising a course of study in a school',                         example: 'The school introduced coding into its curriculum.',                        topic: 'education',   band: 6 },
    { word: 'literacy',      phonetic: '/ˈlɪtərəsi/',          pos: 'noun', defVi: 'Khả năng đọc viết, trình độ', defEn: 'the ability to read and write',                                             example: 'Improving digital literacy is essential for today\'s economy.',           topic: 'education',   band: 5 },
    { word: 'pedagogy',      phonetic: '/ˈpedəɡɒdʒi/',         pos: 'noun', defVi: 'Phương pháp sư phạm',       defEn: 'the method and practice of teaching',                                           example: 'Progressive pedagogy emphasises critical thinking over rote memorisation.', topic: 'education', band: 7 },
    { word: 'globalisation', phonetic: '/ˌɡləʊbəlaɪˈzeɪʃən/', pos: 'noun', defVi: 'Toàn cầu hóa',             defEn: 'the process by which businesses develop international influence',                example: 'Globalisation has enabled the rapid spread of goods and ideas.',           topic: 'economy',     band: 6 },
    { word: 'recession',     phonetic: '/rɪˈseʃən/',           pos: 'noun', defVi: 'Suy thoái kinh tế',         defEn: 'a period of temporary economic decline',                                        example: 'The 2008 recession caused unemployment to soar in western nations.',       topic: 'economy',     band: 6 },
    { word: 'entrepreneur',  phonetic: '/ˌɒntrəprəˈnɜːr/',    pos: 'noun', defVi: 'Nhà khởi nghiệp',          defEn: 'a person who sets up a business taking on financial risks',                     example: 'Young entrepreneurs are using technology to disrupt traditional industries.', topic: 'economy', band: 5 },
  ];

  get filteredWords(): VocabWord[] {
    return this.words.filter(w => {
      const topicOk = !this.selectedTopic || w.topic === this.selectedTopic;
      const bandOk  = !this.selectedBand  || w.band >= parseInt(this.selectedBand, 10);
      return topicOk && bandOk;
    });
  }

  get currentCard(): VocabWord { return this.filteredWords[this.currentCardIndex] ?? this.words[0]; }

  get learnedPercent(): number {
    if (!this.filteredWords.length) return 0;
    const n = this.filteredWords.filter(w => this.learnedWords.has(w.word)).length;
    return Math.round((n / this.filteredWords.length) * 100);
  }

  selectTopic(id: string): void  { this.selectedTopic = id; this.currentCardIndex = 0; this.cardFlipped = false; }
  selectBand(band: string): void { this.selectedBand  = band; this.currentCardIndex = 0; this.cardFlipped = false; }
  toggleFlashcard(): void        { this.flashcardMode = !this.flashcardMode; this.currentCardIndex = 0; this.cardFlipped = false; }
  flipCard(): void               { this.cardFlipped = !this.cardFlipped; }

  nextCard(): void {
    this.cardFlipped = false;
    this.currentCardIndex = (this.currentCardIndex + 1) % this.filteredWords.length;
  }

  prevCard(): void {
    this.cardFlipped = false;
    this.currentCardIndex = (this.currentCardIndex - 1 + this.filteredWords.length) % this.filteredWords.length;
  }

  toggleSave(word: string): void    { this.savedWords.has(word)   ? this.savedWords.delete(word)   : this.savedWords.add(word); }
  toggleLearned(word: string): void { this.learnedWords.has(word) ? this.learnedWords.delete(word) : this.learnedWords.add(word); }
  getTopicLabel(id: string): string { return this.topics.find(t => t.id === id)?.name ?? id; }
}
