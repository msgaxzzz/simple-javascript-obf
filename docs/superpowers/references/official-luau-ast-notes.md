# Official Luau AST Notes

- Canonical grammar source: `https://luau.org/grammar/`
- Canonical AST source: `https://github.com/luau-lang/luau/blob/master/Ast/include/Luau/Ast.h`
- Canonical parser source: `https://github.com/luau-lang/luau/blob/master/Ast/src/Parser.cpp`
- Statement families use upstream `AstStat*` names. Initial locked targets include `AstStatTypeAlias`, `AstStatFunction`, and `AstStatDeclareFunction`.
- Expression families use upstream `AstExpr*` names. Initial locked targets include `AstExprIfElse` and `AstExprInterpString`.
- Type families use upstream `AstType*` names. Initial locked targets include `AstTypeReference`.
- TypeScript parser output should model official terminology first, with any legacy custom node names handled through an explicit compat layer.
- Current custom output still uses legacy names such as `ExportTypeStatement` and `FunctionDeclaration`; the new red tests intentionally pin the future official-style shape.
