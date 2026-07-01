import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { getFirebaseDb, isFirebaseEnabled } from '../../../core/firebase/firebase.client';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { UserProfile, UserPackage } from '../../../models/app.models';

interface PackageOption {
  name: string;
  price: number;
  days: number;
}

@Component({
  selector: 'app-admin-upgrade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upgrade-container">
      <div class="page-header">
        <div class="header-title">
          <span class="icon">👑</span>
          <h1>Nâng Cấp Tài Khoản</h1>
        </div>
        <p class="subtitle">Quản lý gia hạn và nâng cấp gói dịch vụ cho học viên</p>
      </div>

      <!-- SEARCH BOX -->
      <div class="search-card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Nhập email thí sinh để bắt đầu..."
            [(ngModel)]="searchEmail"
            (keydown.enter)="checkUser()" />
          <button class="btn btn-check" (click)="checkUser()" [disabled]="checking">
            {{ checking ? 'Đang kiểm tra...' : 'Kiểm tra' }}
          </button>
        </div>
        <div class="search-error" *ngIf="searchError">{{ searchError }}</div>
        <div class="search-success" *ngIf="foundUser">
          ✅ Đã tìm thấy học viên: <strong>{{ foundUser.displayName }}</strong> ({{ foundUser.email }})
          <span class="badge badge-rank">{{ foundUser.rank }}</span>
        </div>
      </div>

      <div class="main-content-layout" *ngIf="foundUser">
        <!-- FORM CONFIG -->
        <div class="config-section">
          <div class="config-card">
            <h3>Cấu hình nâng cấp</h3>

            <div class="form-group">
              <label>Gói dịch vụ *</label>
              <select [(ngModel)]="selectedPackageIndex" (change)="onPackageChange()">
                <option *ngFor="let pkg of packages; let i = index" [value]="i">
                  {{ pkg.name }}
                </option>
              </select>
            </div>

            <div class="form-group-row">
              <div class="form-group">
                <label>Giá bán (VND)</label>
                <div class="price-input-wrap">
                  <input type="number" [(ngModel)]="customPrice" (input)="onPriceChange()" />
                  <span class="currency-label">đ</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Mã giới thiệu / Giảm giá</label>
              <input type="text" placeholder="Nhập mã code" [(ngModel)]="promoCode" (input)="applyPromo()" />
            </div>
          </div>
        </div>

        <!-- PAYMENT SUMMARY -->
        <div class="summary-section">
          <div class="summary-card">
            <h3>TÓM TẮT THANH TOÁN</h3>

            <div class="summary-row">
              <span class="label">Gói đăng ký</span>
              <span class="value bold">{{ selectedPackage.name }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Giá gốc</span>
              <span class="value">{{ selectedPackage.price | number }}đ</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row highlight">
              <span class="label">Thành tiền</span>
              <span class="value price">{{ finalPrice | number }}đ</span>
            </div>

            <div class="summary-row">
              <span class="label">Hết hạn dự kiến</span>
              <span class="value">{{ expiryDate | date:'dd/MM/yyyy' }}</span>
            </div>

            <button class="btn btn-confirm" (click)="confirmUpgrade()" [disabled]="upgrading">
              {{ upgrading ? 'Đang nâng cấp...' : '⚡ Xác nhận Nâng cấp' }}
            </button>

            <div class="success-message" *ngIf="successMsg">🎉 {{ successMsg }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin-upgrade.component.scss']
})
export class AdminUpgradeComponent implements OnInit {
  searchEmail = '';
  checking = false;
  searchError = '';
  foundUser: UserProfile | null = null;

  packages: PackageOption[] = [
    { name: 'Lộ trình IELTS 6.5 - 180 ngày', price: 1990000, days: 180 },
    { name: 'Lộ trình IELTS 7.5 - 360 ngày', price: 2990000, days: 360 },
    { name: 'Khoá giải đề cấp tốc - 30 ngày', price: 590000, days: 30 }
  ];

  selectedPackageIndex = 0;
  customPrice = 1990000;
  promoCode = '';
  finalPrice = 1990000;
  expiryDate = new Date();
  upgrading = false;
  successMsg = '';

  constructor(private userProfileService: UserProfileService) {}

  ngOnInit() {
    this.calculateExpiry();
  }

  get selectedPackage(): PackageOption {
    return this.packages[this.selectedPackageIndex];
  }

  onPackageChange() {
    this.customPrice = this.selectedPackage.price;
    this.finalPrice = this.selectedPackage.price;
    this.calculateExpiry();
    this.applyPromo();
  }

  onPriceChange() {
    this.finalPrice = this.customPrice;
  }

  applyPromo() {
    if (this.promoCode.trim().toLowerCase() === 'ielts9s') {
      this.finalPrice = Math.round(this.customPrice * 0.9); // 10% discount
    } else {
      this.finalPrice = this.customPrice;
    }
  }

  calculateExpiry() {
    const days = this.selectedPackage.days;
    this.expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async checkUser() {
    if (!this.searchEmail.trim()) {
      this.searchError = 'Vui lòng nhập email thí sinh.';
      return;
    }

    this.checking = true;
    this.searchError = '';
    this.foundUser = null;
    this.successMsg = '';

    if (isFirebaseEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', this.searchEmail.trim()));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const docSnap = querySnap.docs[0];
            const data = docSnap.data() as UserProfile;
            
            // fetch package
            try {
              const pkgSnap = await getDocs(collection(db, 'users', data.uid, 'data'));
              const pkgDoc = pkgSnap.docs.find(d => d.id === 'package');
              if (pkgDoc) {
                data.package = pkgDoc.data() as UserPackage;
              }
            } catch (err) {
              console.error('Error loading package during search:', err);
            }

            this.foundUser = data;
            this.checking = false;
            return;
          }
        } catch (err) {
          console.error('Error checking user in Firestore:', err);
        }
      }
    }

    // fallback to localStorage
    const raw = localStorage.getItem('ielts9s-profiles');
    if (raw) {
      const profiles = JSON.parse(raw) as Record<string, UserProfile>;
      const match = Object.values(profiles).find(p => p.email.toLowerCase() === this.searchEmail.trim().toLowerCase());
      if (match) {
        this.foundUser = match;
        this.checking = false;
        return;
      }
    }

    this.searchError = 'Không tìm thấy học viên với email này.';
    this.checking = false;
  }

  async confirmUpgrade() {
    if (!this.foundUser) return;

    this.upgrading = true;
    this.successMsg = '';

    const newPackage: UserPackage = {
      create_at: new Date().toISOString(),
      days: this.selectedPackage.days,
      expired_date: this.expiryDate.toISOString(),
      number_test: this.foundUser.package?.number_test || 0,
      type: 2, // 2 is Premium
      uid: this.foundUser.uid
    };

    // Save locally
    const raw = localStorage.getItem('ielts9s-profiles');
    if (raw) {
      const profiles = JSON.parse(raw) as Record<string, UserProfile>;
      if (profiles[this.foundUser.uid]) {
        profiles[this.foundUser.uid].package = newPackage;
        localStorage.setItem('ielts9s-profiles', JSON.stringify(profiles));
      }
    }

    // Save to Firestore
    if (isFirebaseEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, 'users', this.foundUser.uid, 'data', 'package'), newPackage);
        } catch (err) {
          console.error('Error writing package to Firestore:', err);
        }
      }
    }

    this.foundUser.package = newPackage;
    this.successMsg = 'Nâng cấp gói tài khoản học viên thành công!';
    this.upgrading = false;
  }
}
