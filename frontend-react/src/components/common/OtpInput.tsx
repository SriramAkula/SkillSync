import React, { useRef, useState } from 'react';

interface OtpInputProps {
  onOtpComplete: (otp: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ onOtpComplete }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '');
    const updated = [...digits];
    updated[index] = val.slice(-1);
    setDigits(updated);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const otp = updated.join('');
    if (otp.length === 6) {
      onOtpComplete(otp);
    }
  };

  const onKeydown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const split = pasted.split('');
      setDigits(split);
      onOtpComplete(pasted);
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center mb-6">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          maxLength={1}
          value={digits[index]}
          onChange={(e) => onInput(e, index)}
          onKeyDown={(e) => onKeydown(e, index)}
          onPaste={onPaste}
          className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        />
      ))}
    </div>
  );
};
