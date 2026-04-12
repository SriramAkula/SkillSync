package com.skillsync.authservice.logging;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class LoggingAspectTest {

    private LoggingAspect loggingAspect;

    @Mock
    private ProceedingJoinPoint proceedingJoinPoint;

    @Mock
    private JoinPoint joinPoint;

    @Mock
    private Signature signature;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        loggingAspect = new LoggingAspect();
        when(proceedingJoinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getDeclaringTypeName()).thenReturn("com.test.Service");
        when(signature.getName()).thenReturn("testMethod");
    }

    @Test
    void logAround_shouldLogAndProceed() throws Throwable {
        when(proceedingJoinPoint.getArgs()).thenReturn(new Object[]{"arg1"});
        when(proceedingJoinPoint.proceed()).thenReturn("success");

        Object result = loggingAspect.logAround(proceedingJoinPoint);

        assertThat(result).isEqualTo("success");
        verify(proceedingJoinPoint).proceed();
    }

    @Test
    void logAround_shouldHandleIllegalArgumentException() throws Throwable {
        when(proceedingJoinPoint.getArgs()).thenReturn(new Object[]{"bad"});
        when(proceedingJoinPoint.proceed()).thenThrow(new IllegalArgumentException("Invalid"));

        assertThrows(IllegalArgumentException.class, () -> loggingAspect.logAround(proceedingJoinPoint));
    }

    @Test
    void logAfterThrowing_shouldLogWithCauseNull() {
        Throwable e = mock(Throwable.class);
        when(e.getCause()).thenReturn(null);

        loggingAspect.logAfterThrowing(joinPoint, e);
        // Verify no exception thrown
    }

    @Test
    void logAfterThrowing_shouldLogWithCauseNotNull() {
        Throwable e = mock(Throwable.class);
        Throwable cause = new RuntimeException("Cause");
        when(e.getCause()).thenReturn(cause);

        loggingAspect.logAfterThrowing(joinPoint, e);
        // Verify no exception thrown
    }

    @Test
    void applicationPackagePointcut_isCalledForCoverage() {
        loggingAspect.applicationPackagePointcut();
    }
}
