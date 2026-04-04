package com.example.footbook.repository;

import com.example.footbook.entity.Stadium;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StadiumRepository extends JpaRepository<Stadium, Long> {
    
    Optional<Stadium> findByName(String name);
    
    List<Stadium> findByCity(String city);
    
    List<Stadium> findByAvailable(Boolean available);
    
    List<Stadium> findByCityAndAvailable(String city, Boolean available);
}
