SELECT dept_name, AVG(salary) AS avg_salary
FROM instructor
GROUP BY dept_name;
