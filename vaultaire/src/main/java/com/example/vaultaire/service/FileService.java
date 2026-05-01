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

        String objectName= UUID.randomUUID()+"_"+file.getOriginalFilename();
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

        meta.setUser(user);

        meta.setPath(objectName);

        return fileRepository.save(meta);

    }

    public FileMetaData getFileById(UUID id){
        return fileRepository.findById(id).orElseThrow(()-> new RuntimeException("File not found"));
    }

    public String generateToken(UUID fileId,UUID userId){
        FileMetaData file=fileRepository.findById(fileId).
                orElseThrow(()->new RuntimeException("File not found"));

        if(!file.getUser().getId().equals(userId)){
            throw new RuntimeException("You dont own this file");
        }

        String token = UUID.randomUUID().toString();

        ShareToken share=new ShareToken();

        share.setToken(token);
        share.setFile(file);

        tokenRepository.save(share);

        return token;
    }

    public FileMetaData getFileByToken(String token){
        ShareToken share=tokenRepository.findByToken(token).orElseThrow(()->new RuntimeException("Invalid token"));

        return share.getFile();
    }
}
