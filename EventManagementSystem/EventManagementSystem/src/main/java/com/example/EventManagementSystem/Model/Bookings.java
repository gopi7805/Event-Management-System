package com.example.EventManagementSystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Bookings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer bookingId;

    @NotBlank(message = "Customer name is required")
    @Column(nullable = false, length = 100)
    private String customerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    @Column(nullable = false, length = 150)
    private String email;

    @NotNull(message = "Event ID is required")
    @Column(name = "event_id", nullable = false)
    private Integer eventId;

    @NotNull(message = "Ticket count is required")
    @Min(value = 1, message = "At least one ticket is required")
    @Column(nullable = false)
    private Integer ticketCount;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", message = "Amount cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 20)
    private String bookingStatus = "CONFIRMED";

    @Column(nullable = false)
    private LocalDateTime bookingDate;

    public Bookings() {
    }

    @PrePersist
    public void setBookingDate() {
        if (bookingDate == null) {
            bookingDate = LocalDateTime.now();
        }
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getEventId() {
        return eventId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public Integer getTicketCount() {
        return ticketCount;
    }

    public void setTicketCount(Integer ticketCount) {
        this.ticketCount = ticketCount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
    }
}
