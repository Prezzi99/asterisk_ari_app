CREATE TABLE calling_rates_per_min (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rate DECIMAL(4,3) NOT NULL
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(11) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255),
    joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    balance DECIMAL(7,3) NOT NULL DEFAULT 0 -- The users credit for calling
);

CREATE TABLE sheets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(50) NOT NULL,
    content MEDIUMBLOB NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, title)
);

CREATE TABLE agents (
	id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(11) NOT NULL,
    
    UNIQUE(user_id, phone_number),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE scripts ( -- 
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(50) NOT NULL,
    content TEXT, -- Dialplan for the corresponding context

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE itsps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    internal_name TINYTEXT NOT NULL -- PJSIP endpoint name
);

CREATE TABLE dids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    itsp_id INT NOT NULL,
    country_code ENUM ('us', 'ca') NOT NULL,
    phone_number VARCHAR(11) NOT NULL UNIQUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (itsp_id) REFERENCES itsps(id)
);