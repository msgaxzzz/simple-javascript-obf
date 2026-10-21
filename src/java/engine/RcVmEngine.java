package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.TreePath;
import com.sun.source.util.Trees;
import java.util.*;

public final class RcVmEngine {
    public static final int OP_NOP    = 0;
    public static final int OP_LOADK  = 1;  // R[dst] = K[src1]
    public static final int OP_MOVE   = 2;  // R[dst] = R[src1]
    public static final int OP_ADD    = 3;  // R[dst] = R[src1] + R[src2]
    public static final int OP_SUB    = 4;  // R[dst] = R[src1] - R[src2]
    public static final int OP_MUL    = 5;  // R[dst] = R[src1] * R[src2]
    public static final int OP_DIV    = 6;  // R[dst] = R[src1] / R[src2]
    public static final int OP_MOD    = 7;  // R[dst] = R[src1] % R[src2]
    public static final int OP_BAND   = 8;  // R[dst] = R[src1] & R[src2]
    public static final int OP_BOR    = 9;  // R[dst] = R[src1] | R[src2]
    public static final int OP_BXOR   = 10; // R[dst] = R[src1] ^ R[src2]
    public static final int OP_SHL    = 11; // R[dst] = R[src1] << R[src2]
    public static final int OP_SHR    = 12; // R[dst] = R[src1] >> R[src2]
    public static final int OP_USHR   = 13; // R[dst] = R[src1] >>> R[src2]
    public static final int OP_EQ     = 14; 
    public static final int OP_NE     = 15; // R[dst] = !Objects.equals(R[src1], R[src2])
    public static final int OP_LT     = 16; // R[dst] = compare(R[src1], R[src2]) < 0
    public static final int OP_LE     = 17; // R[dst] = compare(R[src1], R[src2]) <= 0
    public static final int OP_GT     = 18; // R[dst] = compare(R[src1], R[src2]) > 0
    public static final int OP_GE     = 19; // R[dst] = compare(R[src1], R[src2]) >= 0
    public static final int OP_JMP    = 20; // pc += (short)offset
    public static final int OP_JIF    = 21; // if (truthy(R[dst])) pc += (short)offset
    public static final int OP_JIFNOT = 22; // if (!truthy(R[dst])) pc += (short)offset
    public static final int OP_RETURN = 23; // return R[src1]

    public static int pack(int op, int dst, int s1, int s2) {
        return ((op & 0xff) << 24) | ((dst & 0xff) << 16) | ((s1 & 0xff) << 8) | (s2 & 0xff);
    }

    public static int packJump(int op, int condReg, int offset) {
        return ((op & 0xff) << 24) | ((condReg & 0xff) << 16) | (offset & 0xffff);
    }

    public static boolean canVirtualize(MethodTree node) {
        if (node.getBody() == null) return false;
        String name = node.getName().toString();
        if (name.equals("<init>") || name.equals("<clinit>")) return false;
        BlockTree body = node.getBody();
        List<? extends StatementTree> stmts = body.getStatements();
        if (stmts.isEmpty()) return false;
        Set<String> knownLocals = new HashSet<>();
        for (VariableTree param : node.getParameters()) {
            knownLocals.add(param.getName().toString());
        }
        for (StatementTree st : stmts) {
            if (!canVirtualizeStmt(st, knownLocals)) return false;
        }
        return true;
    }

    private static boolean canVirtualizeStmt(StatementTree st, Set<String> knownLocals) {
        if (st instanceof ReturnTree) {
            ReturnTree rt = (ReturnTree) st;
            return rt.getExpression() == null || canVirtualizeExpr(rt.getExpression(), knownLocals);
        }
        if (st instanceof VariableTree) {
            VariableTree vt = (VariableTree) st;
            boolean ok = vt.getInitializer() == null || canVirtualizeExpr(vt.getInitializer(), knownLocals);
            if (ok) knownLocals.add(vt.getName().toString());
            return ok;
        }
        if (st instanceof ExpressionStatementTree) {
            ExpressionStatementTree est = (ExpressionStatementTree) st;
            ExpressionTree expr = est.getExpression();
            if (expr instanceof AssignmentTree) {
                AssignmentTree at = (AssignmentTree) expr;
                if (!(at.getVariable() instanceof IdentifierTree)) return false;
                String varName = ((IdentifierTree) at.getVariable()).getName().toString();
                return knownLocals.contains(varName) && canVirtualizeExpr(at.getExpression(), knownLocals);
            }
            return canVirtualizeExpr(expr, knownLocals);
        }
        if (st instanceof IfTree) {
            IfTree it = (IfTree) st;
            if (!canVirtualizeExpr(it.getCondition(), knownLocals)) return false;
            if (!canVirtualizeBranch(it.getThenStatement(), new HashSet<>(knownLocals))) return false;
            if (it.getElseStatement() != null && !canVirtualizeBranch(it.getElseStatement(), new HashSet<>(knownLocals))) return false;
            return true;
        }
        if (st instanceof WhileLoopTree) {
            WhileLoopTree wt = (WhileLoopTree) st;
            return canVirtualizeExpr(wt.getCondition(), knownLocals) && canVirtualizeBranch(wt.getStatement(), new HashSet<>(knownLocals));
        }
        if (st instanceof BlockTree) {
            BlockTree bt = (BlockTree) st;
            Set<String> blockLocals = new HashSet<>(knownLocals);
            for (StatementTree s : bt.getStatements()) {
                if (!canVirtualizeStmt(s, blockLocals)) return false;
            }
            return true;
        }
        return false;
    }

    private static boolean canVirtualizeBranch(StatementTree st, Set<String> knownLocals) {
        if (st instanceof BlockTree) {
            for (StatementTree s : ((BlockTree) st).getStatements()) {
                if (!canVirtualizeStmt(s, knownLocals)) return false;
            }
            return true;
        }
        return canVirtualizeStmt(st, knownLocals);
    }

    private static boolean canVirtualizeExpr(ExpressionTree expr, Set<String> knownLocals) {
        if (expr instanceof LiteralTree) return true;
        if (expr instanceof IdentifierTree) {
            return knownLocals.contains(((IdentifierTree) expr).getName().toString());
        }
        if (expr instanceof ParenthesizedTree) return canVirtualizeExpr(((ParenthesizedTree) expr).getExpression(), knownLocals);
        if (expr instanceof UnaryTree) {
            Tree.Kind kind = expr.getKind();
            if (kind == Tree.Kind.UNARY_MINUS || kind == Tree.Kind.UNARY_PLUS
                    || kind == Tree.Kind.LOGICAL_COMPLEMENT || kind == Tree.Kind.BITWISE_COMPLEMENT) {
                return canVirtualizeExpr(((UnaryTree) expr).getExpression(), knownLocals);
            }
            return false;
        }
        if (expr instanceof BinaryTree) {
            BinaryTree bt = (BinaryTree) expr;
            return canVirtualizeExpr(bt.getLeftOperand(), knownLocals) && canVirtualizeExpr(bt.getRightOperand(), knownLocals);
        }
        return false;
    }

    public static final class MethodBytecode {
        public final List<Integer> instructions = new ArrayList<>();
        public final List<Object> constants = new ArrayList<>();
        public final Map<javax.lang.model.element.Element, Integer> regMap = new IdentityHashMap<>();
        public final Map<String, Integer> nameMap = new HashMap<>();
        public final Trees trees;
        public final TreePath methodPath;
        public final SymbolRenamingRegistry symbols;
        public final VMRegistry vmRegistry;
        public int nextReg = 0;

        public MethodBytecode(Trees trees, TreePath methodPath, SymbolRenamingRegistry symbols, VMRegistry vmRegistry) {
            this.trees = trees;
            this.methodPath = methodPath;
            this.symbols = symbols;
            this.vmRegistry = vmRegistry;
        }

        public MethodBytecode(Trees trees, TreePath methodPath, SymbolRenamingRegistry symbols) {
            this(trees, methodPath, symbols, null);
        }

        public int addConstant(Object val) {
            for (int i = 0; i < constants.size(); i++) {
                if (Objects.equals(constants.get(i), val)) return i;
            }
            constants.add(val);
            return constants.size() - 1;
        }

        public void emit(int op, int dst, int s1, int s2) {
            instructions.add(pack(op, dst, s1, s2));
        }

        public void emitJump(int op, int condReg, int offset) {
            instructions.add(packJump(op, condReg, offset));
        }

        public void registerVar(javax.lang.model.element.Element sym, String name, int reg) {
            if (sym != null) regMap.put(sym, reg);
            if (name != null) nameMap.put(name, reg);
            if (vmRegistry != null) {
                String renamed = (symbols != null && sym != null) ? symbols.getOrOriginal(sym, name) : name;
                vmRegistry.registerVar(sym, name, renamed, reg, "Object");
            }
        }

        public Integer resolveReg(Tree expr) {
            if (trees != null && methodPath != null && expr != null) {
                javax.lang.model.element.Element sym = trees.getElement(new TreePath(methodPath, expr));
                if (sym != null && regMap.containsKey(sym)) {
                    return regMap.get(sym);
                }
            }
            if (expr instanceof IdentifierTree) {
                String name = ((IdentifierTree) expr).getName().toString();
                return nameMap.get(name);
            }
            return null;
        }
    }

    public static boolean virtualizeMethod(CompilationUnitTree unit, MethodTree node,
            TreePath methodPath, Trees trees, SourcePositions positions, List<Span> edits,
            SplittableRandom random, String vmMethodName, boolean rename,
            SymbolRenamingRegistry symbols, VMRegistry vmRegistry) {
        if (!canVirtualize(node)) return false;

        BlockTree body = node.getBody();
        int bodyStart = (int) positions.getStartPosition(unit, body);
        int bodyEnd = (int) positions.getEndPosition(unit, body);
        if (bodyStart < 0 || bodyEnd <= bodyStart) return false;

        MethodBytecode bc = new MethodBytecode(trees, methodPath, symbols, vmRegistry);
        List<String> paramNames = new ArrayList<>();
        for (VariableTree p : node.getParameters()) {
            javax.lang.model.element.Element pSym = (trees != null && methodPath != null) ? trees.getElement(new TreePath(methodPath, p)) : null;
            String pName = (rename && pSym != null && symbols != null) ? symbols.getOrOriginal(pSym) : p.getName().toString();
            paramNames.add(pName);
            int r = bc.nextReg++;
            bc.registerVar(pSym, p.getName().toString(), r);
        }

        for (StatementTree st : body.getStatements()) {
            compileStmt(st, bc);
        }

        if (bc.nextReg >= 256) return false;

        String retType = node.getReturnType() != null ? node.getReturnType().toString() : "void";

        // Ensure method terminates with return
        if (bc.instructions.isEmpty() || ((bc.instructions.get(bc.instructions.size() - 1) >>> 24) & 0xff) != OP_RETURN) {
            Object defaultVal = null;
            if (retType.equals("int") || retType.equals("byte") || retType.equals("short") || retType.equals("char")) {
                defaultVal = 0;
            } else if (retType.equals("long")) {
                defaultVal = 0L;
            } else if (retType.equals("float")) {
                defaultVal = 0.0f;
            } else if (retType.equals("double")) {
                defaultVal = 0.0d;
            } else if (retType.equals("boolean")) {
                defaultVal = false;
            }
            int kDefault = bc.addConstant(defaultVal);
            int rRet = bc.nextReg++;
            bc.emit(OP_LOADK, rRet, kDefault, 0);
            bc.emit(OP_RETURN, 0, rRet, 0);
        }

        StringBuilder codeArr = new StringBuilder("new int[]{");
        for (int i = 0; i < bc.instructions.size(); i++) {
            if (i > 0) codeArr.append(",");
            codeArr.append("0x").append(Integer.toHexString(bc.instructions.get(i)));
        }
        codeArr.append("}");

        StringBuilder constArr = new StringBuilder("new Object[]{");
        for (int i = 0; i < bc.constants.size(); i++) {
            if (i > 0) constArr.append(",");
            Object c = bc.constants.get(i);
            if (c == null) constArr.append("null");
            else if (c instanceof String) constArr.append(StringCrypto.encodedString((String) c));
            else if (c instanceof Long) constArr.append(c).append("L");
            else if (c instanceof Float) constArr.append(c).append("f");
            else if (c instanceof Double) constArr.append(c).append("d");
            else constArr.append(c);
        }
        constArr.append("}");

        StringBuilder argsArr = new StringBuilder("new Object[]{");
        for (int i = 0; i < paramNames.size(); i++) {
            if (i > 0) argsArr.append(",");
            argsArr.append(paramNames.get(i));
        }
        argsArr.append("}");

        StringBuilder replacement = new StringBuilder("{\n");
        replacement.append("Object _0xres=").append(vmMethodName).append("(")
                   .append(codeArr).append(",").append(constArr).append(",").append(argsArr).append(");\n");

        if (retType.equals("void")) {
            replacement.append("return;\n");
        } else if (retType.equals("int")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for int\");\n");
            replacement.append("return ((java.lang.Number)_0xres).intValue();\n");
        } else if (retType.equals("long")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for long\");\n");
            replacement.append("return ((java.lang.Number)_0xres).longValue();\n");
        } else if (retType.equals("float")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for float\");\n");
            replacement.append("return ((java.lang.Number)_0xres).floatValue();\n");
        } else if (retType.equals("double")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for double\");\n");
            replacement.append("return ((java.lang.Number)_0xres).doubleValue();\n");
        } else if (retType.equals("boolean")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for boolean\");\n");
            replacement.append("return ((java.lang.Boolean)_0xres).booleanValue();\n");
        } else if (retType.equals("byte")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for byte\");\n");
            replacement.append("return ((java.lang.Number)_0xres).byteValue();\n");
        } else if (retType.equals("short")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for short\");\n");
            replacement.append("return ((java.lang.Number)_0xres).shortValue();\n");
        } else if (retType.equals("char")) {
            replacement.append("if(_0xres==null)throw new java.lang.IllegalStateException(\"VM returned null for char\");\n");
            replacement.append("return (char)((java.lang.Number)_0xres).intValue();\n");
        } else {
            replacement.append("return (").append(retType).append(")_0xres;\n");
        }
        replacement.append("}");

        edits.add(new Span(bodyStart, bodyEnd, replacement.toString(), "edit"));
        return true;
    }

    public static boolean virtualizeMethod(CompilationUnitTree unit, MethodTree node,
            TreePath methodPath, Trees trees, SourcePositions positions, List<Span> edits,
            SplittableRandom random, String vmMethodName, boolean rename,
            SymbolRenamingRegistry symbols) {
        return virtualizeMethod(unit, node, methodPath, trees, positions, edits, random, vmMethodName, rename, symbols, null);
    }

    public static boolean virtualizeMethod(CompilationUnitTree unit, MethodTree node,
            TreePath methodPath, Trees trees, SourcePositions positions, List<Span> edits,
            SplittableRandom random, String vmMethodName, java.util.function.Function<javax.lang.model.element.Element, String> nameProvider) {
        SymbolRenamingRegistry reg = new SymbolRenamingRegistry(null);
        if (nameProvider != null && node != null) {
            for (VariableTree p : node.getParameters()) {
                javax.lang.model.element.Element pSym = (trees != null && methodPath != null) ? trees.getElement(new TreePath(methodPath, p)) : null;
                if (pSym != null) reg.register(pSym, nameProvider.apply(pSym));
            }
        }
        return virtualizeMethod(unit, node, methodPath, trees, positions, edits, random, vmMethodName, nameProvider != null, reg, null);
    }

    private static void compileStmt(StatementTree st, MethodBytecode bc) {
        if (st instanceof BlockTree) {
            for (StatementTree s : ((BlockTree) st).getStatements()) {
                compileStmt(s, bc);
            }
            return;
        }
        if (st instanceof VariableTree) {
            VariableTree vt = (VariableTree) st;
            javax.lang.model.element.Element vSym = (bc.trees != null && bc.methodPath != null)
                    ? bc.trees.getElement(new TreePath(bc.methodPath, vt)) : null;
            int r = bc.nextReg++;
            bc.registerVar(vSym, vt.getName().toString(), r);
            if (vt.getInitializer() != null) {
                compileExpr(vt.getInitializer(), r, bc);
            }
            return;
        }
        if (st instanceof ExpressionStatementTree) {
            ExpressionTree expr = ((ExpressionStatementTree) st).getExpression();
            if (expr instanceof AssignmentTree) {
                AssignmentTree at = (AssignmentTree) expr;
                if (!(at.getVariable() instanceof IdentifierTree)) {
                    throw new IllegalStateException("Only simple variable assignments are supported in VM: " + at.getVariable());
                }
                Integer r = bc.resolveReg(at.getVariable());
                if (r == null) {
                    throw new IllegalStateException("Unknown assignment target during VM compilation: " + at.getVariable());
                }
                compileExpr(at.getExpression(), r, bc);
                return;
            }
            int tmp = bc.nextReg++;
            compileExpr(expr, tmp, bc);
            return;
        }
        if (st instanceof ReturnTree) {
            ReturnTree rt = (ReturnTree) st;
            int rRet = bc.nextReg++;
            if (rt.getExpression() != null) {
                compileExpr(rt.getExpression(), rRet, bc);
            } else {
                int kNull = bc.addConstant(null);
                bc.emit(OP_LOADK, rRet, kNull, 0);
            }
            bc.emit(OP_RETURN, 0, rRet, 0);
            return;
        }
        if (st instanceof IfTree) {
            IfTree it = (IfTree) st;
            int condReg = bc.nextReg++;
            compileExpr(it.getCondition(), condReg, bc);
            int jmpIfFalseIdx = bc.instructions.size();
            bc.emitJump(OP_JIFNOT, condReg, 0);

            compileStmt(it.getThenStatement(), bc);
            int jmpEndIdx = -1;
            if (it.getElseStatement() != null) {
                jmpEndIdx = bc.instructions.size();
                bc.emitJump(OP_JMP, 0, 0);
            }

            int elseTarget = bc.instructions.size();
            int diffFalse = elseTarget - (jmpIfFalseIdx + 1);
            int origFalseInst = bc.instructions.get(jmpIfFalseIdx);
            bc.instructions.set(jmpIfFalseIdx, (origFalseInst & 0xffff0000) | (diffFalse & 0xffff));

            if (it.getElseStatement() != null && jmpEndIdx >= 0) {
                compileStmt(it.getElseStatement(), bc);
                int endTarget = bc.instructions.size();
                int diffEnd = endTarget - (jmpEndIdx + 1);
                int origEndInst = bc.instructions.get(jmpEndIdx);
                bc.instructions.set(jmpEndIdx, (origEndInst & 0xffff0000) | (diffEnd & 0xffff));
            }
            return;
        }
        if (st instanceof WhileLoopTree) {
            WhileLoopTree wt = (WhileLoopTree) st;
            int loopStart = bc.instructions.size();
            int condReg = bc.nextReg++;
            compileExpr(wt.getCondition(), condReg, bc);
            int jmpExitIdx = bc.instructions.size();
            bc.emitJump(OP_JIFNOT, condReg, 0);

            compileStmt(wt.getStatement(), bc);
            int diffBack = loopStart - (bc.instructions.size() + 1);
            bc.emitJump(OP_JMP, 0, diffBack);

            int exitTarget = bc.instructions.size();
            int diffExit = exitTarget - (jmpExitIdx + 1);
            int origExitInst = bc.instructions.get(jmpExitIdx);
            bc.instructions.set(jmpExitIdx, (origExitInst & 0xffff0000) | (diffExit & 0xffff));
            return;
        }
    }

    private static void compileExpr(ExpressionTree expr, int dst, MethodBytecode bc) {
        if (expr instanceof ParenthesizedTree) {
            compileExpr(((ParenthesizedTree) expr).getExpression(), dst, bc);
            return;
        }
        if (expr instanceof LiteralTree) {
            Object val = ((LiteralTree) expr).getValue();
            int k = bc.addConstant(val);
            bc.emit(OP_LOADK, dst, k, 0);
            return;
        }
        if (expr instanceof IdentifierTree) {
            Integer r = bc.resolveReg(expr);
            if (r != null) {
                bc.emit(OP_MOVE, dst, r, 0);
            } else {
                throw new IllegalStateException("Unknown identifier during VM compilation: " + expr);
            }
            return;
        }
        if (expr instanceof UnaryTree) {
            UnaryTree ut = (UnaryTree) expr;
            int r1 = bc.nextReg++;
            compileExpr(ut.getExpression(), r1, bc);
            Tree.Kind kind = ut.getKind();
            if (kind == Tree.Kind.UNARY_MINUS) {
                int r0 = bc.nextReg++;
                int k0 = bc.addConstant(0);
                bc.emit(OP_LOADK, r0, k0, 0);
                bc.emit(OP_SUB, dst, r0, r1);
            } else if (kind == Tree.Kind.LOGICAL_COMPLEMENT) {
                int rFalse = bc.nextReg++;
                int kFalse = bc.addConstant(false);
                bc.emit(OP_LOADK, rFalse, kFalse, 0);
                bc.emit(OP_EQ, dst, r1, rFalse);
            } else if (kind == Tree.Kind.BITWISE_COMPLEMENT) {
                int rNeg = bc.nextReg++;
                int kNeg = bc.addConstant(-1);
                bc.emit(OP_LOADK, rNeg, kNeg, 0);
                bc.emit(OP_BXOR, dst, r1, rNeg);
            } else {
                bc.emit(OP_MOVE, dst, r1, 0);
            }
            return;
        }
        if (expr instanceof BinaryTree) {
            BinaryTree bt = (BinaryTree) expr;
            int r1 = bc.nextReg++;
            int r2 = bc.nextReg++;
            compileExpr(bt.getLeftOperand(), r1, bc);
            compileExpr(bt.getRightOperand(), r2, bc);
            Tree.Kind kind = bt.getKind();
            int op = OP_ADD;
            if (kind == Tree.Kind.PLUS) op = OP_ADD;
            else if (kind == Tree.Kind.MINUS) op = OP_SUB;
            else if (kind == Tree.Kind.MULTIPLY) op = OP_MUL;
            else if (kind == Tree.Kind.DIVIDE) op = OP_DIV;
            else if (kind == Tree.Kind.REMAINDER) op = OP_MOD;
            else if (kind == Tree.Kind.AND) op = OP_BAND;
            else if (kind == Tree.Kind.OR) op = OP_BOR;
            else if (kind == Tree.Kind.XOR) op = OP_BXOR;
            else if (kind == Tree.Kind.LEFT_SHIFT) op = OP_SHL;
            else if (kind == Tree.Kind.RIGHT_SHIFT) op = OP_SHR;
            else if (kind == Tree.Kind.UNSIGNED_RIGHT_SHIFT) op = OP_USHR;
            else if (kind == Tree.Kind.EQUAL_TO) op = OP_EQ;
            else if (kind == Tree.Kind.NOT_EQUAL_TO) op = OP_NE;
            else if (kind == Tree.Kind.LESS_THAN) op = OP_LT;
            else if (kind == Tree.Kind.LESS_THAN_EQUAL) op = OP_LE;
            else if (kind == Tree.Kind.GREATER_THAN) op = OP_GT;
            else if (kind == Tree.Kind.GREATER_THAN_EQUAL) op = OP_GE;
            bc.emit(op, dst, r1, r2);
            return;
        }
    }

    public static String generateRuntimeInterpreter(String vmMethodName) {
        StringBuilder sb = new StringBuilder();
        sb.append("public static Object ").append(vmMethodName).append("(int[] _0xc,Object[] _0xk,Object[] _0xa){\n");
        sb.append("Object[] _0xr=new Object[256];\n");
        sb.append("if(_0xa!=null){for(int _0xi=0;_0xi<_0xa.length&&_0xi<256;_0xi++)_0xr[_0xi]=_0xa[_0xi];}\n");
        sb.append("int _0xpc=0;\n");
        sb.append("while(_0xpc<_0xc.length){\n");
        sb.append("int _0xi=_0xc[_0xpc++];\n");
        sb.append("int _0xop=(_0xi>>>24)&0xff;\n");
        sb.append("int _0xd=(_0xi>>>16)&0xff;\n");
        sb.append("int _0xs1=(_0xi>>>8)&0xff;\n");
        sb.append("int _0xs2=_0xi&0xff;\n");
        sb.append("short _0xoff=(short)(_0xi&0xffff);\n");
        sb.append("switch(_0xop){\n");
        sb.append("case 1:_0xr[_0xd]=_0xk[_0xs1];break;\n");
        sb.append("case 2:_0xr[_0xd]=_0xr[_0xs1];break;\n");
        sb.append("case 3:_0xr[_0xd]=_0xadd(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 4:_0xr[_0xd]=_0xsub(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 5:_0xr[_0xd]=_0xmul(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 6:_0xr[_0xd]=_0xdiv(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 7:_0xr[_0xd]=_0xmod(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 8:_0xr[_0xd]=((Number)_0xr[_0xs1]).longValue()&((Number)_0xr[_0xs2]).longValue();break;\n");
        sb.append("case 9:_0xr[_0xd]=((Number)_0xr[_0xs1]).longValue()|((Number)_0xr[_0xs2]).longValue();break;\n");
        sb.append("case 10:_0xr[_0xd]=((Number)_0xr[_0xs1]).longValue()^((Number)_0xr[_0xs2]).longValue();break;\n");
        sb.append("case 11:_0xr[_0xd]=((Number)_0xr[_0xs1]).longValue()<<((Number)_0xr[_0xs2]).intValue();break;\n");
        sb.append("case 12:_0xr[_0xd]=((Number)_0xr[_0xs1]).longValue()>>((Number)_0xr[_0xs2]).intValue();break;\n");
        sb.append("case 13:_0xr[_0xd]=((Number)_0xr[_0xs1]).longValue()>>>((Number)_0xr[_0xs2]).intValue();break;\n");
        sb.append("case 14:_0xr[_0xd]=java.util.Objects.equals(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 15:_0xr[_0xd]=!java.util.Objects.equals(_0xr[_0xs1],_0xr[_0xs2]);break;\n");
        sb.append("case 16:_0xr[_0xd]=_0xcmp(_0xr[_0xs1],_0xr[_0xs2])<0;break;\n");
        sb.append("case 17:_0xr[_0xd]=_0xcmp(_0xr[_0xs1],_0xr[_0xs2])<=0;break;\n");
        sb.append("case 18:_0xr[_0xd]=_0xcmp(_0xr[_0xs1],_0xr[_0xs2])>0;break;\n");
        sb.append("case 19:_0xr[_0xd]=_0xcmp(_0xr[_0xs1],_0xr[_0xs2])>=0;break;\n");
        sb.append("case 20:_0xpc+=_0xoff;break;\n");
        sb.append("case 21:if(_0xtrue(_0xr[_0xd]))_0xpc+=_0xoff;break;\n");
        sb.append("case 22:if(!_0xtrue(_0xr[_0xd]))_0xpc+=_0xoff;break;\n");
        sb.append("case 23:return _0xr[_0xs1];\n");
        sb.append("default:throw new java.lang.IllegalStateException(\"Invalid opcode: \"+_0xop);\n");
        sb.append("}\n}\nreturn null;\n}\n");

        sb.append("private static Object _0xadd(Object a,Object b){\n");
        sb.append("if(a instanceof String||b instanceof String)return String.valueOf(a)+String.valueOf(b);\n");
        sb.append("if(a instanceof Double||b instanceof Double)return ((Number)a).doubleValue()+((Number)b).doubleValue();\n");
        sb.append("if(a instanceof Float||b instanceof Float)return ((Number)a).floatValue()+((Number)b).floatValue();\n");
        sb.append("if(a instanceof Long||b instanceof Long)return ((Number)a).longValue()+((Number)b).longValue();\n");
        sb.append("return ((Number)a).intValue()+((Number)b).intValue();\n}\n");

        sb.append("private static Object _0xsub(Object a,Object b){\n");
        sb.append("if(a instanceof Double||b instanceof Double)return ((Number)a).doubleValue()-((Number)b).doubleValue();\n");
        sb.append("if(a instanceof Float||b instanceof Float)return ((Number)a).floatValue()-((Number)b).floatValue();\n");
        sb.append("if(a instanceof Long||b instanceof Long)return ((Number)a).longValue()-((Number)b).longValue();\n");
        sb.append("return ((Number)a).intValue()-((Number)b).intValue();\n}\n");

        sb.append("private static Object _0xmul(Object a,Object b){\n");
        sb.append("if(a instanceof Double||b instanceof Double)return ((Number)a).doubleValue()*((Number)b).doubleValue();\n");
        sb.append("if(a instanceof Float||b instanceof Float)return ((Number)a).floatValue()*((Number)b).floatValue();\n");
        sb.append("if(a instanceof Long||b instanceof Long)return ((Number)a).longValue()*((Number)b).longValue();\n");
        sb.append("return ((Number)a).intValue()*((Number)b).intValue();\n}\n");

        sb.append("private static Object _0xdiv(Object a,Object b){\n");
        sb.append("if(a instanceof Double||b instanceof Double)return ((Number)a).doubleValue()/((Number)b).doubleValue();\n");
        sb.append("if(a instanceof Float||b instanceof Float)return ((Number)a).floatValue()/((Number)b).floatValue();\n");
        sb.append("if(a instanceof Long||b instanceof Long)return ((Number)a).longValue()/((Number)b).longValue();\n");
        sb.append("return ((Number)a).intValue()/((Number)b).intValue();\n}\n");

        sb.append("private static Object _0xmod(Object a,Object b){\n");
        sb.append("if(a instanceof Long||b instanceof Long)return ((Number)a).longValue()%((Number)b).longValue();\n");
        sb.append("return ((Number)a).intValue()%((Number)b).intValue();\n}\n");

        sb.append("private static int _0xcmp(Object a,Object b){\n");
        sb.append("if(a instanceof Number&&b instanceof Number){\n");
        sb.append("double d=((Number)a).doubleValue()-((Number)b).doubleValue();\n");
        sb.append("return d<0?-1:(d>0?1:0);\n}\n");
        sb.append("if(a instanceof Comparable&&b!=null){\n");
        sb.append("try{return ((Comparable)a).compareTo(b);}catch(Throwable ignored){}\n}\n");
        sb.append("return 0;\n}\n");

        sb.append("private static boolean _0xtrue(Object o){\n");
        sb.append("if(o==null)return false;\n");
        sb.append("if(o instanceof Boolean)return (Boolean)o;\n");
        sb.append("if(o instanceof Number)return ((Number)o).longValue()!=0;\n");
        sb.append("return true;\n}\n");

        return sb.toString();
    }
}
