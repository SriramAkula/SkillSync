package com.skillsync.user.service.impl;

import com.skillsync.user.service.FileStorageService;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageServiceImpl implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.bucket.public}")
    private String publicBucket;

    @Value("${minio.bucket.private}")
    private String privateBucket;

    @Override
    public String uploadPublicFile(MultipartFile file, String pathPrefix) {
        String objectKey = generateObjectKey(file, pathPrefix);
        uploadToMinio(file, publicBucket, objectKey);
        // Return direct readable URL
        return String.format("%s/%s/%s", minioUrl, publicBucket, objectKey);
    }

    @Override
    public String uploadPrivateFile(MultipartFile file, String pathPrefix) {
        String objectKey = generateObjectKey(file, pathPrefix);
        uploadToMinio(file, privateBucket, objectKey);
        // Only return internal key, not public URL
        return objectKey;
    }

    @Override
    public String getPrivateFileUrl(String objectKey, int expiryMinutes) {
        if (objectKey == null || objectKey.isEmpty()) {
            return null;
        }
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(privateBucket)
                    .object(objectKey)
                    .expiry(expiryMinutes, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            log.error("Error generating presigned URL for key {}", objectKey, e);
            throw new RuntimeException("Could not generate secure file URL");
        }
    }

    private void uploadToMinio(MultipartFile file, String bucket, String objectKey) {
        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO bucket {}", bucket, e);
            throw new RuntimeException("Failed to store file data");
        }
    }

    private String generateObjectKey(MultipartFile file, String prefix) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return prefix + "/" + UUID.randomUUID() + extension;
    }
}
