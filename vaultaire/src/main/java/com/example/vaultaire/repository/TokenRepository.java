package com.example.vaultaire.repository;

import com.example.vaultaire.model.ShareToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TokenRepository extends JpaRepository<ShareToken , UUID> {
    Optional<ShareToken> findByToken(String token);
}
