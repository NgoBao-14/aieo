import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  totalTypes = 8;

  readonly bandGuide = [
    { score: '5.0', label: 'Trung bình', desc: 'Giao tiếp cơ bản, hiểu nội dung quen thuộc.',  color: '#FCD34D' },
    { score: '6.0', label: 'Khá',        desc: 'Yêu cầu tối thiểu của nhiều trường đại học.',   color: '#F59E0B' },
    { score: '7.0', label: 'Tốt',        desc: 'Mục tiêu du học Úc, Canada, Anh.',              color: '#10B981' },
    { score: '8.0', label: 'Xuất sắc',   desc: 'Thành thạo, dùng cho định cư & học bổng.',     color: '#1A237E' },
  ];

  readonly questionTypes = [
    { skill: 'Reading',   name: 'True / False / Not Given', tip: 'Đọc kỹ — không dùng kiến thức bên ngoài, chỉ dựa vào bài.' },
    { skill: 'Reading',   name: 'Multiple Choice',          tip: 'Loại trừ đáp án sai trước, tìm bằng chứng trong đoạn văn.' },
    { skill: 'Reading',   name: 'Note Completion',          tip: 'Đọc ghi chú trước, đoán từ loại cần điền trước khi đọc.' },
    { skill: 'Listening', name: 'Form Completion',          tip: 'Nghe thứ tự, chú ý số, ngày tháng, tên riêng.' },
    { skill: 'Listening', name: 'Multiple Choice',          tip: 'Đọc options trước khi nghe để dự đoán nội dung.' },
    { skill: 'Reading',   name: 'Matching Headings',        tip: 'Đọc heading rồi đọc câu đầu & cuối mỗi đoạn.' },
  ];
}
