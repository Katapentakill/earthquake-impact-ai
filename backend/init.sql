-- Initialization script for seismic database

CREATE TABLE IF NOT EXISTS eventos_sismicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    magnitud DECIMAL(3,1) NOT NULL,
    profundidad DECIMAL(6,2) NOT NULL,
    latitud DECIMAL(9,6) NOT NULL,
    longitud DECIMAL(9,6) NOT NULL,
    fecha_utc DATETIME NOT NULL,
    lugar VARCHAR(255),
    radio_afectacion_km DECIMAL(8,2),
    fuente_api VARCHAR(50) DEFAULT 'USGS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha_utc),
    INDEX idx_magnitud (magnitud),
    INDEX idx_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS impactos_pais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    ciudades_afectadas JSON,
    muertes_estimadas INT DEFAULT 0,
    heridos_estimados INT DEFAULT 0,
    perdidas_monetarias_usd BIGINT DEFAULT 0,
    nivel_destruccion ENUM('BAJO', 'MODERADO', 'ALTO', 'CATASTROFICO') DEFAULT 'BAJO',
    fuentes_inferidas JSON,
    razonamiento_ia TEXT,
    factores_considerados JSON,
    codigo_construccion VARCHAR(255),
    nivel_preparacion_sismica VARCHAR(50),
    densidad_poblacional VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES eventos_sismicos(event_id) ON DELETE CASCADE,
    INDEX idx_event_pais (event_id, pais),
    INDEX idx_pais (pais),
    INDEX idx_nivel (nivel_destruccion),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cache_inferencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hash_consulta VARCHAR(64) UNIQUE NOT NULL,
    respuesta_ia JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_hash (hash_consulta),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
