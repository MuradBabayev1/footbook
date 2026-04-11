package com.example.footbook.service;

import com.example.footbook.dto.BookingRequestDto;
import com.example.footbook.entity.Booking;
import com.example.footbook.entity.Stadium;
import com.example.footbook.entity.User;
import com.example.footbook.enums.BookingStatus;
import com.example.footbook.repository.BookingRepository;
import com.example.footbook.repository.StadiumRepository;
import com.example.footbook.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final StadiumRepository stadiumRepository;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository, StadiumRepository stadiumRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.stadiumRepository = stadiumRepository;
    }

    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByStadiumId(Long stadiumId) {
        return bookingRepository.findByStadiumId(stadiumId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserIdAndStadiumId(Long userId, Long stadiumId) {
        return bookingRepository.findByUserIdAndStadiumId(userId, stadiumId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByBookingDate(LocalDate bookingDate) {
        return bookingRepository.findByBookingDate(bookingDate);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByStadiumIdAndDate(Long stadiumId, LocalDate bookingDate) {
        return bookingRepository.findByStadiumIdAndBookingDate(stadiumId, bookingDate);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserIdAndStatus(Long userId, BookingStatus status) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    }

    public Booking createBooking(BookingRequestDto requestDto) {
        if (requestDto.getUserId() == null || requestDto.getUserId() <= 0) {
            throw new IllegalArgumentException("userId must be greater than zero");
        }
        if (requestDto.getStadiumId() == null || requestDto.getStadiumId() <= 0) {
            throw new IllegalArgumentException("stadiumId must be greater than zero");
        }
        if (requestDto.getMatchTitle() == null || requestDto.getMatchTitle().isBlank()) {
            throw new IllegalArgumentException("matchTitle is required");
        }
        if (requestDto.getBookingDate() == null) {
            throw new IllegalArgumentException("bookingDate is required");
        }
        if (requestDto.getStartTime() == null || requestDto.getEndTime() == null) {
            throw new IllegalArgumentException("startTime and endTime are required");
        }
        if (!requestDto.getEndTime().isAfter(requestDto.getStartTime())) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        if (requestDto.getAttendees() == null || requestDto.getAttendees() <= 0) {
            throw new IllegalArgumentException("attendees must be greater than zero");
        }

        // Fetch User and Stadium entities
        User user = userRepository.findById(requestDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + requestDto.getUserId()));
        
        Stadium stadium = stadiumRepository.findById(requestDto.getStadiumId())
                .orElseThrow(() -> new IllegalArgumentException("Stadium not found with id: " + requestDto.getStadiumId()));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setStadium(stadium);
        booking.setMatchTitle(requestDto.getMatchTitle());
        booking.setBookingDate(requestDto.getBookingDate());
        booking.setStartTime(requestDto.getStartTime());
        booking.setEndTime(requestDto.getEndTime());
        booking.setAttendees(requestDto.getAttendees());
        booking.setStatus(requestDto.getStatus() != null ? requestDto.getStatus() : BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    public Optional<Booking> updateBookingStatus(Long id, BookingStatus newStatus) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(newStatus);
            return bookingRepository.save(booking);
        });
    }

    public boolean deleteBooking(Long id) {
        if (bookingRepository.existsById(id)) {
            bookingRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
