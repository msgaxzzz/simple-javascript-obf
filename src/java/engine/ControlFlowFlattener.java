package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.TreePath;
import com.sun.source.util.TreePathScanner;
import com.sun.source.util.Trees;
import javax.lang.model.element.Element;
import java.util.*;
import java.util.function.Function;

public final class ControlFlowFlattener {
    static class BasicBlock {
        final int id;
        final List<String> stmts = new ArrayList<>();
        Terminator terminator;

        BasicBlock(int id) {
            this.id = id;
        }
    }

    interface Terminator {}

    static class GotoTerminator implements Terminator {
        final BasicBlock target;
        GotoTerminator(BasicBlock target) { this.target = target; }
    }

    static class BranchTerminator implements Terminator {
        final String condition;
        final BasicBlock thenBlock;
        final BasicBlock elseBlock;
        BranchTerminator(String condition, BasicBlock thenBlock, BasicBlock elseBlock) {
            this.condition = condition;
            this.thenBlock = thenBlock;
            this.elseBlock = elseBlock;
        }
    }

    static class ReturnTerminator implements Terminator {
        final String returnStmt;
        ReturnTerminator(String returnStmt) { this.returnStmt = returnStmt; }
    }

    static class ThrowTerminator implements Terminator {
        final String throwStmt;
        ThrowTerminator(String throwStmt) { this.throwStmt = throwStmt; }
    }

    static class CfgContext {
        final SplittableRandom random;
        final Set<Integer> usedStates = new HashSet<>();
        final List<BasicBlock> allBlocks = new ArrayList<>();
        final Map<String, String> renames;
        final Map<Integer, String> astRefRenames;
        final CompilationUnitTree unit;
        final SourcePositions positions;
        final String source;
        final List<Span> tokens;
        final boolean numbers;
        final boolean strings;
        final SymbolRenamingRegistry symbols;

        CfgContext(SplittableRandom random, Map<String, String> renames, Map<Integer, String> astRefRenames,
                   CompilationUnitTree unit, SourcePositions positions, String source, List<Span> tokens,
                   boolean numbers, boolean strings, SymbolRenamingRegistry symbols) {
            this.random = random;
            this.renames = renames;
            this.astRefRenames = astRefRenames;
            this.unit = unit;
            this.positions = positions;
            this.source = source;
            this.tokens = tokens;
            this.numbers = numbers;
            this.strings = strings;
            this.symbols = symbols;
            this.usedStates.add(0); // 0 reserved for termination
        }

        int nextState() {
            int v;
            do {
                v = random.nextInt(0x1000, 0xffff);
            } while (!usedStates.add(v));
            return v;
        }

        BasicBlock newBlock() {
            BasicBlock bb = new BasicBlock(nextState());
            allBlocks.add(bb);
            return bb;
        }

        String render(Tree node) {
            int start = (int) positions.getStartPosition(unit, node);
            int end = (int) positions.getEndPosition(unit, node);
            if (start < 0 || end <= start) return "";
            return renderRange(start, end);
        }

        String renderRange(int start, int end) {
            StringBuilder sb = new StringBuilder();
            int cur = Lexer.tokenStart(tokens, start);
            int lastPos = start;
            for (int i = cur; i < tokens.size(); i++) {
                Span t = tokens.get(i);
                if (t.start >= end) break;
                if (t.start < start) continue;
                if (t.start > lastPos) {
                    sb.append(source.substring(lastPos, t.start));
                }
                if (t.kind.equals("identifier")) {
                    boolean isMemberSelect = false;
                    for (int prev = i - 1; prev >= 0; prev--) {
                        Span pt = tokens.get(prev);
                        if (pt.kind.equals("space") || pt.kind.equals("comment")) continue;
                        if (pt.text.equals(".")) isMemberSelect = true;
                        break;
                    }
                    if (astRefRenames != null && astRefRenames.containsKey(t.start)) {
                        sb.append(astRefRenames.get(t.start));
                    } else if (!isMemberSelect && renames != null && renames.containsKey(t.text)) {
                        sb.append(renames.get(t.text));
                    } else {
                        sb.append(t.text);
                    }
                } else if (numbers && t.kind.equals("number") && t.text.matches("\\d+") && t.text.length() < 10) {
                    try {
                        int val = Integer.parseInt(t.text);
                        sb.append(NumberObfuscator.obfuscateInt(val, random));
                    } catch (Throwable ignored) {
                        sb.append(t.text);
                    }
                } else if (strings && t.kind.equals("literal") && t.text.startsWith("\"") && t.text.endsWith("\"") && t.text.length() >= 2 && !t.text.startsWith("\"\"\"")) {
                    sb.append(StringCrypto.encodedString(t.text.substring(1, t.text.length() - 1)));
                } else {
                    sb.append(t.text);
                }
                lastPos = t.end;
            }
            if (lastPos < end) {
                sb.append(source.substring(lastPos, end));
            }
            return sb.toString();
        }
    }

    static class HoistedVar {
        final String type;
        final String name;
        HoistedVar(String type, String name) {
            this.type = type;
            this.name = name;
        }
    }

    public static boolean canFlatten(MethodTree node) {
        if (node.getBody() == null) return false;
        String name = node.getName().toString();
        if (name.equals("<init>") || name.equals("<clinit>")) return false;
        BlockTree body = node.getBody();
        List<? extends StatementTree> stmts = body.getStatements();
        if (stmts.size() < 2) return false;

        boolean[] unsupported = new boolean[1];
        new com.sun.source.util.TreeScanner<Void, Void>() {
            @Override public Void visitTry(TryTree t, Void v) { unsupported[0] = true; return super.visitTry(t, v); }
            @Override public Void visitSynchronized(SynchronizedTree t, Void v) { unsupported[0] = true; return super.visitSynchronized(t, v); }
            @Override public Void visitSwitch(SwitchTree t, Void v) { unsupported[0] = true; return super.visitSwitch(t, v); }
            @Override public Void visitLambdaExpression(LambdaExpressionTree t, Void v) { unsupported[0] = true; return super.visitLambdaExpression(t, v); }
            @Override public Void visitNewClass(NewClassTree t, Void v) {
                if (t.getClassBody() != null) unsupported[0] = true;
                return super.visitNewClass(t, v);
            }
            @Override public Void visitBreak(BreakTree t, Void v) {
                if (t.getLabel() != null) unsupported[0] = true;
                return super.visitBreak(t, v);
            }
            @Override public Void visitContinue(ContinueTree t, Void v) {
                if (t.getLabel() != null) unsupported[0] = true;
                return super.visitContinue(t, v);
            }
        }.scan(body, null);

        return !unsupported[0];
    }

    public static boolean flattenMethod(CompilationUnitTree unit, MethodTree node, TreePath methodPath,
            Trees trees, String source, SourcePositions positions, List<Span> edits, SplittableRandom random,
            List<Span> tokens, boolean rename, boolean renameMembers, boolean escapedSyntax,
            boolean numbers, boolean strings, SymbolRenamingRegistry symbols,
            GeneratedSymbolRegistry generatedSymbols, Set<String> occupied, String idStyle) {
        if (!canFlatten(node)) {
            injectOpaqueTrap(unit, node, source, positions, edits, random, generatedSymbols, occupied, idStyle);
            return false;
        }

        BlockTree body = node.getBody();
        int bodyStart = (int) positions.getStartPosition(unit, body);
        int bodyEnd = (int) positions.getEndPosition(unit, body);
        if (bodyStart < 0 || bodyEnd <= bodyStart || source.charAt(bodyStart) != '{') return false;

        Map<String, String> renames = new HashMap<>();

        // Map parameter renames from symbols registry
        for (VariableTree p : node.getParameters()) {
            String pName = p.getName().toString();
            Element pSym = (trees != null && methodPath != null) ? trees.getElement(new TreePath(methodPath, p)) : null;
            if (pSym != null && symbols != null && rename) {
                String ren = symbols.get(pSym);
                if (ren != null) renames.put(pName, ren);
            }
        }

        // Collect and hoist all local variables across all scopes in this method
        List<HoistedVar> hoistedVars = new ArrayList<>();
        Set<String> hoistedNames = new HashSet<>();
        for (StatementTree st : body.getStatements()) {
            collectVariables(st, node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
        }

        // Collect AST reference renames for fields, methods, and classes within method body
        Map<Integer, String> astRefRenames = new HashMap<>();
        if (symbols != null && trees != null && methodPath != null) {
            new TreePathScanner<Void, Void>() {
                @Override public Void visitIdentifier(IdentifierTree id, Void v) {
                    Element el = trees.getElement(getCurrentPath());
                    if (el != null && symbols.contains(el)) {
                        int s = (int) positions.getStartPosition(unit, id);
                        if (s >= 0) astRefRenames.put(s, symbols.get(el));
                    }
                    return super.visitIdentifier(id, v);
                }
                @Override public Void visitVariable(VariableTree vt, Void v) {
                    Element el = trees.getElement(getCurrentPath());
                    if (el != null && symbols.contains(el)) {
                        String varName = vt.getName().toString();
                        int s = (int) positions.getStartPosition(unit, vt);
                        int e = (int) positions.getEndPosition(unit, vt);
                        int cur = Lexer.tokenStart(tokens, s);
                        for (int i = cur; i < tokens.size(); i++) {
                            Span t = tokens.get(i);
                            if (e > s && t.start >= e) break;
                            if (t.kind.equals("identifier") && t.text.equals(varName)) {
                                astRefRenames.put(t.start, symbols.get(el));
                                break;
                            }
                        }
                    }
                    return super.visitVariable(vt, v);
                }
                @Override public Void visitMemberSelect(MemberSelectTree mst, Void v) {
                    Element el = trees.getElement(getCurrentPath());
                    if (el != null && symbols.contains(el)) {
                        int s = (int) positions.getStartPosition(unit, mst);
                        int e = (int) positions.getEndPosition(unit, mst);
                        String idName = mst.getIdentifier().toString();
                        int cur = Lexer.tokenStart(tokens, s);
                        for (int i = cur; i < tokens.size(); i++) {
                            Span t = tokens.get(i);
                            if (t.start >= e) break;
                            if (t.kind.equals("identifier") && t.text.equals(idName)) {
                                astRefRenames.put(t.start, symbols.get(el));
                                break;
                            }
                        }
                    }
                    return super.visitMemberSelect(mst, v);
                }
            }.scan(new TreePath(methodPath, body), null);
        }

        CfgContext ctx = new CfgContext(random, renames, astRefRenames, unit, positions, source, tokens, numbers, strings, symbols);
        BasicBlock entryBlock = ctx.newBlock();

        BasicBlock exitBlock = buildCfg(body.getStatements(), entryBlock, null, ctx);
        if (exitBlock != null && exitBlock.terminator == null) {
            // Fell through to end
            exitBlock.terminator = new GotoTerminator(new BasicBlock(0));
        }

        String id = Integer.toHexString(random.nextInt(0x1000, 0xffff));
        String stVar = (generatedSymbols != null && occupied != null)
                ? generatedSymbols.create("cff.state." + id, () -> IdentifierGenerator.nextName(random, occupied, idStyle))
                : "_0xst" + id;

        List<String> caseBlocks = new ArrayList<>();
        for (BasicBlock bb : ctx.allBlocks) {
            StringBuilder cs = new StringBuilder();
            cs.append("case 0x").append(Integer.toHexString(bb.id)).append(":{\n");
            for (String s : bb.stmts) {
                cs.append(s).append("\n");
            }
            if (bb.terminator instanceof GotoTerminator) {
                BasicBlock tgt = ((GotoTerminator) bb.terminator).target;
                if (tgt.id == 0) {
                    cs.append(stVar).append("=0;break;\n");
                } else {
                    cs.append(stVar).append("=0x").append(Integer.toHexString(tgt.id)).append(";break;\n");
                }
            } else if (bb.terminator instanceof BranchTerminator) {
                BranchTerminator bt = (BranchTerminator) bb.terminator;
                cs.append(stVar).append("=(").append(bt.condition).append(")?0x")
                  .append(Integer.toHexString(bt.thenBlock.id)).append(":0x")
                  .append(Integer.toHexString(bt.elseBlock.id)).append(";break;\n");
            } else if (bb.terminator instanceof ReturnTerminator) {
                cs.append(((ReturnTerminator) bb.terminator).returnStmt).append("\n");
            } else if (bb.terminator instanceof ThrowTerminator) {
                cs.append(((ThrowTerminator) bb.terminator).throwStmt).append("\n");
            } else {
                cs.append(stVar).append("=0;break;\n");
            }
            cs.append("}");
            caseBlocks.add(cs.toString());
        }

        // Add 2 to 3 decoy blocks with mathematical invariant polynomial opaque predicates
        int numDecoys = random.nextInt(2, 4);
        for (int i = 0; i < numDecoys; i++) {
            int decoyId = ctx.nextState();
            int jumpTarget = ctx.nextState();
            StringBuilder ds = new StringBuilder();
            ds.append("case 0x").append(Integer.toHexString(decoyId)).append(":{\n");
            // Mathematical polynomial invariant: n*(n+1) is ALWAYS even in Z, so & 1 is NEVER != 0
            ds.append("if(((").append(stVar).append("*").append(stVar).append("+").append(stVar)
              .append(")&1)!=0||java.lang.System.nanoTime()==-99999999999999999L)throw new java.lang.InternalError();\n");
            ds.append(stVar).append("=0x").append(Integer.toHexString(jumpTarget)).append(";break;\n");
            ds.append("}");
            caseBlocks.add(ds.toString());
        }

        // SHUFFLE all case blocks randomly so case order != CFG order != source order
        Collections.shuffle(caseBlocks, new Random(random.nextLong()));

        StringBuilder replacement = new StringBuilder("{\n");
        for (HoistedVar hv : hoistedVars) {
            replacement.append(hv.type).append(" ").append(hv.name).append("=").append(defaultValue(hv.type)).append(";\n");
        }
        replacement.append("int ").append(stVar).append("=0x").append(Integer.toHexString(entryBlock.id)).append(";\n");
        replacement.append("while(").append(stVar).append("!=0){\n");
        replacement.append("switch(").append(stVar).append("){\n");
        for (String c : caseBlocks) {
            replacement.append(c).append("\n");
        }
        replacement.append("default:throw new java.lang.IllegalStateException();\n");
        replacement.append("}\n}\n");

        if (node.getReturnType() != null && !node.getReturnType().toString().equals("void")) {
            replacement.append("throw new java.lang.IllegalStateException();\n");
        }
        replacement.append("}");

        edits.add(new Span(bodyStart, bodyEnd, replacement.toString(), "edit"));
        return true;
    }

    public static boolean flattenMethod(CompilationUnitTree unit, MethodTree node, TreePath methodPath,
            Trees trees, String source, SourcePositions positions, List<Span> edits, SplittableRandom random,
            List<Span> tokens, boolean rename, boolean renameMembers, boolean escapedSyntax,
            java.util.function.Function<Element, String> nameProvider) {
        SymbolRenamingRegistry reg = new SymbolRenamingRegistry(null);
        if (nameProvider != null && node != null) {
            for (VariableTree p : node.getParameters()) {
                Element pSym = (trees != null && methodPath != null) ? trees.getElement(new TreePath(methodPath, p)) : null;
                if (pSym != null) reg.register(pSym, nameProvider.apply(pSym));
            }
        }
        return flattenMethod(unit, node, methodPath, trees, source, positions, edits, random, tokens,
                rename, renameMembers, escapedSyntax, false, false, reg);
    }

    private static void collectVariables(StatementTree st, MethodTree node, TreePath methodPath,
            Trees trees, boolean rename, SymbolRenamingRegistry symbols,
            Map<String, String> renames, List<HoistedVar> hoistedVars, Set<String> hoistedNames) {
        if (st instanceof VariableTree) {
            VariableTree vt = (VariableTree) st;
            String originalName = vt.getName().toString();
            Element varSymbol = (trees != null && methodPath != null) ? trees.getElement(new TreePath(methodPath, vt)) : null;
            String varName = (rename && varSymbol != null && symbols != null)
                    ? symbols.getOrOriginal(varSymbol, originalName)
                    : originalName;
            renames.put(originalName, varName);

            if (hoistedNames.add(varName)) {
                String typeStr = null;
                if (trees != null && methodPath != null && vt.getType() != null) {
                    try {
                        Element typeEl = trees.getElement(new TreePath(new TreePath(methodPath, vt), vt.getType()));
                        if (typeEl != null && symbols != null && symbols.contains(typeEl)) {
                            typeStr = symbols.get(typeEl);
                        }
                    } catch (Throwable ignored) {}
                }
                if (typeStr == null) {
                    typeStr = vt.getType().toString();
                }
                if (symbols != null && typeStr != null) {
                    for (Map.Entry<Element, SymbolRenamingRegistry.Entry> e : symbols.snapshot().entrySet()) {
                        if (typeStr.equals(e.getValue().getOriginalName())) {
                            typeStr = e.getValue().getRenamedName();
                            break;
                        }
                    }
                }
                if (typeStr.equals("var") && varSymbol != null) {
                    typeStr = varSymbol.asType().toString();
                }
                hoistedVars.add(new HoistedVar(typeStr, varName));
            }
        } else if (st instanceof BlockTree) {
            for (StatementTree s : ((BlockTree) st).getStatements()) {
                collectVariables(s, node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
            }
        } else if (st instanceof IfTree) {
            IfTree it = (IfTree) st;
            collectVariables(it.getThenStatement(), node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
            if (it.getElseStatement() != null) {
                collectVariables(it.getElseStatement(), node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
            }
        } else if (st instanceof WhileLoopTree) {
            collectVariables(((WhileLoopTree) st).getStatement(), node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
        } else if (st instanceof ForLoopTree) {
            ForLoopTree ft = (ForLoopTree) st;
            for (StatementTree init : ft.getInitializer()) {
                collectVariables(init, node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
            }
            collectVariables(ft.getStatement(), node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
        } else if (st instanceof EnhancedForLoopTree) {
            EnhancedForLoopTree efl = (EnhancedForLoopTree) st;
            VariableTree var = efl.getVariable();
            if (var != null) {
                Element varSymbol = (trees != null && methodPath != null) ? trees.getElement(new TreePath(new TreePath(methodPath, efl), var)) : null;
                if (varSymbol != null && symbols != null && rename) {
                    String ren = symbols.get(varSymbol);
                    if (ren != null) renames.put(var.getName().toString(), ren);
                }
            }
            collectVariables(efl.getStatement(), node, methodPath, trees, rename, symbols, renames, hoistedVars, hoistedNames);
        }
    }

    private static BasicBlock buildCfg(List<? extends StatementTree> stmts, BasicBlock current,
                                       BasicBlock exitTarget, CfgContext ctx) {
        for (StatementTree st : stmts) {
            if (current.terminator != null) {
                break;
            }

            if (st instanceof VariableTree) {
                VariableTree vt = (VariableTree) st;
                if (vt.getInitializer() != null) {
                    if (!current.stmts.isEmpty()) {
                        BasicBlock next = ctx.newBlock();
                        current.terminator = new GotoTerminator(next);
                        current = next;
                    }
                    String varName = ctx.renames.getOrDefault(vt.getName().toString(), vt.getName().toString());
                    String initStr = ctx.render(vt.getInitializer());
                    current.stmts.add(varName + " = " + initStr + ";");
                }
            } else if (st instanceof ExpressionStatementTree) {
                if (!current.stmts.isEmpty()) {
                    BasicBlock next = ctx.newBlock();
                    current.terminator = new GotoTerminator(next);
                    current = next;
                }
                current.stmts.add(ctx.render(st));
            } else if (st instanceof ReturnTree) {
                ReturnTree rt = (ReturnTree) st;
                String retExpr = (rt.getExpression() != null) ? "return " + ctx.render(rt.getExpression()) + ";" : "return;";
                current.terminator = new ReturnTerminator(retExpr);
                return current;
            } else if (st instanceof ThrowTree) {
                ThrowTree tt = (ThrowTree) st;
                current.terminator = new ThrowTerminator("throw " + ctx.render(tt.getExpression()) + ";");
                return current;
            } else if (st instanceof BlockTree) {
                current = buildCfg(((BlockTree) st).getStatements(), current, exitTarget, ctx);
            } else if (st instanceof IfTree) {
                IfTree it = (IfTree) st;
                String condStr = ctx.render(it.getCondition());

                BasicBlock thenHead = ctx.newBlock();
                BasicBlock elseHead = (it.getElseStatement() != null) ? ctx.newBlock() : null;
                BasicBlock joinBlock = ctx.newBlock();

                current.terminator = new BranchTerminator(condStr, thenHead, (elseHead != null ? elseHead : joinBlock));

                BasicBlock thenExit = buildBranchCfg(it.getThenStatement(), thenHead, joinBlock, ctx);
                if (thenExit != null && thenExit.terminator == null) {
                    thenExit.terminator = new GotoTerminator(joinBlock);
                }

                if (elseHead != null) {
                    BasicBlock elseExit = buildBranchCfg(it.getElseStatement(), elseHead, joinBlock, ctx);
                    if (elseExit != null && elseExit.terminator == null) {
                        elseExit.terminator = new GotoTerminator(joinBlock);
                    }
                }

                current = joinBlock;
            } else if (st instanceof WhileLoopTree) {
                WhileLoopTree wt = (WhileLoopTree) st;
                String condStr = ctx.render(wt.getCondition());

                BasicBlock loopHead = ctx.newBlock();
                BasicBlock loopBody = ctx.newBlock();
                BasicBlock loopExit = ctx.newBlock();

                current.terminator = new GotoTerminator(loopHead);
                loopHead.terminator = new BranchTerminator(condStr, loopBody, loopExit);

                BasicBlock bodyExit = buildBranchCfg(wt.getStatement(), loopBody, loopHead, ctx);
                if (bodyExit != null && bodyExit.terminator == null) {
                    bodyExit.terminator = new GotoTerminator(loopHead);
                }

                current = loopExit;
            } else if (st instanceof ForLoopTree) {
                ForLoopTree ft = (ForLoopTree) st;
                for (StatementTree init : ft.getInitializer()) {
                    if (init instanceof VariableTree) {
                        VariableTree vt = (VariableTree) init;
                        if (vt.getInitializer() != null) {
                            String varName = ctx.renames.getOrDefault(vt.getName().toString(), vt.getName().toString());
                            current.stmts.add(varName + " = " + ctx.render(vt.getInitializer()) + ";");
                        }
                    } else {
                        current.stmts.add(ctx.render(init));
                    }
                }

                BasicBlock loopHead = ctx.newBlock();
                BasicBlock loopBody = ctx.newBlock();
                BasicBlock loopUpdate = ctx.newBlock();
                BasicBlock loopExit = ctx.newBlock();

                current.terminator = new GotoTerminator(loopHead);

                String condStr = (ft.getCondition() != null) ? ctx.render(ft.getCondition()) : "true";
                loopHead.terminator = new BranchTerminator(condStr, loopBody, loopExit);

                BasicBlock bodyExit = buildBranchCfg(ft.getStatement(), loopBody, loopUpdate, ctx);
                if (bodyExit != null && bodyExit.terminator == null) {
                    bodyExit.terminator = new GotoTerminator(loopUpdate);
                }

                for (ExpressionStatementTree upd : ft.getUpdate()) {
                    String updStr = ctx.render(upd).trim();
                    if (!updStr.isEmpty()) {
                        if (!updStr.endsWith(";")) updStr += ";";
                        loopUpdate.stmts.add(updStr);
                    }
                }
                loopUpdate.terminator = new GotoTerminator(loopHead);

                current = loopExit;
            } else {
                current.stmts.add(ctx.render(st));
            }
        }

        if (current.terminator == null && exitTarget != null) {
            current.terminator = new GotoTerminator(exitTarget);
        }
        return current;
    }

    private static BasicBlock buildBranchCfg(StatementTree branch, BasicBlock head, BasicBlock exitTarget, CfgContext ctx) {
        if (branch instanceof BlockTree) {
            return buildCfg(((BlockTree) branch).getStatements(), head, exitTarget, ctx);
        } else {
            return buildCfg(Collections.singletonList(branch), head, exitTarget, ctx);
        }
    }

    private static String defaultValue(String type) {
        if (type.equals("int") || type.equals("byte") || type.equals("short")) return "0";
        if (type.equals("long")) return "0L";
        if (type.equals("float")) return "0.0f";
        if (type.equals("double")) return "0.0d";
        if (type.equals("char")) return "'\\0'";
        if (type.equals("boolean")) return "false";
        return "null";
    }

    public static boolean flattenMethod(CompilationUnitTree unit, MethodTree node, TreePath methodPath,
            Trees trees, String source, SourcePositions positions, List<Span> edits, SplittableRandom random,
            List<Span> tokens, boolean rename, boolean renameMembers, boolean escapedSyntax,
            boolean numbers, boolean strings, SymbolRenamingRegistry symbols) {
        return flattenMethod(unit, node, methodPath, trees, source, positions, edits, random, tokens,
                rename, renameMembers, escapedSyntax, numbers, strings, symbols, null, null, "hex");
    }

    public static String generateOpaqueTrap(SplittableRandom random, GeneratedSymbolRegistry generatedSymbols,
            Set<String> occupied, String idStyle) {
        String id = Integer.toHexString(random.nextInt(0x1000, 0xffff));
        Set<Integer> states = new HashSet<>();
        states.add(0);
        int s1, s2, s3, s4;
        do { s1 = random.nextInt(0x1000, 0xffff); } while (!states.add(s1));
        do { s2 = random.nextInt(0x1000, 0xffff); } while (!states.add(s2));
        do { s3 = random.nextInt(0x1000, 0xffff); } while (!states.add(s3));
        do { s4 = random.nextInt(0x1000, 0xffff); } while (!states.add(s4));

        String stVar = (generatedSymbols != null && occupied != null)
                ? generatedSymbols.create("cff.trap.st." + id, () -> IdentifierGenerator.nextName(random, occupied, idStyle))
                : "_0xs" + id;
        String accVar = (generatedSymbols != null && occupied != null)
                ? generatedSymbols.create("cff.trap.acc." + id, () -> IdentifierGenerator.nextName(random, occupied, idStyle))
                : "_0xa" + id;

        List<String> cases = new ArrayList<>();
        cases.add("case 0x" + Integer.toHexString(s1) + ":if(((" + accVar + "*" + accVar + "+" + accVar + ")&1)!=0||java.lang.System.nanoTime()==-99999999999999999L)throw new java.lang.InternalError();" + accVar + "=(" + accVar + "*31)^17;" + stVar + "=0x" + Integer.toHexString(s2) + ";break;");
        cases.add("case 0x" + Integer.toHexString(s2) + ":" + accVar + "+=" + accVar + "<<2;" + stVar + "=0x" + Integer.toHexString(s3) + ";break;");
        cases.add("case 0x" + Integer.toHexString(s3) + ":" + accVar + "^=" + accVar + ">>>3;" + stVar + "=0x" + Integer.toHexString(s4) + ";break;");
        cases.add("case 0x" + Integer.toHexString(s4) + ":" + stVar + "=0;break;");

        Collections.shuffle(cases, new Random(random.nextLong()));

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("int ").append(stVar).append("=0x").append(Integer.toHexString(s1)).append(";");
        sb.append("long ").append(accVar).append("=42L;");
        sb.append("while(").append(stVar).append("!=0){switch(").append(stVar).append("){");
        for (String c : cases) sb.append(c);
        sb.append("default:").append(stVar).append("=0;break;");
        sb.append("}}}");
        return sb.toString();
    }

    public static String generateOpaqueTrap(SplittableRandom random) {
        return generateOpaqueTrap(random, null, null, "hex");
    }

    public static void injectOpaqueTrap(CompilationUnitTree unit, MethodTree node, String source,
            SourcePositions positions, List<Span> edits, SplittableRandom random,
            GeneratedSymbolRegistry generatedSymbols, Set<String> occupied, String idStyle) {
        if (node.getBody() == null || node.getName().contentEquals("<init>")) return;
        BlockTree body = node.getBody();
        int start = (int) positions.getStartPosition(unit, body);
        if (start >= 0 && source.charAt(start) == '{') {
            edits.add(new Span(start + 1, start + 1, generateOpaqueTrap(random, generatedSymbols, occupied, idStyle), "edit"));
        }
    }

    public static void injectOpaqueTrap(CompilationUnitTree unit, MethodTree node, String source,
            SourcePositions positions, List<Span> edits, SplittableRandom random) {
        injectOpaqueTrap(unit, node, source, positions, edits, random, null, null, "hex");
    }
}