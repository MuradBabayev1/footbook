package com.example.footbook.controller;

import com.example.footbook.dto.StadiumRequestDto;
import com.example.footbook.dto.StadiumResponseDto;
import com.example.footbook.entity.Owner;
import com.example.footbook.entity.Stadium;
import com.example.footbook.repository.OwnerRepository;
import com.example.footbook.service.StadiumService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

@RestController
@RequestMapping("/api/stadiums")
public class StadiumController {

    private final StadiumService stadiumService;
    private final OwnerRepository ownerRepository;

    public StadiumController(StadiumService stadiumService, OwnerRepository ownerRepository) {
        this.stadiumService = stadiumService;
        this.ownerRepository = ownerRepository;
    }

    @GetMapping
    @Cacheable("stadiums-all")
    public List<StadiumResponseDto> getAllStadiums() {
        return stadiumService.getAllStadiums().stream()
                .map(StadiumResponseDto::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    @Cacheable(value = "stadiums-by-id", key = "#id")
    public ResponseEntity<StadiumResponseDto> getStadiumById(@PathVariable Long id) {
        return stadiumService.getStadiumById(id)
                .map(stadium -> ResponseEntity.ok(StadiumResponseDto.fromEntity(stadium)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/available")
    @Cacheable(value = "stadiums-available", key = "#city == null ? 'all' : #city")
    public List<StadiumResponseDto> getAvailableStadiums(@RequestParam(required = false) String city) {
        List<Stadium> stadiums;
        if (city != null && !city.isBlank()) {
            stadiums = stadiumService.getAvailableStadiumsByCity(city);
        } else {
            stadiums = stadiumService.getAvailableStadiums();
        }
        return stadiums.stream()
                .map(StadiumResponseDto::fromEntity)
                .toList();
    }

    @GetMapping("/owner/mine")
    @Cacheable(value = "owner-stadiums", key = "authentication != null ? authentication.name : 'anonymous'")
    public ResponseEntity<?> getMyStadiums(Authentication authentication) {
        Owner owner = resolveOwner(authentication);
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only owners can access this endpoint");
        }

        List<StadiumResponseDto> stadiums = stadiumService.getStadiumsByOwnerId(owner.getId()).stream()
                .map(StadiumResponseDto::fromEntity)
                .toList();
        return ResponseEntity.ok(stadiums);
    }

    @PostMapping
    public ResponseEntity<?> createStadium(@RequestBody StadiumRequestDto payload, Authentication authentication) {
        try {
            Owner owner = resolveOwner(authentication);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only owners can add stadiums");
            }

            Stadium stadium = stadiumService.createStadium(payload, owner);
            return ResponseEntity.status(HttpStatus.CREATED).body(StadiumResponseDto.fromEntity(stadium));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/owner/{id}")
    public ResponseEntity<?> updateOwnerStadium(@PathVariable Long id,
                                                @RequestBody StadiumRequestDto payload,
                                                Authentication authentication) {
        try {
            Owner owner = resolveOwner(authentication);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only owners can update stadiums");
            }

            return stadiumService.updateOwnerStadium(owner.getId(), id, payload)
                    .map(stadium -> ResponseEntity.ok(StadiumResponseDto.fromEntity(stadium)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/owner/{id}")
    public ResponseEntity<?> deleteOwnerStadium(@PathVariable Long id, Authentication authentication) {
        Owner owner = resolveOwner(authentication);
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only owners can delete stadiums");
        }

        if (stadiumService.deleteOwnerStadium(owner.getId(), id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Stadium not found for this owner");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStadium(@PathVariable Long id, @RequestBody StadiumRequestDto payload) {
        try {
            return stadiumService.updateStadium(id, payload)
                    .map(stadium -> ResponseEntity.ok(StadiumResponseDto.fromEntity(stadium)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStadium(@PathVariable Long id) {
        if (stadiumService.deleteStadium(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private Owner resolveOwner(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return ownerRepository.findByUserEmail(authentication.getName()).orElse(null);
    }
}
