# Official Luau AST Notes

- Alignment wave pinned to upstream Luau revision `231a59c3fe6fac8ad37c2851c756eb0873239a9f` (fetched 2026-04-25 UTC).
- Canonical grammar source: `https://luau.org/grammar/`
- Canonical AST source: `https://github.com/luau-lang/luau/blob/master/Ast/include/Luau/Ast.h`
- Canonical parser source: `https://github.com/luau-lang/luau/blob/master/Ast/src/Parser.cpp`
- Statement families use upstream `AstStat*` names. Initial locked targets include `AstStatTypeAlias`, `AstStatFunction`, `AstStatLocalFunction`, and `AstStatDeclareFunction`.
- Expression families use upstream `AstExpr*` names. Initial locked targets include `AstExprIfElse` and `AstExprInterpString`.
- Type families use upstream `AstType*` names. Initial locked targets include `AstTypeReference`.
- Canonical source locations use `begin/end`; temporary `start` support is allowed only as a compatibility field during migration.
- For `StatTypeAlias`, the canonical conceptual field is official Luau's `type`; if TypeScript contract files temporarily use `annotation` to avoid interface conflicts, that must remain a documented adaptation instead of becoming the canonical runtime spelling.
- TypeScript parser output should model official terminology first, with any legacy custom node names handled through an explicit compat layer.
- Current custom output still uses legacy names such as `ExportTypeStatement` and `FunctionDeclaration`; the new red tests intentionally pin the future official-style shape.
