package com.example.vaultaire.controller;

import com.example.vaultaire.model.FileMetaData;
import com.example.vaultaire.service.FileService;
import com.example.vaultaire.service.MinioService;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
public class FileController {

    @Autowired
    private MinioService minioService;

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file")MultipartFile file,
                                        @RequestParam UUID userId) throws IOException{
        FileMetaData saved= fileService.saveFile(file,userId);
        return ResponseEntity.ok(saved.getId());
    }

//    @GetMapping("/internal/download/{id}")
//    public ResponseEntity<UrlResource> downloadById(@PathVariable UUID id)throws IOException{
//        FileMetaData fileMeta=fileService.getFileById(id);
//        Path path= Paths.get(fileMeta.getPath());
//        UrlResource resource= new UrlResource(path.toUri());
//        if(!resource.exists()){
//            throw new RuntimeException("File not found on disk");
//        }
//
//        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileMeta.getFileName() + "\"")
//                .body(resource);
//
//    }

    @PostMapping("/share")
    public ResponseEntity<?> share(@RequestParam UUID fileId,
                                   @RequestParam UUID userId,
                                   @RequestParam(required = false)Integer minutes,
                                   @RequestParam(required = false)Integer downloadLimit){
        String token=fileService.generateToken(fileId,userId,minutes,downloadLimit);
        return ResponseEntity.ok("/download/"+token);
    }

    @GetMapping("/download/{token}")
    public ResponseEntity<?> downloadByToken(@PathVariable String token) throws IOException{

        try{
            FileMetaData fileMetaData=fileService.getFileByToken(token);

            InputStream stream=minioService.getFile(fileMetaData.getPath());

            fileService.cleanupIfExhausted(token, fileMetaData);

            return ResponseEntity.ok().contentType(
                            MediaType.parseMediaType(fileMetaData.getContentType())
                    ).header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileMetaData.getFileName() + "\"")
                .body(new InputStreamResource(stream));

        }catch (Exception e){
            throw new RuntimeException("Download failed",e);
        }

//        Path path=Paths.get(fileMetaData.getPath());
//        UrlResource resource=new UrlResource(path.toUri());




    }


}
