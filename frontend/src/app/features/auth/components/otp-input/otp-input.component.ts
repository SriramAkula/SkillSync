import { Component, Output, EventEmitter, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="otp-wrapper">
      @for (i of indices; track i) {
        <input #otpInput class="otp-box" type="text" maxlength="1" inputmode="numeric"
          [value]="digits()[i]"
          (input)="onInput($event, i)"
          (keydown)="onKeydown($event, i)"
          (paste)="onPaste($event)" />
      }
    </div>
  `,
  styles: [`
    .otp-wrapper { display: flex; gap: 10px; justify-content: center; }
    .otp-box {
      width: 48px; height: 56px; text-align: center;
      font-size: 22px; font-weight: 600;
      border: 2px solid #e0e0e0; border-radius: 8px;
      outline: none; transition: border-color 0.2s;
    }
    .otp-box:focus { border-color: #5c6bc0; }
  `]
})
export class OtpInputComponent {
  @Output() otpChange = new EventEmitter<string>();
  @Output() otpComplete = new EventEmitter<string>();
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly indices = [0, 1, 2, 3, 4, 5];
  readonly digits = signal<string[]>(['', '', '', '', '', '']);

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    const updated = [...this.digits()];
    updated[index] = val.slice(-1);
    this.digits.set(updated);

    // move focus forward
    if (val && index < 5) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }

    const joined = updated.join('');
    this.otpChange.emit(joined);

    // emit complete only when all 6 boxes are filled
    if (updated.every(d => d !== '')) {
      this.otpComplete.emit(joined);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0)
      this.inputs.toArray()[index - 1].nativeElement.focus();
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (pasted.length > 0) {
      const newDigits = pasted.split('');
      const fullDigits = [...newDigits, ...Array(6 - newDigits.length).fill('')].slice(0, 6);
      this.digits.set(fullDigits);
      this.otpChange.emit(fullDigits.join(''));
      if (fullDigits.length === 6) this.otpComplete.emit(fullDigits.join(''));
    }
    event.preventDefault();
  }
}
