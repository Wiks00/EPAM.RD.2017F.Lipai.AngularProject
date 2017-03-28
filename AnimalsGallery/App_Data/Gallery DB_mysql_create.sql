CREATE TABLE Users (
	id INT IDENTITY(1,1) PRIMARY KEY,
	username VARCHAR(100) NOT NULL,
	password VARCHAR(1000) NOT NULL
);

CREATE TABLE Roles (
	id INT IDENTITY(1,1) PRIMARY KEY,
	role VARCHAR(100) NOT NULL
);

CREATE TABLE Membership (
	userId INT NOT NULL ,
	roleId INT NOT NULL ,
	constraint pk_Membership PRIMARY KEY(userId,roleId)
);

CREATE TABLE Votes (
	userId INT NOT NULL,
	imageId INT NOT NULL,
    rating FLOAT NOT NULL
	CONSTRAINT pk_Votes PRIMARY KEY(userId,imageId)
);

CREATE TABLE Albums (
	id INT IDENTITY(1,1) PRIMARY KEY,
	userId INT NOT NULL,
	title VARCHAR(100) NOT NULL,
	rating FLOAT NOT NULL
);

CREATE TABLE Images (
	id INT IDENTITY(1,1) PRIMARY KEY,
	albumId INT NOT NULL,
	data VARBINARY(MAX) NOT NULL,
	format VARCHAR(100) NOT NULL,
	title VARCHAR(100) NOT NULL,
	description VARCHAR(1000) NOT NULL,
	price FLOAT NOT NULL,
	postDate DATETIME NOT NULL,
	allowable BIT NOT NULL,
	CHECK (allowable = 1 or allowable = -1) 
);

ALTER TABLE Albums ADD CONSTRAINT album_fk0 FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE;

ALTER TABLE Images ADD CONSTRAINT image_fk0 FOREIGN KEY (albumId) REFERENCES Albums(id) ON DELETE CASCADE;

ALTER TABLE Membership ADD CONSTRAINT Membership_fk0 FOREIGN KEY (userId) REFERENCES Users(id);

ALTER TABLE Membership ADD CONSTRAINT Membership_fk1 FOREIGN KEY (roleId) REFERENCES Roles(id);

ALTER TABLE Votes ADD CONSTRAINT Votes_fk0 FOREIGN KEY (userId) REFERENCES Users(id);

ALTER TABLE Votes ADD CONSTRAINT Votes_fk1 FOREIGN KEY (imageId) REFERENCES Images(id);