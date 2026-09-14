package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.TreePath;
import com.sun.source.util.Trees;
import javax.lang.model.element.Element;
import java.util.*;
import java.util.function.Function;

public final class ControlFlowFlattener {
    public static void flattenMethod(CompilationUnitTree unit, MethodTree node, TreePath methodPath,
            Trees trees, String source, SourcePositions positions, List<Span> edits, SplittableRandom random,
            List<Span> tokens, boolean rename, boolean renameMembers, boolean escapedSyntax,
            Function<Element, String> nameProvider, Set<Integer> removedDeclarationStarts) {
        if (node.getBody() == null || node.getName().contentEquals("<init>") || node.getName().contentEquals("<clinit>")) return;
        BlockTree body = node.getBody();
        List<? extends StatementTree> stmts = body.getStatements();
        if (stmts.size() < 2) {
            injectOpaqueTrap(unit, node, source, positions, edits, random);
            return;
        }

        int bodyStart = (int) positions.getStartPosition(unit, body);
        int bodyEnd = (int) positions.getEndPosition(unit, body);
        if (bodyStart < 0 || bodyEnd <= bodyStart || source.charAt(bodyStart) != '{') return;

        StringBuilder hoisted = new StringBuilder();
        Set<Integer> handledStarts = new HashSet<>();
        for (StatementTree st : stmts) {
            if (st instanceof VariableTree) {
                VariableTree vt = (VariableTree) st;
                String originalName = vt.getName().toString();
                int vtStart = (int) positions.getStartPosition(unit, vt);
                int vtEnd = (int) positions.getEndPosition(unit, vt);
                int cur = Lexer.tokenStart(tokens, vtStart);
                Span nameToken = null;
                int initStart = (vt.getInitializer() != null) ? (int) positions.getStartPosition(unit, vt.getInitializer()) : vtEnd;
                for (int i = cur; i < tokens.size(); i++) {
                    Span t = tokens.get(i);
                    if (t.start >= initStart) break;
                    if (t.kind.equals("identifier") && t.text.equals(originalName)) {
                        nameToken = t;
                    }
                }

                Element varSymbol = (trees != null && methodPath != null) ? trees.getElement(new TreePath(methodPath, vt)) : null;
                String varName = originalName;
                if (rename && !escapedSyntax && varSymbol != null && SymbolRenamer.canRename(varSymbol, renameMembers)) {
                    varName = nameProvider.apply(varSymbol);
                }

                String typeStr = vt.getType().toString();
                if (typeStr.equals("var") && varSymbol != null) {
                    typeStr = varSymbol.asType().toString();
                }

                hoisted.append(typeStr).append(" ").append(varName).append("=").append(defaultValue(typeStr)).append(";");

                if (vt.getInitializer() != null) {
                    if (nameToken != null && nameToken.start > vtStart && handledStarts.add(vtStart)) {
                        edits.add(new Span(vtStart, nameToken.start, "", "edit"));
                    }
                } else {
                    if (handledStarts.add(vtStart)) {
                        edits.add(new Span(vtStart, vtEnd, "", "edit"));
                    }
                    if (nameToken != null) {
                        removedDeclarationStarts.add(nameToken.start);
                    }
                }
            }
        }

        String id = Integer.toHexString(random.nextInt(0x1000, 0xffff));
        String stVar = "_0xs" + id;
        Set<Integer> used = new HashSet<>();
        int[] states = new int[stmts.size()];
        for (int i = 0; i < stmts.size(); i++) {
            states[i] = pickState(random, used);
        }

        StringBuilder head = new StringBuilder();
        head.append(hoisted);
        head.append(generateOpaqueTrap(random));
        head.append("int ").append(stVar).append("=0x").append(Integer.toHexString(states[0])).append(";");
        head.append("while(").append(stVar).append("!=0){switch(").append(stVar).append("){");
        head.append("case 0x").append(Integer.toHexString(states[0])).append(":");

        edits.add(new Span(bodyStart + 1, bodyStart + 1, head.toString(), "edit"));

        for (int i = 0; i < stmts.size(); i++) {
            StatementTree st = stmts.get(i);
            int stEnd = (int) positions.getEndPosition(unit, st);
            boolean isLast = (i == stmts.size() - 1);
            boolean isReturnOrThrow = (st instanceof ReturnTree || st instanceof ThrowTree);

            StringBuilder boundary = new StringBuilder();
            if (!isReturnOrThrow) {
                int nextState = isLast ? 0 : states[i + 1];
                boundary.append(stVar).append("=0x").append(Integer.toHexString(nextState)).append(";break;");
            }
            if (!isLast) {
                boundary.append("case 0x").append(Integer.toHexString(states[i + 1])).append(":");
            } else {
                boundary.append("default:").append(stVar).append("=0;break;");
                boundary.append("}}");
                if (node.getReturnType() != null && !node.getReturnType().toString().equals("void")) {
                    boundary.append("throw new java.lang.IllegalStateException();");
                }
            }
            edits.add(new Span(stEnd, stEnd, boundary.toString(), "edit"));
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

    public static String generateOpaqueTrap(SplittableRandom random) {
        String id = Integer.toHexString(random.nextInt(0x1000, 0xffff));
        Set<Integer> used = new HashSet<>();
        int s1 = pickState(random, used);
        int s2 = pickState(random, used);
        int s3 = pickState(random, used);
        int s4 = pickState(random, used);
        int d1 = pickState(random, used);
        int d2 = pickState(random, used);

        String ptrVar = "_0xp" + id;
        String stVar = "_0xs" + id;
        String tabVar = "_0xt" + id;
        String accVar = "_0xa" + id;

        List<String> cases = new ArrayList<>();
        cases.add("case 0x" + Integer.toHexString(s1) + ":if(java.lang.System.identityHashCode(java.lang.System.out)==0||java.lang.System.nanoTime()==-99999999999999999L)throw new java.lang.Error();" + accVar + "=(" + accVar + "*31)^java.lang.Thread.currentThread().getPriority();" + stVar + "=" + tabVar + "[" + ptrVar + "++];break;");
        cases.add("case 0x" + Integer.toHexString(s2) + ":if(java.lang.Runtime.getRuntime().availableProcessors()<=0||java.lang.System.nanoTime()==2L)throw new java.lang.Error();" + accVar + "+=(" + accVar + "<<3)^(" + accVar + ">>>5);" + stVar + "=" + tabVar + "[" + ptrVar + "++];break;");
        cases.add("case 0x" + Integer.toHexString(s3) + ":if(java.lang.System.nanoTime()<0&&java.lang.System.currentTimeMillis()<0)throw new java.lang.Error();" + accVar + "^=java.lang.System.identityHashCode(java.lang.String.class);" + stVar + "=" + tabVar + "[" + ptrVar + "++];break;");
        cases.add("case 0x" + Integer.toHexString(s4) + ":if((" + accVar + "&0)==1)throw new java.lang.AssertionError();" + stVar + "=" + tabVar + "[" + ptrVar + "++];break;");
        cases.add("case 0x" + Integer.toHexString(d1) + ":throw new java.lang.Error(java.lang.String.valueOf(" + accVar + "));");
        cases.add("case 0x" + Integer.toHexString(d2) + ":byte[] _0xfb" + id + "=new byte[8];for(int _0xi" + id + "=0;_0xi" + id + "<8;_0xi" + id + "++)_0xfb" + id + "[_0xi" + id + "]=(byte)(_0xi" + id + "*13);throw new java.lang.IllegalStateException(new java.lang.String(_0xfb" + id + "));");

        Collections.shuffle(cases, new Random(random.nextLong()));

        StringBuilder sb = new StringBuilder();
        sb.append("{((java.lang.Runnable)()->{");
        sb.append("int[] ").append(tabVar).append("=new int[]{0x").append(Integer.toHexString(s1))
          .append(",0x").append(Integer.toHexString(s2))
          .append(",0x").append(Integer.toHexString(s3))
          .append(",0x").append(Integer.toHexString(s4))
          .append(",0};");
        sb.append("int ").append(ptrVar).append("=0;");
        sb.append("int ").append(stVar).append("=").append(tabVar).append("[").append(ptrVar).append("++];");
        sb.append("long ").append(accVar).append("=java.lang.System.currentTimeMillis();");
        sb.append("while(").append(stVar).append("!=0){switch(").append(stVar).append("){");
        for (String c : cases) sb.append(c);
        sb.append("default:").append(stVar).append("=0;break;");
        sb.append("}}}).run();}");
        return sb.toString();
    }

    public static void injectOpaqueTrap(CompilationUnitTree unit, MethodTree node, String source,
            SourcePositions positions, List<Span> edits, SplittableRandom random) {
        if (node.getBody() == null || node.getName().contentEquals("<init>")) return;
        BlockTree body = node.getBody();
        int start = (int) positions.getStartPosition(unit, body);
        if (start >= 0 && source.charAt(start) == '{') {
            edits.add(new Span(start + 1, start + 1, generateOpaqueTrap(random), "edit"));
        }
    }

    private static int pickState(SplittableRandom random, Set<Integer> used) {
        int v;
        do {
            v = random.nextInt(0x10, 0xfe);
        } while (!used.add(v));
        return v;
    }
}