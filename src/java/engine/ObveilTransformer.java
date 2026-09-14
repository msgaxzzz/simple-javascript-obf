package engine;

import com.sun.source.tree.*;
import com.sun.source.util.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import javax.lang.model.element.*;
import javax.lang.model.util.*;
import javax.tools.*;

public final class ObveilTransformer {
    public static final class Source extends SimpleJavaFileObject {
        final String text;
        public Source(String name, String text) {
            super(URI.create("string:///" + name), Kind.SOURCE);
            this.text = text;
        }
        @Override public CharSequence getCharContent(boolean ignoreErrors) { return text; }
    }

    static final class Binding {
        final Element symbol;
        final String name;
        final int start, end;
        final boolean isMethod;
        Binding(Element symbol, String name, int start, int end, boolean isMethod) {
            this.symbol = symbol; this.name = name; this.start = start; this.end = end; this.isMethod = isMethod;
        }
    }

    static final class Reference {
        final Element symbol;
        final int start, end;
        Reference(Element symbol, int start, int end) {
            this.symbol = symbol; this.start = start; this.end = end;
        }
    }

    public static String transform(String source, CompilationUnitTree unit, Trees trees, Elements elements, Types types,
            boolean rename, boolean renameMembers, boolean strings, boolean cff, boolean numbers, boolean antiDebug,
            boolean dead, boolean wrap, String idStyle, boolean compact, String seed) throws Exception {
        SourcePositions positions = trees.getSourcePositions();
        List<Span> tokens = Lexer.lex(source);
        List<Binding> bindings = new ArrayList<>();
        List<Reference> references = new ArrayList<>();
        List<Span> edits = new ArrayList<>();
        Set<String> occupied = new HashSet<>();
        boolean escapedSyntax = Lexer.hasUnicodeEscapes(source);

        ClassTree primaryClass = null;
        for (Tree decl : unit.getTypeDecls()) {
            if (decl instanceof ClassTree) {
                ClassTree ct = (ClassTree) decl;
                if (ct.getModifiers().getFlags().contains(Modifier.PUBLIC)) { primaryClass = ct; break; }
                if (primaryClass == null) primaryClass = ct;
            }
        }
        String hostClassName = primaryClass != null ? primaryClass.getSimpleName().toString() : "Main";
        String decMethodName = "_0xd";

        Set<Element> localMethods = new HashSet<>();
        new TreePathScanner<Void, Void>() {
            @Override public Void visitMethod(MethodTree node, Void unused) {
                Element el = trees.getElement(getCurrentPath());
                if (el instanceof ExecutableElement) localMethods.add(el);
                return super.visitMethod(node, unused);
            }
        }.scan(unit, null);

        SymbolRenamer.OverrideManager overrideManager = (rename && renameMembers)
                ? SymbolRenamer.buildOverrideManager(localMethods, elements, types)
                : null;

        List<String> constructors = new ArrayList<>();
        boolean hasMain = false;
        String mainThrows = "";
        if (primaryClass != null) {
            for (Tree member : primaryClass.getMembers()) {
                if (member instanceof MethodTree) {
                    MethodTree mt = (MethodTree) member;
                    if (mt.getName().contentEquals("main") && mt.getModifiers().getFlags().contains(Modifier.STATIC)) {
                        hasMain = true;
                        if (!mt.getThrows().isEmpty()) {
                            List<String> thrown = new ArrayList<>();
                            for (ExpressionTree ex : mt.getThrows()) {
                                thrown.add(ex.toString());
                            }
                            mainThrows = " throws " + String.join(",", thrown);
                        }
                    } else if (mt.getName().contentEquals("<init>")) {
                        if (!mt.getParameters().isEmpty()) {
                            List<String> params = new ArrayList<>();
                            List<String> args = new ArrayList<>();
                            int pIdx = 0;
                            for (VariableTree param : mt.getParameters()) {
                                String pName = "_0xp" + (pIdx++);
                                params.add(param.getType().toString() + " " + pName);
                                args.add(pName);
                            }
                            constructors.add("public " + hostClassName + "(" + String.join(",", params) + "){super(" + String.join(",", args) + ");}");
                        }
                    }
                }
            }
        }

        byte[] digest = MessageDigest.getInstance("SHA-256").digest(seed.getBytes(StandardCharsets.UTF_8));
        long seedLong = 0;
        for (int i = 0; i < 8; i++) seedLong = (seedLong << 8) | (digest[i] & 255L);
        SplittableRandom random = new SplittableRandom(seedLong);
        Map<ClassTree, boolean[]> classStringEngines = new IdentityHashMap<>();
        Set<ClassTree> classesWithDeadCode = Collections.newSetFromMap(new IdentityHashMap<>());
        String activeDeadMethodName = (dead && !escapedSyntax && primaryClass != null) ? "_0xdc" + Integer.toHexString(random.nextInt(0x1000, 0xffff)) : null;

        Map<Element, String> names = new IdentityHashMap<>();
        Set<Integer> removedDeclarationStarts = new HashSet<>();
        java.util.function.Function<Element, String> nameProvider = (symbol) -> {
            if (symbol == null) return null;
            Element key = symbol;
            if (key instanceof ExecutableElement && overrideManager != null) {
                key = overrideManager.find(key);
            }
            String n = names.get(key);
            if (n == null) {
                n = IdentifierGenerator.nextName(random, occupied, idStyle);
                names.put(key, n);
            }
            names.put(symbol, n);
            return n;
        };

        ClassTree finalPrimaryClass = primaryClass;
        new TreePathScanner<Void, Void>() {
            int start(Tree tree) { return (int) positions.getStartPosition(unit, tree); }
            int end(Tree tree) { return (int) positions.getEndPosition(unit, tree); }
            ClassTree getTopClass() {
                ClassTree top = null;
                TreePath p = getCurrentPath();
                while (p != null) {
                    if (p.getLeaf() instanceof ClassTree) top = (ClassTree) p.getLeaf();
                    p = p.getParentPath();
                }
                return top != null ? top : finalPrimaryClass;
            }
            @Override public Void visitVariable(VariableTree node, Void unused) {
                occupied.add(node.getName().toString());
                Element symbol = trees.getElement(getCurrentPath());
                if (rename && !escapedSyntax && SymbolRenamer.canRename(symbol, renameMembers) && !node.getName().contentEquals("this")) {
                    int start = start(node);
                    int end = end(node);
                    if (node.getInitializer() != null) {
                        int initializer = start(node.getInitializer());
                        if (initializer >= 0) end = Math.min(end, initializer);
                    }
                    bindings.add(new Binding(symbol, node.getName().toString(), start, end, false));
                }
                return super.visitVariable(node, unused);
            }
            @Override public Void visitIdentifier(IdentifierTree node, Void unused) {
                occupied.add(node.getName().toString());
                int a = start(node), b = end(node);
                if (a >= 0 && b > a) references.add(new Reference(trees.getElement(getCurrentPath()), a, b));
                return super.visitIdentifier(node, unused);
            }
            @Override public Void visitClass(ClassTree node, Void unused) {
                occupied.add(node.getSimpleName().toString());
                return super.visitClass(node, unused);
            }
            @Override public Void visitMethod(MethodTree node, Void unused) {
                occupied.add(node.getName().toString());
                Element symbol = trees.getElement(getCurrentPath());
                if (rename && !escapedSyntax) {
                    boolean ok = SymbolRenamer.canRename(symbol, renameMembers);
                    if (ok && overrideManager != null && !overrideManager.canRename(symbol)) {
                        ok = false;
                    }
                    if (ok) {
                        int start = start(node);
                        int end = node.getBody() != null ? start(node.getBody()) : end(node);
                        bindings.add(new Binding(symbol, node.getName().toString(), start, end, true));
                    }
                }
                if (cff && !escapedSyntax) {
                    ControlFlowFlattener.flattenMethod(unit, node, getCurrentPath(), trees, source, positions, edits, random, tokens,
                            rename, renameMembers, escapedSyntax, nameProvider, removedDeclarationStarts);
                }
                if (dead && !escapedSyntax && activeDeadMethodName != null) {
                    ClassTree top = getTopClass();
                    if (top != null) classesWithDeadCode.add(top);
                    DeadCode.injectMethodDeadCode(unit, node, source, positions, edits, random, activeDeadMethodName);
                }
                return super.visitMethod(node, unused);
            }
            @Override public Void visitMemberSelect(MemberSelectTree node, Void unused) {
                occupied.add(node.getIdentifier().toString());
                int a = start(node), b = end(node);
                if (a >= 0 && b > a) {
                    Element symbol = trees.getElement(getCurrentPath());
                    if (symbol != null) {
                        String idName = node.getIdentifier().toString();
                        int cur = Lexer.tokenStart(tokens, a);
                        Span matched = null;
                        for (int i = cur; i < tokens.size(); i++) {
                            Span t = tokens.get(i);
                            if (t.start >= b) break;
                            if (t.kind.equals("identifier") && t.text.equals(idName)) matched = t;
                        }
                        if (matched != null) references.add(new Reference(symbol, matched.start, matched.end));
                    }
                }
                return super.visitMemberSelect(node, unused);
            }
            @Override public Void visitMemberReference(MemberReferenceTree node, Void unused) {
                occupied.add(node.getName().toString());
                int a = start(node), b = end(node);
                if (a >= 0 && b > a) {
                    Element symbol = trees.getElement(getCurrentPath());
                    if (symbol != null) {
                        String idName = node.getName().toString();
                        int cur = Lexer.tokenStart(tokens, a);
                        Span matched = null;
                        for (int i = cur; i < tokens.size(); i++) {
                            Span t = tokens.get(i);
                            if (t.start >= b) break;
                            if (t.kind.equals("identifier") && t.text.equals(idName)) matched = t;
                        }
                        if (matched != null) references.add(new Reference(symbol, matched.start, matched.end));
                    }
                }
                return super.visitMemberReference(node, unused);
            }
            @Override public Void visitLiteral(LiteralTree node, Void unused) {
                int a = start(node), b = end(node);
                if (a >= 0 && b > a) {
                    if (strings && node.getValue() instanceof String) {
                        if (escapedSyntax || StringCrypto.isConstantContext(getCurrentPath(), node)) {
                            edits.add(new Span(a, b, StringCrypto.encodedString((String) node.getValue()), "edit"));
                        } else {
                            ClassTree topClass = getTopClass();
                            boolean[] engines = classStringEngines.computeIfAbsent(topClass, k -> new boolean[3]);
                            engines[0] = true;
                            int scheme = random.nextInt(3);
                            if (scheme == 1) engines[1] = true;
                            if (scheme == 2) engines[2] = true;
                            int k = random.nextInt();
                            edits.add(new Span(a, b, StringCrypto.formatByteCall(null, decMethodName, (String) node.getValue(), k, scheme), "edit"));
                        }
                    } else if (numbers && !escapedSyntax && node.getValue() instanceof Integer) {
                        if (NumberObfuscator.isSafeContext(getCurrentPath(), node)) {
                            int val = (Integer) node.getValue();
                            edits.add(new Span(a, b, NumberObfuscator.obfuscateInt(val, random), "edit"));
                        }
                    }
                }
                return super.visitLiteral(node, unused);
            }
        }.scan(unit, null);

        if (antiDebug && !escapedSyntax && primaryClass != null) {
            AntiDebug.injectStaticAntiDebug(primaryClass, unit, positions, source, edits);
        }
        if (dead && !escapedSyntax && activeDeadMethodName != null) {
            for (ClassTree ct : classesWithDeadCode) {
                DeadCode.injectClassDeadCode(ct, unit, positions, source, edits, activeDeadMethodName);
            }
        }

        Set<Integer> referenceStarts = new HashSet<>();
        for (Reference ref : references) referenceStarts.add(ref.start);
        Set<Integer> appliedStarts = new HashSet<>();
        for (Binding binding : bindings) {
            Span declaration = null;
            if (binding.isMethod) {
                for (int cursor = Lexer.tokenStart(tokens, binding.start); cursor < tokens.size(); cursor++) {
                    Span token = tokens.get(cursor);
                    if (token.start >= binding.end) break;
                    if (token.kind.equals("identifier") && token.text.equals(binding.name)) {
                        boolean notAnno = (cursor == 0 || !tokens.get(cursor - 1).text.equals("@"));
                        boolean followedByParen = (cursor + 1 < tokens.size() && tokens.get(cursor + 1).text.equals("("));
                        if (notAnno && followedByParen && !referenceStarts.contains(token.start)) {
                            declaration = token;
                            break;
                        }
                    }
                }
            } else {
                List<Span> candidates = new ArrayList<>();
                for (int cursor = Lexer.tokenStart(tokens, binding.start); cursor < tokens.size(); cursor++) {
                    Span token = tokens.get(cursor);
                    if (token.start >= binding.end) break;
                    if (token.end > binding.end || !token.kind.equals("identifier")
                            || !token.text.equals(binding.name)) continue;
                    if (!referenceStarts.contains(token.start)) candidates.add(token);
                }
                if (!candidates.isEmpty()) declaration = candidates.get(candidates.size() - 1);
            }
            if (declaration == null || removedDeclarationStarts.contains(declaration.start)) continue;
            String name = nameProvider.apply(binding.symbol);
            if (appliedStarts.add(declaration.start)) {
                edits.add(new Span(declaration.start, declaration.end, name, "edit"));
            }
        }
        for (Reference reference : references) {
            Element key = reference.symbol;
            if (key instanceof ExecutableElement && overrideManager != null) {
                key = overrideManager.find(key);
            }
            String name = names.get(key);
            if (name != null && appliedStarts.add(reference.start)) {
                edits.add(new Span(reference.start, reference.end, name, "edit"));
            }
        }

        for (ClassTree ct : classStringEngines.keySet()) {
            int classEnd = (int) positions.getEndPosition(unit, ct);
            int closeBrace = source.lastIndexOf('}', classEnd - 1);
            if (closeBrace >= 0) {
                boolean[] engines = classStringEngines.get(ct);
                edits.add(new Span(closeBrace, closeBrace, StringCrypto.decryptorSource(decMethodName, engines[1], engines[2]), "edit"));
            }
        }

        edits.sort(Comparator.comparingInt(edit -> edit.start));
        StringBuilder changed = new StringBuilder();
        int position = 0;
        for (Span edit : edits) {
            if (edit.start < position) throw new IllegalArgumentException("Overlapping Java source edits.");
            changed.append(source, position, edit.start).append(edit.text);
            position = edit.end;
        }
        changed.append(source, position, source.length());
        if (escapedSyntax) return changed.toString();
        StringBuilder out = new StringBuilder();
        for (Span token : Lexer.lex(changed.toString())) {
            if (token.kind.equals("comment") || (compact && token.kind.equals("space"))) {
                if (!compact || (out.length() > 0 && out.charAt(out.length() - 1) != ' ')) out.append(' ');
            } else out.append(token.text);
        }
        String transformed = out.toString().trim();
        if (wrap && !escapedSyntax && primaryClass != null) {
            return ClassWrapper.wrapAndSplit(transformed, hostClassName, hasMain, mainThrows, constructors, random, compact);
        }
        return transformed;
    }

    public static String className(CompilationUnitTree unit) {
        if (unit.getModule() != null) return "module-info.java";
        String fallback = "Input.java";
        for (Tree declaration : unit.getTypeDecls()) {
            if (declaration instanceof ClassTree) {
                ClassTree type = (ClassTree) declaration;
                fallback = type.getSimpleName().toString() + ".java";
                if (type.getModifiers().getFlags().contains(Modifier.PUBLIC)) return fallback;
            }
        }
        return fallback;
    }

    public static String execute(String source, String flags, String seed, String filename, String classpath, String release) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalArgumentException("A full JDK is required, not a JRE.");
        List<String> compilerOptions = new ArrayList<>(Arrays.asList("-proc:none", "-Xlint:none", "-implicit:none", "-classpath", classpath));
        if (!release.isEmpty()) { compilerOptions.add("--release"); compilerOptions.add(release); }
        try (StandardJavaFileManager files = compiler.getStandardFileManager(null, Locale.ROOT, StandardCharsets.UTF_8)) {
            DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
            JavacTask task = (JavacTask) compiler.getTask(null, files, diagnostics, compilerOptions, null,
                    Collections.singletonList(new Source("Input.java", source)));
            CompilationUnitTree unit = task.parse().iterator().next();
            String name = className(unit);
            if (!name.equals("Input.java")) {
                diagnostics = new DiagnosticCollector<>();
                task = (JavacTask) compiler.getTask(null, files, diagnostics, compilerOptions, null,
                        Collections.singletonList(new Source(name, source)));
                unit = task.parse().iterator().next();
            }
            task.analyze();
            List<String> errors = new ArrayList<>();
            for (Diagnostic<? extends JavaFileObject> diagnostic : diagnostics.getDiagnostics()) {
                if (diagnostic.getKind() == Diagnostic.Kind.ERROR) {
                    errors.add(filename + ":line " + diagnostic.getLineNumber() + ":" + diagnostic.getColumnNumber()
                            + " " + diagnostic.getMessage(Locale.ROOT));
                }
            }
            if (!errors.isEmpty()) throw new IllegalArgumentException(String.join("\n", errors));
            String idStyle = flags.contains("I") ? "confusable" : (flags.contains("H") ? "short" : "hex");
            return transform(source, unit, Trees.instance(task), task.getElements(), task.getTypes(),
                    flags.contains("r"),
                    flags.contains("m"),
                    flags.contains("s"),
                    flags.contains("f"),
                    flags.contains("n"),
                    flags.contains("a"),
                    flags.contains("d"),
                    flags.contains("w"),
                    idStyle,
                    flags.contains("c"),
                    seed);
        }
    }
}
