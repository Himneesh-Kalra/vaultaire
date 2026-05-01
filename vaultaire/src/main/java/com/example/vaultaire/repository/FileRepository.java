package com.example.vaultaire.repository;

import com.example.vaultaire.model.FileMetaData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FileRepository extends JpaRepository<FileMetaData, UUID> {

}
