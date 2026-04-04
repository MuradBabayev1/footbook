package com.example.footbook.repository;

import com.example.footbook.entity.Booking;
import com.example.footbook.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByStadiumId(Long stadiumId);
    
    List<Booking> findByStatus(BookingStatus status);
    
    List<Booking> findByBookingDate(LocalDate bookingDate);
    
    List<Booking> findByStadiumIdAndBookingDate(Long stadiumId, LocalDate bookingDate);
    
    List<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);
}
