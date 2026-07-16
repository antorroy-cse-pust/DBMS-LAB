# CSV vs JSON vs SQL Table

| | CSV | JSON | SQL Table |
|---|---|---|---|
| Structure | Flat, rows/columns | Nested, key-value | Strictly typed, relational |
| Ease of access | Easy to open in Excel, but no type-checking | Easy for programs (APIs, JS) to parse | Needs a DB engine/query language |
| Querying | No filtering built-in, must write code | Some filtering with tools like jq, mostly code-based | Powerful filtering/joining with SQL (WHERE, JOIN, GROUP BY) |
| Best use case | Simple data exchange, spreadsheets | APIs, config, nested data | Large datasets, relationships, multi-user access |
