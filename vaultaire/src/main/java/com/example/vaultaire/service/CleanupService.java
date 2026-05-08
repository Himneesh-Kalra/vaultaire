package com.example.vaultaire.service;

import com.example.vaultaire.model.FileMetaData;
import com.example.vaultaire.model.ShareToken;
import com.example.vaultaire.repository.FileRepository;
import com.example.vaultaire.repository.TokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CleanupService {

    private final TokenRepository tokenRepository;
    private final FileRepository fileRepository;
    private final MinioService minioService;

    @Scheduled(fixedRate = 60000) // every 60 seconds
    public void cleanupExpiredTokens() {

        List<ShareToken> expiredTokens =
                tokenRepository.findByExpiryTimeBefore(LocalDateTime.now());

        for (ShareToken share : expiredTokens) {

            try {

                FileMetaData file = share.getFile();

                tokenRepository.delete(share);

                boolean hasOtherTokens =
                        tokenRepository.existsByFile(file);

                if (!hasOtherTokens) {

                    minioService.deleteFile(file.getPath());

                    fileRepository.delete(file);

                    System.out.println("Deleted expired file: "
                            + file.getFileName());
                }

            } catch (Exception e) {

                System.out.println("Cleanup failed");

                e.printStackTrace();
            }
        }
    }
}