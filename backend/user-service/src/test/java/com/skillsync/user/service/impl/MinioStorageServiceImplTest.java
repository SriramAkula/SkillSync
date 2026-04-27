package com.skillsync.user.service.impl;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MinioStorageServiceImplTest {

    @Mock
    private MinioClient minioClient;

    @InjectMocks
    private MinioStorageServiceImpl minioStorageService;

    @Mock
    private MultipartFile multipartFile;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(minioStorageService, "minioUrl", "http://localhost:9000");
        ReflectionTestUtils.setField(minioStorageService, "externalUrl", "http://minio.external.com");
        ReflectionTestUtils.setField(minioStorageService, "publicBucket", "public-bucket");
        ReflectionTestUtils.setField(minioStorageService, "privateBucket", "private-bucket");
    }

    @Test
    void uploadPublicFile_shouldReturnUrl() throws Exception {
        when(multipartFile.getOriginalFilename()).thenReturn("test.jpg");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(multipartFile.getSize()).thenReturn(4L);
        when(multipartFile.getContentType()).thenReturn("image/jpeg");

        String result = minioStorageService.uploadPublicFile(multipartFile, "profiles");

        assertThat(result).startsWith("http://minio.external.com/public-bucket/profiles/");
        assertThat(result).endsWith(".jpg");
        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    @Test
    void uploadPrivateFile_shouldReturnObjectKey() throws Exception {
        when(multipartFile.getOriginalFilename()).thenReturn("doc.pdf");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(multipartFile.getSize()).thenReturn(4L);
        when(multipartFile.getContentType()).thenReturn("application/pdf");

        String result = minioStorageService.uploadPrivateFile(multipartFile, "resumes");

        assertThat(result).startsWith("resumes/");
        assertThat(result).endsWith(".pdf");
        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    @Test
    void getPrivateFileUrl_shouldReturnExternalUrl() throws Exception {
        String objectKey = "resumes/file.pdf";
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn("http://localhost:9000/private-bucket/resumes/file.pdf?token=123");

        String result = minioStorageService.getPrivateFileUrl(objectKey, 10);

        assertThat(result).isEqualTo("http://minio.external.com/private-bucket/resumes/file.pdf?token=123");
    }

    @Test
    void getPrivateFileUrl_shouldReturnNull_whenKeyEmpty() {
        assertThat(minioStorageService.getPrivateFileUrl(null, 10)).isNull();
        assertThat(minioStorageService.getPrivateFileUrl("", 10)).isNull();
    }

    @Test
    void getPrivateFileUrl_shouldThrow_whenMinioFails() throws Exception {
        when(minioClient.getPresignedObjectUrl(any())).thenThrow(new RuntimeException("Minio error"));
        assertThrows(RuntimeException.class, () -> minioStorageService.getPrivateFileUrl("key", 10));
    }

    @Test
    void uploadToMinio_shouldThrow_whenInputStreamFails() throws Exception {
        when(multipartFile.getInputStream()).thenThrow(new RuntimeException("IO error"));
        assertThrows(RuntimeException.class, () -> minioStorageService.uploadPublicFile(multipartFile, "prefix"));
    }

    @Test
    void generateObjectKey_shouldHandleNoExtension() throws Exception {
        when(multipartFile.getOriginalFilename()).thenReturn("filename_without_dot");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(multipartFile.getSize()).thenReturn(4L);
        when(multipartFile.getContentType()).thenReturn("application/octet-stream");
        
        String result = minioStorageService.uploadPublicFile(multipartFile, "prefix");
        
        assertThat(result).contains("/prefix/");
        // No extension at the end
        String filename = result.substring(result.lastIndexOf("/") + 1);
        assertThat(filename).doesNotContain(".");
    }

    @Test
    void generateObjectKey_shouldHandleNullFilename() throws Exception {
        when(multipartFile.getOriginalFilename()).thenReturn(null);
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(multipartFile.getSize()).thenReturn(4L);
        when(multipartFile.getContentType()).thenReturn("application/octet-stream");
        
        String result = minioStorageService.uploadPublicFile(multipartFile, "prefix");
        assertThat(result).contains("/prefix/");
    }
}
