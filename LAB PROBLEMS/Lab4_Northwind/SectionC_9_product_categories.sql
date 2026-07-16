SELECT Product.ProductName, Category.CategoryName
FROM Product, Category
WHERE Product.CategoryID = Category.CategoryID;
