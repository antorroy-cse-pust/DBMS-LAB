DELIMITER $$
CREATE PROCEDURE get_dept_instructors(IN dname VARCHAR(20))
BEGIN
    SELECT ID, name FROM instructor WHERE dept_name = dname;
END $$
DELIMITER ;
CALL get_dept_instructors('Comp. Sci.');
