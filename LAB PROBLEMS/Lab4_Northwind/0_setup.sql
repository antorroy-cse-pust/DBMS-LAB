DROP TABLE IF EXISTS OrderDetail;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Supplier;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Employee;
CREATE TABLE Category (
    CategoryID INT PRIMARY KEY,
    CategoryName VARCHAR(50),
    Description VARCHAR(100)
);
CREATE TABLE Supplier (
    SupplierID INT PRIMARY KEY,
    CompanyName VARCHAR(50),
    ContactName VARCHAR(50),
    City VARCHAR(50),
    Country VARCHAR(50)
);
CREATE TABLE Product (
    ProductID INT PRIMARY KEY,
    ProductName VARCHAR(50),
    SupplierID INT,
    CategoryID INT,
    Unit VARCHAR(50),
    Price NUMERIC(10,2),
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
    FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID)
);
CREATE TABLE Employee (
    EmployeeID INT PRIMARY KEY,
    LastName VARCHAR(20),
    FirstName VARCHAR(20),
    Title VARCHAR(30),
    City VARCHAR(30),
    Country VARCHAR(30)
);
CREATE TABLE Customer (
    CustomerID VARCHAR(5) PRIMARY KEY,
    CompanyName VARCHAR(50),
    ContactName VARCHAR(50),
    City VARCHAR(50),
    Country VARCHAR(50)
);
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY,
    CustomerID VARCHAR(5),
    EmployeeID INT,
    OrderDate DATE,
    ShipCity VARCHAR(50),
    ShipCountry VARCHAR(50),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);
CREATE TABLE OrderDetail (
    OrderID INT,
    ProductID INT,
    UnitPrice NUMERIC(10,2),
    Quantity INT,
    PRIMARY KEY (OrderID, ProductID),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);
INSERT INTO Category VALUES (1, 'Beverages', 'Soft drinks, coffees, teas, beers');
INSERT INTO Category VALUES (2, 'Condiments', 'Sweet and savory sauces, relishes');
INSERT INTO Category VALUES (3, 'Seafood', 'Seaweed and fish');
INSERT INTO Supplier VALUES (1, 'Exotic Liquids', 'Charlotte Cooper', 'London', 'UK');
INSERT INTO Supplier VALUES (2, 'New Orleans Cajun Delights', 'Shelley Burke', 'New Orleans', 'USA');
INSERT INTO Supplier VALUES (3, 'Tokyo Traders', 'Yoshi Nagase', 'Tokyo', 'Japan');
INSERT INTO Product VALUES (1, 'Chais', 1, 1, '10 boxes x 20 bags', 18.00);
INSERT INTO Product VALUES (2, 'Chang', 1, 1, '24 - 12 oz bottles', 19.00);
INSERT INTO Product VALUES (3, 'Aniseed Syrup', 1, 2, '12 - 550 ml bottles', 10.00);
INSERT INTO Product VALUES (4, 'Ikura', 3, 3, '12 - 200 ml jars', 31.00);
INSERT INTO Employee VALUES (1, 'Davolio', 'Nancy', 'Sales Rep', 'Seattle', 'USA');
INSERT INTO Employee VALUES (2, 'Fuller', 'Andrew', 'Vice President', 'Tacoma', 'USA');
INSERT INTO Employee VALUES (3, 'Leverling', 'Janet', 'Sales Rep', 'Kirkland', 'USA');
INSERT INTO Customer VALUES ('ALFKI', 'Alfreds Futterkiste', 'Maria Anders', 'Berlin', 'Germany');
INSERT INTO Customer VALUES ('ANATR', 'Ana Trujillo Emparedados', 'Ana Trujillo', 'Mexico D.F.', 'Mexico');
INSERT INTO Customer VALUES ('AROUT', 'Around the Horn', 'Thomas Hardy', 'London', 'UK');
INSERT INTO Orders VALUES (10248, 'ALFKI', 1, '2025-07-04', 'Berlin', 'Germany');
INSERT INTO Orders VALUES (10249, 'ANATR', 1, '2025-07-05', 'Mexico D.F.', 'Mexico');
INSERT INTO Orders VALUES (10250, 'AROUT', 2, '2025-07-08', 'London', 'UK');
INSERT INTO OrderDetail VALUES (10248, 1, 18.00, 10);
INSERT INTO OrderDetail VALUES (10248, 3, 10.00, 5);
INSERT INTO OrderDetail VALUES (10249, 4, 31.00, 2);
INSERT INTO OrderDetail VALUES (10250, 2, 19.00, 10);
