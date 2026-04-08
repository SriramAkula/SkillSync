import { Component, Output, EventEmitter, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss'
})
export class OtpInputComponent {
  @Output() otpComplete = new EventEmitter<string>();
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly indices = [0, 1, 2, 3, 4, 5];
  readonly digits = signal<string[]>(['', '', '', '', '', '']);

  onInput(event: Event, index: number): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    const updated = [...this.digits()];
    updated[index] = val.slice(-1);
    this.digits.set(updated);
    if (val && index < 5) this.inputs.toArray()[index + 1].nativeElement.focus();
    const otp = updated.join('');
    if (otp.length === 6) this.otpComplete.emit(otp);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0)
      this.inputs.toArray()[index - 1].nativeElement.focus();
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (pasted.length === 6) { this.digits.set(pasted.split('')); this.otpComplete.emit(pasted); }
    event.preventDefault();
  }
}
