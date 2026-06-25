import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  readonly bandGuide = [
    { score: '5.0', label: 'Du học nghề',  desc: 'Visa lao động, trường nghề, dự bị đại học.',       color: '#FCD34D' },
    { score: '6.0', label: 'Đại học',      desc: 'Yêu cầu tối thiểu của đa số trường quốc tế.',      color: '#F59E0B' },
    { score: '6.5', label: 'Thạc sĩ',      desc: 'Visa định cư Úc, học bổng, thạc sĩ danh tiếng.',   color: '#10B981' },
    { score: '7.5', label: 'Xuất sắc',     desc: 'Học bổng cao, giảng viên, nghiên cứu sinh.',        color: '#1A237E' },
  ];
}
