package com.skillsync.user.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    
    /**
     * Uploads a file to a public bucket. Typically used for images.
     * @return the public URL of the uploaded file
     */
    String uploadPublicFile(MultipartFile file, String pathPrefix);

    /**
     * Uploads a file to a private bucket. Typically used for resumes.
     * @return the internal object path/key
     */
    String uploadPrivateFile(MultipartFile file, String pathPrefix);

    /**
     * Generates a pre-signed URL for temporary secure access to a private file.
     * @return a temporary secure URL string
     */
    String getPrivateFileUrl(String objectKey, int expiryMinutes);
}
