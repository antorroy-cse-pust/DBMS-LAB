SELECT dept_name, COUNT(*) AS num_instructors
FROM instructor
GROUP BY dept_name;
