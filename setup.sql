DROP TABLE IF EXISTS signatures;

  CREATE TABLE signatures (
       id SERIAL PRIMARY KEY,
       signature VARCHAR NOT NULL CHECK (signature != '' AND signature <> 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAABkCAYAAABwx8J9AAAAAXNSR0IArs4c6QAABE1JREFUeF7t1YEJACAMA0G7/9AV3MLnnMBcCpnd3eMRIECAAAECXwuMQf+6P58nQIAAAQJPwKA7BAIECBAgEBAw6IESRSBAgAABAgbdDRAgQIAAgYCAQQ+UKAIBAgQIEDDoboAAAQIECAQEDHqgRBEIECBAgIBBdwMECBAgQCAgYNADJYpAgAABAgQMuhsgQIAAAQIBAYMeKFEEAgQIECBg0N0AAQIECBAICBj0QIkiECBAgAABg+4GCBAgQIBAQMCgB0oUgQABAgQIGHQ3QIAAAQIEAgIGPVCiCAQIECBAwKC7AQIECBAgEBAw6IESRSBAgAABAgbdDRAgQIAAgYCAQQ+UKAIBAgQIEDDoboAAAQIECAQEDHqgRBEIECBAgIBBdwMECBAgQCAgYNADJYpAgAABAgQMuhsgQIAAAQIBAYMeKFEEAgQIECBg0N0AAQIECBAICBj0QIkiECBAgAABg+4GCBAgQIBAQMCgB0oUgQABAgQIGHQ3QIAAAQIEAgIGPVCiCAQIECBAwKC7AQIECBAgEBAw6IESRSBAgAABAgbdDRAgQIAAgYCAQQ+UKAIBAgQIEDDoboAAAQIECAQEDHqgRBEIECBAgIBBdwMECBAgQCAgYNADJYpAgAABAgQMuhsgQIAAAQIBAYMeKFEEAgQIECBg0N0AAQIECBAICBj0QIkiECBAgAABg+4GCBAgQIBAQMCgB0oUgQABAgQIGHQ3QIAAAQIEAgIGPVCiCAQIECBAwKC7AQIECBAgEBAw6IESRSBAgAABAgbdDRAgQIAAgYCAQQ+UKAIBAgQIEDDoboAAAQIECAQEDHqgRBEIECBAgIBBdwMECBAgQCAgYNADJYpAgAABAgQMuhsgQIAAAQIBAYMeKFEEAgQIECBg0N0AAQIECBAICBj0QIkiECBAgAABg+4GCBAgQIBAQMCgB0oUgQABAgQIGHQ3QIAAAQIEAgIGPVCiCAQIECBAwKC7AQIECBAgEBAw6IESRSBAgAABAgbdDRAgQIAAgYCAQQ+UKAIBAgQIEDDoboAAAQIECAQEDHqgRBEIECBAgIBBdwMECBAgQCAgYNADJYpAgAABAgQMuhsgQIAAAQIBAYMeKFEEAgQIECBg0N0AAQIECBAICBj0QIkiECBAgAABg+4GCBAgQIBAQMCgB0oUgQABAgQIGHQ3QIAAAQIEAgIGPVCiCAQIECBAwKC7AQIECBAgEBAw6IESRSBAgAABAgbdDRAgQIAAgYCAQQ+UKAIBAgQIEDDoboAAAQIECAQEDHqgRBEIECBAgIBBdwMECBAgQCAgYNADJYpAgAABAgQMuhsgQIAAAQIBAYMeKFEEAgQIECBg0N0AAQIECBAICBj0QIkiECBAgAABg+4GCBAgQIBAQMCgB0oUgQABAgQIGHQ3QIAAAQIEAgIGPVCiCAQIECBAwKC7AQIECBAgEBAw6IESRSBAgAABAhcJZo7kLrW9zAAAAABJRU5ErkJggg=='),
       user_id INT NOT NULL
   );

DROP TABLE IF EXISTS users;

   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       first VARCHAR NOT NULL CHECK (first != ''),
       last VARCHAR NOT NULL CHECK (last != ''),
       email VARCHAR NOT NULL UNIQUE CHECK (email != ''),
       password VARCHAR NOT NULL CHECK (password != '')
   );