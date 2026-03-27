package com.skillsync.authservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final String OTP_PREFIX = "otp:";
    private static final String VERIFIED_PREFIX = "otp:verified:";
    private static final long OTP_TTL_MINUTES = 5;
    private static final long VERIFIED_TTL_MINUTES = 15;

    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;

    public OtpService(RedisTemplate<String, String> redisTemplate, JavaMailSender mailSender) {
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
    }

    public void sendOtp(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));

        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, OTP_TTL_MINUTES, TimeUnit.MINUTES);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("SkillSync — Email Verification OTP");
        message.setText("Your OTP for SkillSync registration is: " + otp +
                "\n\nThis OTP is valid for " + OTP_TTL_MINUTES + " minutes. Do not share it with anyone.");

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

        // Delete OTP after successful verification
        redisTemplate.delete(key);

        // Mark email as verified for 15 minutes — register() checks this
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + email, "true", VERIFIED_TTL_MINUTES, TimeUnit.MINUTES);
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
}
