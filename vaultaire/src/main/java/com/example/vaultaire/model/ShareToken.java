package com.example.vaultaire.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Data
public class ShareToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String token;

    @ManyToOne
    @JoinColumn(name="file_id")
    private FileMetaData file;

}
