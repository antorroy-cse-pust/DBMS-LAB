CREATE TABLE StudentProfile (
    StudentID VARCHAR(10) PRIMARY KEY,
    Name VARCHAR(50),
    Department VARCHAR(30),
    CGPA NUMERIC(3,2),
    Email VARCHAR(50)
);
INSERT INTO StudentProfile VALUES ('S001','Antor Roy','CSE',3.75,'antor@example.com');
INSERT INTO StudentProfile VALUES ('S002','Rima Akter','CSE',3.60,'rima@example.com');
INSERT INTO StudentProfile VALUES ('S003','Karim Hossain','EEE',3.40,'karim@example.com');
