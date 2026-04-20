package com.example.footbook.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads/stadiums}")
    private String uploadDir;

    public String saveStadiumPicture(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Validate file size (max 5MB)
        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size must not exceed 5MB");
        }

        // Create directory if it doesn't exist
        Path uploadPath = Paths.get("src/main/resources/static").resolve(uploadDir);
        Files.createDirectories(uploadPath);

        // Generate unique filename
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);

        // Save file
        Files.write(filePath, file.getBytes());

        // Return URL path
        return "/" + uploadDir + "/" + filename;
    }

    public void deleteStadiumPicture(String pictureUrl) {
        if (pictureUrl == null || pictureUrl.isEmpty()) {
            return;
        }

        try {
            // Extract filename from URL
            String filename = pictureUrl.substring(pictureUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get("src/main/resources/static").resolve(uploadDir).resolve(filename);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            // Log error but don't throw - deletion failure shouldn't block operations
            System.err.println("Failed to delete file: " + pictureUrl + ", error: " + e.getMessage());
        }
    }
}
