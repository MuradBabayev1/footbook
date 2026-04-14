package com.example.footbook.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;

@Configuration
public class RedisCacheConfig {

        private static final Logger log = LoggerFactory.getLogger(RedisCacheConfig.class);

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper objectMapper = new ObjectMapper();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJacksonJsonRedisSerializer(objectMapper)
                ));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .build();
    }

        @Bean
        public CacheErrorHandler cacheErrorHandler() {
                return new CacheErrorHandler() {
                        @Override
                        public void handleCacheGetError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                                log.warn("Cache GET failed for cache '{}' and key '{}': {}", cache != null ? cache.getName() : "unknown", key, exception.getMessage());
                        }

                        @Override
                        public void handleCachePutError(RuntimeException exception, org.springframework.cache.Cache cache, Object key, Object value) {
                                log.warn("Cache PUT failed for cache '{}' and key '{}': {}", cache != null ? cache.getName() : "unknown", key, exception.getMessage());
                        }

                        @Override
                        public void handleCacheEvictError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                                log.warn("Cache EVICT failed for cache '{}' and key '{}': {}", cache != null ? cache.getName() : "unknown", key, exception.getMessage());
                        }

                        @Override
                        public void handleCacheClearError(RuntimeException exception, org.springframework.cache.Cache cache) {
                                log.warn("Cache CLEAR failed for cache '{}': {}", cache != null ? cache.getName() : "unknown", exception.getMessage());
                        }
                };
        }
}
