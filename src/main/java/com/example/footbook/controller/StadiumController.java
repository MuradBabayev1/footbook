package com.example.footbook.controller;

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

import java.util.ArrayList;
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
    public List<Stadium> getAllStadiums() {
        return new ArrayList<>(stadiums.values());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Stadium> getStadiumById(@PathVariable Long id) {
        Stadium stadium = stadiums.get(id);
        if (stadium == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(stadium);
    }

    @GetMapping("/available")
    public List<Stadium> getAvailableStadiums(@RequestParam(required = false) String city) {
        return stadiums.values().stream()
                .filter(Stadium::getAvailable)
                .filter(stadium -> city == null || stadium.getCity().equalsIgnoreCase(city))
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> createStadium(@RequestBody Stadium payload) {
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

        long id = sequence.getAndIncrement();
        payload.setId(id);
        if (payload.getAvailable() == null) {
            payload.setAvailable(true);
        }

        stadiums.put(id, payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(payload);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStadium(@PathVariable Long id, @RequestBody Stadium payload) {
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
        return ResponseEntity.ok(existing);
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
