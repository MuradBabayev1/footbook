package com.example.footbook.controller;

import com.example.footbook.dto.StadiumRequestDto;
import com.example.footbook.dto.StadiumResponseDto;
import com.example.footbook.entity.Stadium;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/stadiums")
public class StadiumController {

    private final Map<Long, Stadium> stadiums = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @GetMapping
    public List<StadiumResponseDto> getAllStadiums() {
        return stadiums.values().stream()
                .map(StadiumResponseDto::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<StadiumResponseDto> getStadiumById(@PathVariable Long id) {
        Stadium stadium = stadiums.get(id);
        if (stadium == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(StadiumResponseDto.fromEntity(stadium));
    }

    @GetMapping("/available")
    public List<StadiumResponseDto> getAvailableStadiums(@RequestParam(required = false) String city) {
        return stadiums.values().stream()
                .filter(Stadium::getAvailable)
                .filter(stadium -> city == null || stadium.getCity().equalsIgnoreCase(city))
                .map(StadiumResponseDto::fromEntity)
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> createStadium(@RequestBody StadiumRequestDto payload) {
        if (payload.getName() == null || payload.getName().isBlank()) {
            return ResponseEntity.badRequest().body("name is required");
        }
        if (payload.getCity() == null || payload.getCity().isBlank()) {
            return ResponseEntity.badRequest().body("city is required");
        }
        if (payload.getLocation() == null || payload.getLocation().isBlank()) {
            return ResponseEntity.badRequest().body("location is required");
        }
        if (payload.getCapacity() == null || payload.getCapacity() <= 0) {
            return ResponseEntity.badRequest().body("capacity must be greater than zero");
        }

        Stadium stadium = new Stadium();
        stadium.setName(payload.getName());
        stadium.setCity(payload.getCity());
        stadium.setLocation(payload.getLocation());
        stadium.setCapacity(payload.getCapacity());
        stadium.setAvailable(payload.getAvailable());

        long id = sequence.getAndIncrement();
        stadium.setId(id);
        if (stadium.getAvailable() == null) {
            stadium.setAvailable(true);
        }

        stadiums.put(id, stadium);
        return ResponseEntity.status(HttpStatus.CREATED).body(StadiumResponseDto.fromEntity(stadium));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStadium(@PathVariable Long id, @RequestBody StadiumRequestDto payload) {
        Stadium existing = stadiums.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (payload.getName() != null && !payload.getName().isBlank()) {
            existing.setName(payload.getName());
        }
        if (payload.getCity() != null && !payload.getCity().isBlank()) {
            existing.setCity(payload.getCity());
        }
        if (payload.getLocation() != null && !payload.getLocation().isBlank()) {
            existing.setLocation(payload.getLocation());
        }
        if (payload.getCapacity() != null && payload.getCapacity() > 0) {
            existing.setCapacity(payload.getCapacity());
        }
        if (payload.getAvailable() != null) {
            existing.setAvailable(payload.getAvailable());
        }

        stadiums.put(id, existing);
        return ResponseEntity.ok(StadiumResponseDto.fromEntity(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStadium(@PathVariable Long id) {
        Stadium removed = stadiums.remove(id);
        if (removed == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
