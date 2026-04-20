package com.example.footbook.service;

import com.example.footbook.dto.StadiumRequestDto;
import com.example.footbook.entity.Owner;
import com.example.footbook.entity.Stadium;
import com.example.footbook.repository.BookingRepository;
import com.example.footbook.repository.StadiumRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StadiumService {

    private final StadiumRepository stadiumRepository;
    private final BookingRepository bookingRepository;

    public StadiumService(StadiumRepository stadiumRepository, BookingRepository bookingRepository) {
        this.stadiumRepository = stadiumRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<Stadium> getAllStadiums() {
        return stadiumRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Stadium> getStadiumById(Long id) {
        return stadiumRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Stadium> getStadiumByName(String name) {
        return stadiumRepository.findByName(name);
    }

    @Transactional(readOnly = true)
    public List<Stadium> getStadiumsByCity(String city) {
        return stadiumRepository.findByCity(city);
    }

    @Transactional(readOnly = true)
    public List<Stadium> getAvailableStadiums() {
        return stadiumRepository.findByAvailable(true);
    }

    @Transactional(readOnly = true)
    public List<Stadium> getAvailableStadiumsByCity(String city) {
        return stadiumRepository.findByCityAndAvailable(city, true);
    }

    @Transactional(readOnly = true)
    public List<Stadium> getStadiumsByOwnerId(Long ownerId) {
        return stadiumRepository.findByOwnerId(ownerId);
    }

    @Caching(evict = {
            @CacheEvict(value = "stadiums-all", allEntries = true),
            @CacheEvict(value = "stadiums-by-id", allEntries = true),
            @CacheEvict(value = "stadiums-available", allEntries = true),
            @CacheEvict(value = "owner-stadiums", allEntries = true)
    })
    public Stadium createStadium(StadiumRequestDto requestDto, Owner owner) {
        if (owner == null) {
            throw new IllegalArgumentException("owner is required to create a stadium");
        }
        if (requestDto.getName() == null || requestDto.getName().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (requestDto.getCity() == null || requestDto.getCity().isBlank()) {
            throw new IllegalArgumentException("city is required");
        }
        if (requestDto.getLocation() == null || requestDto.getLocation().isBlank()) {
            throw new IllegalArgumentException("location is required");
        }
        if (requestDto.getCapacity() == null || requestDto.getCapacity() <= 0) {
            throw new IllegalArgumentException("capacity must be greater than zero");
        }

        Stadium stadium = new Stadium();
        stadium.setName(requestDto.getName());
        stadium.setCity(requestDto.getCity());
        stadium.setLocation(requestDto.getLocation());
        stadium.setCapacity(requestDto.getCapacity());
        stadium.setAvailable(requestDto.getAvailable() != null ? requestDto.getAvailable() : true);
        if (requestDto.getPictureUrl() != null && !requestDto.getPictureUrl().isBlank()) {
            stadium.setPictureUrl(requestDto.getPictureUrl());
        }
        stadium.setOwner(owner);

        return stadiumRepository.save(stadium);
    }

    @Caching(evict = {
            @CacheEvict(value = "stadiums-all", allEntries = true),
            @CacheEvict(value = "stadiums-by-id", key = "#id"),
            @CacheEvict(value = "stadiums-available", allEntries = true),
            @CacheEvict(value = "owner-stadiums", allEntries = true)
    })
    public Optional<Stadium> updateStadium(Long id, StadiumRequestDto requestDto) {
        return stadiumRepository.findById(id).map(stadium -> {
            if (requestDto.getName() != null && !requestDto.getName().isBlank()) {
                stadium.setName(requestDto.getName());
            }
            if (requestDto.getCity() != null && !requestDto.getCity().isBlank()) {
                stadium.setCity(requestDto.getCity());
            }
            if (requestDto.getLocation() != null && !requestDto.getLocation().isBlank()) {
                stadium.setLocation(requestDto.getLocation());
            }
            if (requestDto.getCapacity() != null && requestDto.getCapacity() > 0) {
                stadium.setCapacity(requestDto.getCapacity());
            }
            if (requestDto.getAvailable() != null) {
                stadium.setAvailable(requestDto.getAvailable());
            }
            if (requestDto.getPictureUrl() != null && !requestDto.getPictureUrl().isBlank()) {
                stadium.setPictureUrl(requestDto.getPictureUrl());
            }
            return stadiumRepository.save(stadium);
        });
    }

    @Caching(evict = {
            @CacheEvict(value = "stadiums-all", allEntries = true),
            @CacheEvict(value = "stadiums-by-id", key = "#id"),
            @CacheEvict(value = "stadiums-available", allEntries = true),
            @CacheEvict(value = "owner-stadiums", key = "#ownerId")
    })
    public Optional<Stadium> updateOwnerStadium(Long ownerId, Long id, StadiumRequestDto requestDto) {
        return stadiumRepository.findByIdAndOwnerId(id, ownerId).map(stadium -> {
            if (requestDto.getName() != null && !requestDto.getName().isBlank()) {
                stadium.setName(requestDto.getName());
            }
            if (requestDto.getCity() != null && !requestDto.getCity().isBlank()) {
                stadium.setCity(requestDto.getCity());
            }
            if (requestDto.getLocation() != null && !requestDto.getLocation().isBlank()) {
                stadium.setLocation(requestDto.getLocation());
            }
            if (requestDto.getCapacity() != null && requestDto.getCapacity() > 0) {
                stadium.setCapacity(requestDto.getCapacity());
            }
            if (requestDto.getAvailable() != null) {
                stadium.setAvailable(requestDto.getAvailable());
            }
            if (requestDto.getPictureUrl() != null && !requestDto.getPictureUrl().isBlank()) {
                stadium.setPictureUrl(requestDto.getPictureUrl());
            }
            return stadiumRepository.save(stadium);
        });
    }

    @Caching(evict = {
            @CacheEvict(value = "stadiums-all", allEntries = true),
            @CacheEvict(value = "stadiums-by-id", key = "#id"),
            @CacheEvict(value = "stadiums-available", allEntries = true),
            @CacheEvict(value = "owner-stadiums", allEntries = true)
    })
    public boolean deleteStadium(Long id) {
        if (stadiumRepository.existsById(id)) {
            bookingRepository.deleteByStadiumId(id);
            stadiumRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Caching(evict = {
            @CacheEvict(value = "stadiums-all", allEntries = true),
            @CacheEvict(value = "stadiums-by-id", key = "#id"),
            @CacheEvict(value = "stadiums-available", allEntries = true),
            @CacheEvict(value = "owner-stadiums", key = "#ownerId")
    })
    public boolean deleteOwnerStadium(Long ownerId, Long id) {
        return stadiumRepository.findByIdAndOwnerId(id, ownerId)
                .map(stadium -> {
                    bookingRepository.deleteByStadiumId(stadium.getId());
                    stadiumRepository.delete(stadium);
                    return true;
                })
                .orElse(false);
    }
}
