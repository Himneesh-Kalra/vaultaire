package com.example.vaultaire.service;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class MinioService {
    private final MinioClient minioClient;


    public MinioService(){
        this.minioClient= MinioClient.builder()
                .endpoint("http://localhost:9000")
                .credentials("minio", "minio123")
                .build();
    }

    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket("vaultaire")
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from MinIO");
        }
    }

    public String uploadFile(MultipartFile file,String objectName)throws Exception{
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket("vaultaire")
                        .object(objectName)
                        .stream(file.getInputStream(),file.getSize(),-1)
                        .contentType(file.getContentType())
                        .build()
        );
        return objectName;
    }
    public InputStream getFile(String objectName) throws Exception {
        return minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket("vaultaire")
                        .object(objectName)
                        .build()
        );
    }
}
