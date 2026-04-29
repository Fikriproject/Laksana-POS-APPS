FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions for MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Ensure $_ENV is populated from system environment variables
RUN echo "variables_order = EGPCS" >> /usr/local/etc/php/conf.d/custom.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (better Docker layer caching)
COPY composer.json composer.lock* ./

# Install PHP dependencies (no dev, optimized)
RUN composer install --no-dev --optimize-autoloader

# Copy all application files
COPY . .

# Expose port 8080
EXPOSE 8080

# Run PHP built-in server (Railway sets $PORT automatically)
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8080} -t public"]
