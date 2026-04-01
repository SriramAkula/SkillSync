package com.skillsync.payment.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ---- Exchange ----
    public static final String SESSION_EXCHANGE = "session-events";
    public static final String PAYMENT_EXCHANGE = "payment-events";

    // ---- Routing Keys (listen) ----
    public static final String SESSION_ACCEPTED_KEY = "session.accepted";
    public static final String SESSION_CANCELLED_KEY = "session.cancelled";

    // ---- Queues ----
    public static final String PAYMENT_SESSION_ACCEPTED_QUEUE = "payment.session.accepted";
    public static final String PAYMENT_SESSION_CANCELLED_QUEUE = "payment.session.cancelled";

    // ---- Dead Letter Queues ----
    public static final String PAYMENT_SESSION_ACCEPTED_DLQ = "payment.session.accepted.dlq";
    public static final String PAYMENT_SESSION_CANCELLED_DLQ = "payment.session.cancelled.dlq";
    public static final String DLX_EXCHANGE = "payment-dlx";

    @Bean
    public TopicExchange sessionExchange() {
        return new TopicExchange(SESSION_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(PAYMENT_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(DLX_EXCHANGE, true, false);
    }

    // ---- DLQs ----
    @Bean
    public Queue sessionAcceptedDlq() {
        return QueueBuilder.durable(PAYMENT_SESSION_ACCEPTED_DLQ).build();
    }

    @Bean
    public Queue sessionCancelledDlq() {
        return QueueBuilder.durable(PAYMENT_SESSION_CANCELLED_DLQ).build();
    }

    // ---- Main Queues with DLX ----
    @Bean
    public Queue sessionAcceptedQueue() {
        return QueueBuilder.durable(PAYMENT_SESSION_ACCEPTED_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", PAYMENT_SESSION_ACCEPTED_DLQ)
                .build();
    }

    @Bean
    public Queue sessionCancelledQueue() {
        return QueueBuilder.durable(PAYMENT_SESSION_CANCELLED_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", PAYMENT_SESSION_CANCELLED_DLQ)
                .build();
    }

    // ---- Bindings ----
    @Bean
    public Binding sessionAcceptedBinding() {
        return BindingBuilder.bind(sessionAcceptedQueue())
                .to(sessionExchange())
                .with(SESSION_ACCEPTED_KEY);
    }

    @Bean
    public Binding sessionCancelledBinding() {
        return BindingBuilder.bind(sessionCancelledQueue())
                .to(sessionExchange())
                .with(SESSION_CANCELLED_KEY);
    }

    @Bean
    public Binding dlqAcceptedBinding() {
        return BindingBuilder.bind(sessionAcceptedDlq())
                .to(dlxExchange())
                .with(PAYMENT_SESSION_ACCEPTED_DLQ);
    }

    @Bean
    public Binding dlqCancelledBinding() {
        return BindingBuilder.bind(sessionCancelledDlq())
                .to(dlxExchange())
                .with(PAYMENT_SESSION_CANCELLED_DLQ);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
