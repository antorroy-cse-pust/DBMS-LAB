DELIMITER $$
CREATE PROCEDURE register_student(
    IN p_student_id VARCHAR(5),
    IN p_course_id VARCHAR(8),
    IN p_sec_id VARCHAR(8),
    IN p_semester VARCHAR(6),
    IN p_year NUMERIC(4,0)
)
BEGIN
    INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
    VALUES (p_student_id, p_course_id, p_sec_id, p_semester, p_year, NULL);
END $$
DELIMITER ;
CALL register_student('00128', 'CS-101', '1', 'Fall', 2024);
