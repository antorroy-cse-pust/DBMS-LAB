SELECT name FROM instructor
WHERE salary > (SELECT AVG(salary) FROM instructor);
