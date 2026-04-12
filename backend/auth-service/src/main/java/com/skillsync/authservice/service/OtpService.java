package com.skillsync.authservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_PREFIX       = "otp:";
    private static final String VERIFIED_PREFIX  = "otp:verified:";
    private static final String PWD_OTP_PREFIX   = "otp:pwd:";
    private static final String PWD_RESET_PREFIX = "otp:pwd-reset:";
    private static final SecureRandom RANDOM     = new SecureRandom();

    @Value("${otp.ttl.minutes:5}")
    private long otpTtlMinutes;

    @Value("${otp.verified.ttl.minutes:15}")
    private long verifiedTtlMinutes;

    @Value("${otp.pwd-reset.ttl.minutes:10}")
    private long pwdResetTtlMinutes;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    public void sendOtp(String email) {
        String otp = String.format("%06d", RANDOM.nextInt(999999));
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, otpTtlMinutes, TimeUnit.MINUTES);

        try {
            sendHtmlEmail(email, "SkillSync - Email Verification OTP", "otp-verification", otp, otpTtlMinutes);
            log.info("Registration OTP sent to email={}", email);
        } catch (Exception e) {
            log.error("Failed to send registration OTP to email={}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.", e);
        }
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
        String otp = String.format("%06d", RANDOM.nextInt(999999));
        redisTemplate.opsForValue().set(PWD_OTP_PREFIX + email, otp, otpTtlMinutes, TimeUnit.MINUTES);

        try {
            sendHtmlEmail(email, "SkillSync - Password Reset OTP", "password-reset", otp, otpTtlMinutes);
            log.info("Password reset OTP sent to email={}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset OTP to email={}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.", e);
        }
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

    private void sendHtmlEmail(String to, String subject, String templateName, String otp, long ttl) throws MessagingException, UnsupportedEncodingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        Context context = new Context();
        context.setVariable("template", templateName);
        context.setVariable("otp", otp);
        context.setVariable("ttl", ttl);

        String htmlContent = templateEngine.process("base-layout", context);

        helper.setFrom(fromEmail, "SkillSync Team");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(mimeMessage);
    }
}
