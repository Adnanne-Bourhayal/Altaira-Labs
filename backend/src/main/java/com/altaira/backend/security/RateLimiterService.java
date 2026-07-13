package com.altaira.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int leadCapacity;
    private final int leadRefillPerMinute;
    private final int loginCapacity;
    private final int loginRefillPerFiveMinutes;

    public RateLimiterService(
            @Value("${altaira.rate-limit.leads.capacity:10}") int leadCapacity,
            @Value("${altaira.rate-limit.leads.refill-per-minute:10}") int leadRefillPerMinute,
            @Value("${altaira.rate-limit.login.capacity:5}") int loginCapacity,
            @Value("${altaira.rate-limit.login.refill-per-five-minutes:5}") int loginRefillPerFiveMinutes
    ) {
        this.leadCapacity = leadCapacity;
        this.leadRefillPerMinute = leadRefillPerMinute;
        this.loginCapacity = loginCapacity;
        this.loginRefillPerFiveMinutes = loginRefillPerFiveMinutes;
    }

    public Bucket resolveBucket(String ip) {
        return buckets.computeIfAbsent("lead:" + ip, this::newLeadBucket);
    }

    public Bucket resolveLoginBucket(String key) {
        return buckets.computeIfAbsent("login:" + key, this::newLoginBucket);
    }

    private Bucket newLeadBucket(String key) {
        Bandwidth limit = Bandwidth.classic(
                leadCapacity,
                Refill.greedy(leadRefillPerMinute, Duration.ofMinutes(1))
        );

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket newLoginBucket(String key) {
        Bandwidth limit = Bandwidth.classic(
                loginCapacity,
                Refill.greedy(loginRefillPerFiveMinutes, Duration.ofMinutes(5))
        );

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
