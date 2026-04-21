package com.skillsync.user.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.url:http://localhost:9000}")
    private String url;

    @Value("${minio.access.key:admin}")
    private String accessKey;

    @Value("${minio.secret.key:dummy-secret-placeholder}")
    private String secretKey;

    @Value("${minio.bucket.public:skillsync-public}")
    private String publicBucket;

    @Value("${minio.bucket.private:skillsync-private}")
    private String privateBucket;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
        initBuckets(client);
        return client;
    }

    private void initBuckets(MinioClient client) {
        log.info("Initializing MinIO buckets...");
        try {
            // Create Public Bucket
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(publicBucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(publicBucket).build());
                log.info("Created public bucket: {}", publicBucket);

                // Set Public Read Policy
                String policy = """
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": "*",
                                    "Action": ["s3:GetObject"],
                                    "Resource": ["arn:aws:s3:::%s/*"]
                                }
                            ]
                        }
                        """.formatted(publicBucket);
                client.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(publicBucket)
                        .config(policy)
                        .build());
            }

            // Create Private Bucket
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(privateBucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(privateBucket).build());
                log.info("Created private bucket: {}", privateBucket);
            }
        } catch (Exception e) {
            log.warn("MinIO bucket initialization failed (this is expected during tests if MinIO is offline): {}",
                    e.getMessage());
        }
    }
}

// Trigger
