package com.example.footbook.repository;

import com.example.footbook.entity.Owner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, Long> {

    Optional<Owner> findByUserId(Long userId);

    Optional<Owner> findByUserEmail(String email);

    boolean existsByUserId(Long userId);
}
