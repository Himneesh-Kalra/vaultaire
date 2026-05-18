package com.example.vaultaire.service;

import com.example.vaultaire.model.FileMetaData;
import com.example.vaultaire.model.ShareToken;
import com.example.vaultaire.model.User;
import com.example.vaultaire.repository.FileRepository;
import com.example.vaultaire.repository.TokenRepository;
import com.example.vaultaire.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class FileService {

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private FileRepository fileRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MinioService minioService;

    public FileMetaData saveFile(MultipartFile file,UUID userId)throws IOException{

        User user=userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("User not found"));

//        String uploadDir = System.getProperty("user.dir") + File.separator + "uploads" + File.separator;
//        new File(uploadDir).mkdirs();

        String objectName= UUID.randomUUID().toString();
        try{
            minioService.uploadFile(file,objectName);
        }catch (Exception e){
            e.printStackTrace();
            throw new RuntimeException("Failed to upload to minio");
        }

//        String filePath=uploadDir+uniqueName;

//        File dest=new File(filePath);
//        file.transferTo(dest);


        FileMetaData meta=new FileMetaData();
        meta.setFileName(file.getOriginalFilename());
        meta.setPath(objectName);
        meta.setSize(file.getSize());
        meta.setUploadTime(LocalDateTime.now());
        meta.setContentType(file.getContentType());

        meta.setContentType(
                file.getContentType() != null
                        ? file.getContentType()
                        : "application/octet-stream"
        );

        meta.setUser(user);

        return fileRepository.save(meta);

    }

    public FileMetaData getFileById(UUID id){
        return fileRepository.findById(id).orElseThrow(()-> new RuntimeException("File not found"));
    }

    public String generateToken(UUID fileId,UUID userId, Integer minutes, Integer downloadLimit){
        FileMetaData file=fileRepository.findById(fileId).
                orElseThrow(()->new RuntimeException("File not found"));

        if(!file.getUser().getId().equals(userId)){
            throw new RuntimeException("You dont own this file");
        }

        String token = UUID.randomUUID().toString();

        ShareToken share=new ShareToken();

        share.setToken(token);
        share.setFile(file);

        int ttl=(minutes !=null)?minutes:10;
        share.setExpiryTime(LocalDateTime.now().plusMinutes(ttl));

        share.setDownloadLimit(downloadLimit!=null ? downloadLimit : 0);
        share.setDownloadCount(0);
        tokenRepository.save(share);

        return token;
    }

    public FileMetaData getFileByToken(String token){
        ShareToken share=tokenRepository.findByToken(token).orElseThrow(()->new RuntimeException("Invalid token"));

        FileMetaData file=share.getFile();

        if(share.getExpiryTime()!=null &&
        share.getExpiryTime().isBefore(LocalDateTime.now())){
            tokenRepository.delete(share);

            boolean hasOtherTokens=tokenRepository.existsByFile(file);

            if(!hasOtherTokens){
                minioService.deleteFile(file.getPath());
                fileRepository.delete(file);
            }
            throw new RuntimeException("Token expired");
        }

        if(share.getDownloadLimit() != null && share.getDownloadLimit()>0){
            if(share.getDownloadCount()>=share.getDownloadLimit()){
                throw new RuntimeException("Download limit reached");
            }
        }

        share.setDownloadCount(share.getDownloadCount()+1);

        tokenRepository.save(share);



        return file;
    }
    public void cleanupIfExhausted(String token, FileMetaData file) {
        tokenRepository.findByToken(token).ifPresent(share -> {
            boolean exhausted = share.getDownloadLimit() != null
                    && share.getDownloadLimit() > 0
                    && share.getDownloadCount() >= share.getDownloadLimit();

            if (exhausted) {
                tokenRepository.delete(share);
                if (!tokenRepository.existsByFile(file)) {
                    minioService.deleteFile(file.getPath());
                    fileRepository.delete(file);
                }
            }
        });
    }
}
