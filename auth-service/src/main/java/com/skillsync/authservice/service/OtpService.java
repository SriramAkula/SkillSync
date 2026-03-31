package com.skillsync.authservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private static final String OTP_PREFIX       = "otp:";
    private static final String VERIFIED_PREFIX  = "otp:verified:";
    private static final String PWD_OTP_PREFIX   = "otp:pwd:";
    private static final String PWD_RESET_PREFIX = "otp:pwd-reset:";

    @Value("${otp.ttl.minutes:5}")
    private long otpTtlMinutes;

    @Value("${otp.verified.ttl.minutes:15}")
    private long verifiedTtlMinutes;

    @Value("${otp.pwd-reset.ttl.minutes:10}")
    private long pwdResetTtlMinutes;

    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;

    public OtpService(RedisTemplate<String, String> redisTemplate, JavaMailSender mailSender) {
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
    }

    public void sendOtp(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, otpTtlMinutes, TimeUnit.MINUTES);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("SkillSync - Email Verification OTP");
        message.setText("Your OTP for SkillSync registration is: " + otp +
                "\n\nThis OTP is valid for " + otpTtlMinutes + " minutes. Do not share it with anyone.");
        mailSender.send(message);
        log.info("OTP sent to email={}", email);
    }

    public boolean verifyOtp(String email, String otp) {
        String key = OTP_PREFIX + email;
        String stored = redisTemplate.opsForValue().get(key);

        if (stored == null) {
            log.warn("OTP expired or not found for email={}", email);
            return false;
        }
        if (!stored.equals(otp)) {
            log.warn("Invalid OTP attempt for email={}", email);
            return false;
        }

        redisTemplate.delete(key);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + email, "true", verifiedTtlMinutes, TimeUnit.MINUTES);
        log.info("OTP verified successfully for email={}", email);
        return true;
    }

    public boolean isEmailVerified(String email) {
        return Boolean.TRUE.toString().equals(
                redisTemplate.opsForValue().get(VERIFIED_PREFIX + email)
        );
    }

    public void clearVerification(String email) {
        redisTemplate.delete(VERIFIED_PREFIX + email);
    }

    public void sendPasswordResetOtp(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        redisTemplate.opsForValue().set(PWD_OTP_PREFIX + email, otp, otpTtlMinutes, TimeUnit.MINUTES);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("SkillSync - Password Reset OTP");
        message.setText("Your OTP to reset your SkillSync password is: " + otp +
                "\n\nThis OTP is valid for " + otpTtlMinutes + " minutes." +
                "\nIf you did not request this, please ignore this email.");
        mailSender.send(message);
        log.info("Password reset OTP sent to email={}", email);
    }

    public boolean verifyPasswordResetOtp(String email, String otp) {
        String key = PWD_OTP_PREFIX + email;
        String stored = redisTemplate.opsForValue().get(key);

        if (stored == null) {
            log.warn("Password reset OTP expired or not found for email={}", email);
            return false;
        }
        if (!stored.equals(otp)) {
            log.warn("Invalid password reset OTP attempt for email={}", email);
            return false;
        }

        redisTemplate.delete(key);
        redisTemplate.opsForValue().set(PWD_RESET_PREFIX + email, "true", pwdResetTtlMinutes, TimeUnit.MINUTES);
        log.info("Password reset OTP verified for email={}", email);
        return true;
    }

    public boolean isPasswordResetVerified(String email) {
        return Boolean.TRUE.toString().equals(
                redisTemplate.opsForValue().get(PWD_RESET_PREFIX + email)
        );
    }

    public void clearPasswordResetVerification(String email) {
        redisTemplate.delete(PWD_RESET_PREFIX + email);
    }
}
