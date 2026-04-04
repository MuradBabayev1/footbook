package com.example.footbook.service;

import com.example.footbook.dto.StadiumRequestDto;
import com.example.footbook.entity.Stadium;
import com.example.footbook.repository.StadiumRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StadiumService {

    private final StadiumRepository stadiumRepository;

    public StadiumService(StadiumRepository stadiumRepository) {
        this.stadiumRepository = stadiumRepository;
    }

    public List<Stadium> getAllStadiums() {
        return stadiumRepository.findAll();
    }

    public Optional<Stadium> getStadiumById(Long id) {
        return stadiumRepository.findById(id);
    }

    public Optional<Stadium> getStadiumByName(String name) {
        return stadiumRepository.findByName(name);
    }

    public List<Stadium> getStadiumsByCity(String city) {
        return stadiumRepository.findByCity(city);
    }

    public List<Stadium> getAvailableStadiums() {
        return stadiumRepository.findByAvailable(true);
    }

    public List<Stadium> getAvailableStadiumsByCity(String city) {
        return stadiumRepository.findByCityAndAvailable(city, true);
    }

    public Stadium createStadium(StadiumRequestDto requestDto) {
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

        return stadiumRepository.save(stadium);
    }

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
            return stadiumRepository.save(stadium);
        });
    }

    public boolean deleteStadium(Long id) {
        if (stadiumRepository.existsById(id)) {
            stadiumRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
