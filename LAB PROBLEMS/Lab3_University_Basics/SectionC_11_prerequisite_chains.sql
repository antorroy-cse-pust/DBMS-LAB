SELECT c.title AS course_title, p.title AS prereq_title
FROM course AS c, course AS p, prereq
WHERE c.course_id = prereq.course_id
  AND p.course_id = prereq.prereq_id;
