package com.example.footbook.repository;

import com.example.footbook.entity.Booking;
import com.example.footbook.entity.Stadium;
import com.example.footbook.entity.User;
import com.example.footbook.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUser(User user);
    
    List<Booking> findByStadium(Stadium stadium);
    
    List<Booking> findByUserId(Long userId);

    long deleteByUserId(Long userId);

    long deleteByStadiumId(Long stadiumId);

    long deleteByStadiumIdIn(List<Long> stadiumIds);
    
    List<Booking> findByStadiumId(Long stadiumId);
    
    List<Booking> findByStatus(BookingStatus status);
    
    List<Booking> findByBookingDate(LocalDate bookingDate);
    
    List<Booking> findByStadiumIdAndBookingDate(Long stadiumId, LocalDate bookingDate);

    List<Booking> findByUserIdAndStadiumId(Long userId, Long stadiumId);
    
    List<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);

    @Query("select case when count(b) > 0 then true else false end " +
            "from Booking b " +
            "where b.stadium.id = :stadiumId " +
            "and b.bookingDate = :bookingDate " +
            "and b.status <> com.example.footbook.enums.BookingStatus.CANCELLED " +
            "and b.startTime < :endTime " +
            "and b.endTime > :startTime")
        boolean existsOverlappingBooking(@Param("stadiumId") Long stadiumId,
                                                                         @Param("bookingDate") LocalDate bookingDate,
                                                                         @Param("startTime") LocalTime startTime,
                                                                         @Param("endTime") LocalTime endTime);
}
