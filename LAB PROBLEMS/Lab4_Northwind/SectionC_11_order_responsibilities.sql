SELECT Orders.OrderID, Employee.LastName
FROM Orders, Employee
WHERE Orders.EmployeeID = Employee.EmployeeID;
