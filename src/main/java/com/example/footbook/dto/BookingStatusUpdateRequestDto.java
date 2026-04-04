package com.example.footbook.dto;

import com.example.footbook.entity.BookingStatus;

public class BookingStatusUpdateRequestDto {

    private BookingStatus status;

    public BookingStatusUpdateRequestDto() {
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }
}