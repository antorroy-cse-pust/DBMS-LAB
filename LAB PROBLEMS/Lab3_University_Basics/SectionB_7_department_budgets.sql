SELECT instructor.name, instructor.dept_name, department.budget
FROM instructor, department
WHERE instructor.dept_name = department.dept_name;
