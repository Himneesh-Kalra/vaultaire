package com.example.vaultaire.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
public class ShareToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String token;


    @Column
    private Integer downloadLimit;

    @Column
    private Integer downloadCount;

    @Column
    private LocalDateTime expiryTime;

    @ManyToOne
    @JoinColumn(name="file_id")
    private FileMetaData file;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Integer getDownloadLimit() {
        return downloadLimit;
    }

    public void setDownloadLimit(Integer downloadLimit) {
        this.downloadLimit = downloadLimit;
    }

    public Integer getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }

    public FileMetaData getFile() {
        return file;
    }

    public void setFile(FileMetaData file) {
        this.file = file;
    }
}
