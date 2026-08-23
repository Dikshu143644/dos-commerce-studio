# =============================================================================
# Stage 1: Composer dependencies
# =============================================================================
FROM php:8.4-cli-alpine AS composer-deps

# Install composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install required extensions for dependency resolution
RUN apk add --no-cache libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev icu-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) zip gd intl mbstring

WORKDIR /app

COPY composer.json composer.lock* ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

# =============================================================================
# Stage 2: Production image
# =============================================================================
FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    curl-dev \
    linux-headers

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        zip \
        gd \
        intl \
        mbstring \
        curl \
        opcache

# Configure OPcache for production
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.save_comments=1'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=0'; \
    echo 'opcache.jit=tracing'; \
    echo 'opcache.jit_buffer_size=64M'; \
} > /usr/local/etc/php/conf.d/opcache.ini

# Configure PHP-FPM pool for production
RUN { \
    echo '[www]'; \
    echo 'user = www-data'; \
    echo 'group = www-data'; \
    echo 'listen = 127.0.0.1:9000'; \
    echo 'pm = dynamic'; \
    echo 'pm.max_children = 50'; \
    echo 'pm.start_servers = 5'; \
    echo 'pm.min_spare_servers = 5'; \
    echo 'pm.max_spare_servers = 35'; \
    echo 'pm.max_requests = 500'; \
    echo 'pm.process_idle_timeout = 10s'; \
    echo 'request_terminate_timeout = 300'; \
    echo 'catch_workers_output = yes'; \
    echo 'decorate_workers_output = no'; \
    echo 'clear_env = no'; \
} > /usr/local/etc/php-fpm.d/www.conf

# Configure PHP for production
RUN { \
    echo 'memory_limit=256M'; \
    echo 'upload_max_filesize=50M'; \
    echo 'post_max_size=50M'; \
    echo 'max_execution_time=300'; \
    echo 'max_input_time=300'; \
    echo 'expose_php=Off'; \
    echo 'display_errors=Off'; \
    echo 'log_errors=On'; \
    echo 'error_log=/dev/stderr'; \
} > /usr/local/etc/php/conf.d/production.ini

# Set working directory
WORKDIR /var/www/html

# Copy Nginx configuration
COPY nginx/default.conf /etc/nginx/http.d/default.conf

# Remove default nginx config if it exists
RUN rm -f /etc/nginx/http.d/default.conf.bak

# Configure Nginx - ensure pid and tmp directories are writable
RUN mkdir -p /run/nginx /var/log/nginx /var/tmp/nginx \
    && chown -R www-data:www-data /run/nginx /var/log/nginx /var/tmp/nginx

# Supervisor configuration
RUN mkdir -p /etc/supervisor/conf.d && { \
    echo '[supervisord]'; \
    echo 'nodaemon=true'; \
    echo 'user=root'; \
    echo 'logfile=/dev/null'; \
    echo 'logfile_maxbytes=0'; \
    echo 'pidfile=/tmp/supervisord.pid'; \
    echo ''; \
    echo '[program:php-fpm]'; \
    echo 'command=php-fpm --nodaemonize'; \
    echo 'autostart=true'; \
    echo 'autorestart=true'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo ''; \
    echo '[program:nginx]'; \
    echo 'command=nginx -g "daemon off;"'; \
    echo 'autostart=true'; \
    echo 'autorestart=true'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
} > /etc/supervisor/conf.d/supervisord.conf

# Copy composer dependencies from build stage
COPY --from=composer-deps /app/vendor ./vendor

# Copy application source
COPY . .

# Create storage directories with correct permissions
RUN mkdir -p storage/pdfs storage/exports storage/logs \
    && chown -R www-data:www-data storage \
    && chmod -R 775 storage

# Ensure proper ownership of application files
RUN chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1/api/health || exit 1

# Start supervisord (manages nginx + php-fpm)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
