package com.skillsync.notification;

import com.skillsync.notification.exception.NotificationNotFoundException;
import com.skillsync.notification.exception.UnauthorizedException;
import com.skillsync.notification.config.EmailConfig;
import com.skillsync.notification.config.RabbitMQConfig;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MiscTest {

    @Test
    void testExceptions() {
        NotificationNotFoundException e1 = new NotificationNotFoundException("msg");
        assertThat(e1.getMessage()).isEqualTo("msg");

        UnauthorizedException e2 = new UnauthorizedException("msg");
        assertThat(e2.getMessage()).isEqualTo("msg");
    }

    @Test
    void testConfigs() {
        EmailConfig emailConfig = new EmailConfig();
        assertThat(emailConfig).isNotNull();
        assertThat(emailConfig.mailTemplateResolver()).isNotNull();
        assertThat(emailConfig.mailTemplateEngine()).isNotNull();
        assertThat(emailConfig.emailMessageSource()).isNotNull();

        RabbitMQConfig rabbitMQConfig = new RabbitMQConfig();
        assertThat(rabbitMQConfig).isNotNull();
    }

    @Test
    void testApplicationMain() {
        // Just verify it doesn't crash (loading the class)
        NotificationServiceApplication app = new NotificationServiceApplication();
        assertThat(app).isNotNull();
    }
}
