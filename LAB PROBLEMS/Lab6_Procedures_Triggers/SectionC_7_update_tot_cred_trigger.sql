DELIMITER $$
CREATE TRIGGER update_tot_cred
AFTER UPDATE ON takes
FOR EACH ROW
BEGIN
    DECLARE course_credits NUMERIC(2,0);
    IF (OLD.grade IS NULL) AND (NEW.grade IN ('A','B','C')) THEN
        SELECT credits INTO course_credits
        FROM course
        WHERE course_id = NEW.course_id;
        UPDATE student
        SET tot_cred = tot_cred + course_credits
        WHERE ID = NEW.ID;
    END IF;
END $$
DELIMITER ;
