package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for payment-related errors
 */
public class PaymentException extends AppException {

    public PaymentException(String message) {
        super(
                message,
                "PAYMENT_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public PaymentException(String message, Throwable cause) {
        super(
                message,
                cause,
                "PAYMENT_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public static PaymentException invalidAmount(double amount) {
        return new PaymentException("Invalid payment amount: " + amount);
    }

    public static PaymentException paymentFailed(String reason) {
        return new PaymentException("Payment failed: " + reason);
    }

    public static PaymentException paymentGatewayError() {
        return new PaymentException("Payment gateway is currently unavailable");
    }

    public static PaymentException invalidPaymentMethod(String method) {
        return new PaymentException("Invalid payment method: " + method);
    }

    public static PaymentException paymentAlreadyProcessed(String transactionId) {
        return new PaymentException("Payment with transaction ID '" + transactionId + "' has already been processed");
    }

    public static PaymentException insufficientFunds() {
        return new PaymentException("Insufficient funds for this transaction");
    }

    public static PaymentException invalidPaymentStatus(String status) {
        return new PaymentException("Invalid payment status: " + status);
    }
}
