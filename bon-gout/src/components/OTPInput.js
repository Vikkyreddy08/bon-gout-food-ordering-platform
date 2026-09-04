
import React, { useRef, useState, useEffect } from 'react';

const OTPInput = ({ length = 6, value = '', onComplete, onOTPChange }) => {
  const toOtpArray = (nextValue) => String(nextValue || '').slice(0, length).split('').concat(new Array(length).fill('')).slice(0, length);
  const [otp, setOtp] = useState(() => toOtpArray(value));
  const inputsRef = useRef([]);

  useEffect(() => {
    setOtp(toOtpArray(value));
  }, [value, length]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      const newValues = value.split('').slice(0, length - index);
      newOtp.splice(index, newValues.length, ...newValues);
      const nextIndex = Math.min(index + newValues.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      if (value && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    }
    setOtp(newOtp);
    const otpString = newOtp.join('');
    onOTPChange?.(otpString);
    if (otpString.length === length) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const otpString = newOtp.join('');
    onOTPChange?.(otpString);
    if (otpString.length === length) {
      onComplete?.(otpString);
    }
    const lastIndex = Math.min(pastedData.length - 1, length - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((value, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all dark:bg-white/5 dark:border-white/20 dark:text-white"
        />
      ))}
    </div>
  );
};

export default OTPInput;
