SELECT Product.ProductName, Supplier.City
FROM Product, Supplier
WHERE Product.SupplierID = Supplier.SupplierID;
