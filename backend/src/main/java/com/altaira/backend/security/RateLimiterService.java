package com.altaira.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String ip) {
        return buckets.computeIfAbsent("lead:" + ip, this::newLeadBucket);
    }

    public Bucket resolveLoginBucket(String key) {
        return buckets.computeIfAbsent("login:" + key, this::newLoginBucket);
    }

    private Bucket newLeadBucket(String key) {
        Bandwidth limit = Bandwidth.classic(
                10,
                Refill.greedy(10, Duration.ofMinutes(1))
        );

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket newLoginBucket(String key) {
        Bandwidth limit = Bandwidth.classic(
                5,
                Refill.greedy(5, Duration.ofMinutes(5))
        );

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
