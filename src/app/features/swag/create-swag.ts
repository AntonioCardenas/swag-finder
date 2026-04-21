import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SwagService } from '../../core/services/swag.service';
import { I18nService } from '../../core/services/i18n.service';
import { WebcamModule, WebcamImage, WebcamInitError } from 'ngx-webcam';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-swag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, WebcamModule],
  template: `
    <div class="page">
      <header class="page-header">
        <a routerLink="/swag" class="back-btn" [attr.aria-label]="t().create.backAriaLabel">
          <i class="ph-bold ph-arrow-left"></i>
        </a>
        <h1 class="page-title">{{ t().create.title }}</h1>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label class="label" for="title">{{ t().create.titleLabel }} *</label>
          <input
            id="title"
            class="input"
            type="text"
            formControlName="title"
            [placeholder]="t().create.titlePlaceholder"
            autocomplete="off"
          />
          @if (form.controls.title.invalid && form.controls.title.touched) {
            <span class="error" role="alert">{{ t().create.titleRequired }}</span>
          }
        </div>

        <div class="field">
          <label class="label" for="description">{{ t().create.descriptionLabel }} *</label>
          <textarea
            id="description"
            class="input textarea"
            formControlName="description"
            [placeholder]="t().create.descriptionPlaceholder"
            rows="3"
          ></textarea>
          @if (form.controls.description.invalid && form.controls.description.touched) {
            <span class="error" role="alert">{{ t().create.descriptionRequired }}</span>
          }
        </div>

        <div class="field">
          <label class="label" for="location">{{ t().create.locationLabel }} *</label>
          <input
            id="location"
            class="input"
            type="text"
            formControlName="location"
            [placeholder]="t().create.locationPlaceholder"
            autocomplete="off"
          />
          @if (form.controls.location.invalid && form.controls.location.touched) {
            <span class="error" role="alert">{{ t().create.locationRequired }}</span>
          }
        </div>

        <div class="field">
          <label class="label">{{ t().create.photoLabel }} *</label>

          @if (previewUrl()) {
            <div class="preview-wrap">
              <img [src]="previewUrl()!" alt="Swag preview" class="preview-img" />
              <div class="preview-actions">
                <button class="preview-btn" type="button" (click)="showWebcam.set(true); previewUrl.set(null)">
                  <i class="ph ph-camera"></i> {{ t().create.retake }}
                </button>
                <button class="preview-btn" type="button" (click)="galleryInput.click()">
                  <i class="ph ph-images"></i> {{ t().create.gallery }}
                </button>
              </div>
            </div>
          } @else if (showWebcam()) {
            <div class="webcam-wrap">
              <webcam [trigger]="triggerObservable" (imageCapture)="handleImage($event)" (initError)="handleInitError($event)"></webcam>
              <div class="preview-actions">
                <button class="preview-btn" type="button" (click)="showWebcam.set(false)">
                  <i class="ph-bold ph-x"></i> Cancel
                </button>
                <button class="preview-btn" type="button" (click)="triggerSubject.next()">
                  <i class="ph ph-camera"></i> Snap
                </button>
              </div>
            </div>
          } @else {
            <div class="photo-picker" role="group" [attr.aria-label]="t().create.photoAriaLabel">
              <button class="photo-btn" type="button" (click)="showWebcam.set(true)">
                <i class="ph ph-camera"></i>
                <span>{{ t().create.camera }}</span>
              </button>
              <button class="photo-btn" type="button" (click)="galleryInput.click()">
                <i class="ph ph-images"></i>
                <span>{{ t().create.gallery }}</span>
              </button>
            </div>
          }

          <input #galleryInput type="file" accept="image/*" class="file-hidden" (change)="onFileChange($event)" />

          @if (imageError()) {
            <span class="error" role="alert">{{ imageError() }}</span>
          }
        </div>

        @if (submitError()) {
          <p class="error" role="alert">{{ submitError() }}</p>
        }

        <button
          class="btn-submit"
          type="submit"
          [disabled]="submitting() || form.invalid || !imageFile()"
        >
          {{ submitting() ? t().create.uploading : t().create.submit }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 480px; margin: 0 auto; min-height: 100vh; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .back-btn {
      font-size: 1.25rem;
      text-decoration: none;
      color: #64748b;
      display: flex; align-items: center; justify-content: center;
      width: 2.5rem; height: 2.5rem;
      border-radius: 0.75rem;
      background-color: #f1f5f9;
      transition: all 0.15s;
    }
    .back-btn:hover { background-color: #e2e8f0; color: #1e293b; }
    .page-title { font-size: 1.75rem; font-weight: 800; margin: 0; color: #1e293b; }
    .form { display: flex; flex-direction: column; gap: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { font-weight: 700; font-size: 0.875rem; color: #475569; }
    .input {
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
      font-size: 1rem;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.15s;
      background-color: white;
    }
    .input:focus { border-color: #6366f1; ring: 2px solid #e0e7ff; }
    .textarea { resize: vertical; min-height: 100px; }
    .error { font-size: 0.8125rem; color: #ef4444; font-weight: 600; }
    .photo-picker {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .photo-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 1.5rem 1rem;
      border: 2px dashed #e2e8f0;
      border-radius: 1.25rem;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
    }
    .photo-btn i { font-size: 2rem; color: #94a3b8; transition: color 0.15s; }
    .photo-btn:hover { border-color: #6366f1; background: #f5f3ff; color: #6366f1; }
    .photo-btn:hover i { color: #6366f1; }
    .preview-wrap {
      position: relative;
      border-radius: 1.25rem;
      overflow: hidden;
      border: 2px solid #6366f1;
    }
    .webcam-wrap {
      position: relative;
      border-radius: 1.25rem;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    .webcam-wrap webcam {
      position: relative;
      z-index: 1;
    }
    .preview-img {
      width: 100%;
      aspect-ratio: 16/10;
      object-fit: cover;
      display: block;
    }
    .preview-actions {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
    }
    .preview-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(4px);
      color: white;
      border: none;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .preview-btn:hover { background: rgba(30, 41, 59, 0.95); }
    .file-hidden {
      position: absolute;
      width: 0; height: 0;
      opacity: 0;
      pointer-events: none;
    }
    .btn-submit {
      padding: 1rem;
      background-color: #6366f1;
      color: white;
      border: none;
      border-radius: 1rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background-color: #4f46e5; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class CreateSwagComponent {
  private readonly fb = inject(FormBuilder);
  private readonly swagService = inject(SwagService);
  private readonly router = inject(Router);
  readonly t = inject(I18nService).t;

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    location: ['', Validators.required],
  });

  readonly previewUrl = signal<string | null>(null);
  readonly imageFile = signal<File | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly triggerSubject = new Subject<void>();
  readonly showWebcam = signal(false);

  get triggerObservable() {
    return this.triggerSubject.asObservable();
  }

  handleImage(webcamImage: WebcamImage): void {
    this.showWebcam.set(false);
    this.previewUrl.set(webcamImage.imageAsDataUrl);
    const file = this.dataUriToFile(webcamImage.imageAsDataUrl, 'camera-photo.jpg');
    this.imageFile.set(file);
    this.imageError.set(null);
  }

  handleInitError(error: WebcamInitError): void {
    this.imageError.set('Camera error: ' + error.message);
    this.showWebcam.set(false);
  }

  dataUriToFile(dataUri: string, filename: string): File {
    const arr = dataUri.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.imageError.set(this.t().create.imageError);
      return;
    }
    this.imageError.set(null);
    this.imageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.imageFile()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    try {
      const rawLocation = this.form.value.location?.trim() || '';
      const finalLocation = `${this.t().create.locationPrefix} ${rawLocation}`;

      await this.swagService.createSwag({
        title: this.form.value.title!,
        description: this.form.value.description!,
        location: finalLocation,
        imageFile: this.imageFile()!,
      });
      await this.router.navigate(['/swag']);
    } catch {
      this.submitError.set(this.t().create.submitError);
    } finally {
      this.submitting.set(false);
    }
  }
}
