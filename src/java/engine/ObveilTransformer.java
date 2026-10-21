package engine;

import com.sun.source.tree.*;
import com.sun.source.util.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import javax.lang.model.element.*;
import javax.lang.model.type.TypeKind;
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
            boolean dead, boolean wrap, boolean vm, boolean renameClasses, boolean typeObf,
            String idStyle, boolean compact, String seed) throws Exception {
        SourcePositions positions = trees.getSourcePositions();
        List<Span> tokens = Lexer.lex(source);
        List<Binding> bindings = new ArrayList<>();
        List<Reference> references = new ArrayList<>();
        List<Span> edits = new ArrayList<>();
        Set<String> occupied = new HashSet<>();
        Set<Integer> typeObfAppliedStarts = new HashSet<>();
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
        Set<ClassTree> classesWithVm = Collections.newSetFromMap(new IdentityHashMap<>());
        List<Span> replacedBodySpans = new ArrayList<>();
        java.util.function.BiPredicate<Integer, Integer> isInsideReplaced = (a, b) -> {
            for (Span s : replacedBodySpans) {
                if (a >= s.start && b <= s.end) return true;
            }
            return false;
        };

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

        ObfuscationContext context = new ObfuscationContext(overrideManager);
        SymbolRenamingRegistry symbols = context.getSymbolRegistry();
        GeneratedSymbolRegistry generatedSymbols = context.getGeneratedSymbols();
        VMRegistry vmRegistry = context.getVmRegistry();
        context.getState().setPhase(ObfuscationContext.Phase.PARSED);

        String decMethodName = generatedSymbols.getOrCreate("string.decoder", () -> IdentifierGenerator.nextName(random, occupied, idStyle));
        String vmMethodName = generatedSymbols.getOrCreate("vm.interpreter", () -> IdentifierGenerator.nextName(random, occupied, idStyle));
        String activeDeadMethodName = (dead && !escapedSyntax && primaryClass != null)
                ? generatedSymbols.getOrCreate("dead.hash", () -> IdentifierGenerator.nextName(random, occupied, idStyle))
                : null;
        if (activeDeadMethodName != null) {
            context.registerDeadCodeMethod(activeDeadMethodName);
        }

        Set<Integer> removedDeclarationStarts = new HashSet<>();

        // Phase 1: Pre-populate SymbolRenamingRegistry as the single source of truth
        if (!escapedSyntax) {
            new TreePathScanner<Void, Void>() {
                @Override public Void visitClass(ClassTree node, Void unused) {
                    occupied.add(node.getSimpleName().toString());
                    if (renameClasses) {
                        Element symbol = trees.getElement(getCurrentPath());
                        if (symbol instanceof TypeElement && SymbolRenamer.canRenameClass((TypeElement) symbol, hostClassName)) {
                            symbols.getOrRegister(symbol, () -> IdentifierGenerator.nextName(random, occupied, idStyle));
                        }
                    }
                    return super.visitClass(node, unused);
                }
                @Override public Void visitMethod(MethodTree node, Void unused) {
                    occupied.add(node.getName().toString());
                    Element symbol = trees.getElement(getCurrentPath());
                    if (rename) {
                        boolean ok = SymbolRenamer.canRename(symbol, renameMembers);
                        if (ok && overrideManager != null && !overrideManager.canRename(symbol)) {
                            ok = false;
                        }
                        if (ok) {
                            if (!symbols.contains(symbol)) {
                                String newName = IdentifierGenerator.nextName(random, occupied, idStyle);
                                if (overrideManager != null) {
                                    symbols.registerFamily(overrideManager.getFamily(symbol), newName);
                                } else {
                                    symbols.register(symbol, newName);
                                }
                            }
                        }
                    }
                    return super.visitMethod(node, unused);
                }
                @Override public Void visitVariable(VariableTree node, Void unused) {
                    occupied.add(node.getName().toString());
                    Element symbol = trees.getElement(getCurrentPath());
                    if (rename && SymbolRenamer.canRename(symbol, renameMembers) && !node.getName().contentEquals("this")) {
                        symbols.getOrRegister(symbol, () -> IdentifierGenerator.nextName(random, occupied, idStyle));
                    }
                    return super.visitVariable(node, unused);
                }
                @Override public Void visitIdentifier(IdentifierTree node, Void unused) {
                    occupied.add(node.getName().toString());
                    return super.visitIdentifier(node, unused);
                }
            }.scan(unit, null);
            context.getState().setPhase(ObfuscationContext.Phase.RENAMED);
            context.getState().bumpSymbolVersion();
        }

        ClassTree finalPrimaryClass = primaryClass;
        new TreePathScanner<Void, Void>() {
            int start(Tree tree) { return (int) positions.getStartPosition(unit, tree); }
            int end(Tree tree) { return (int) positions.getEndPosition(unit, tree); }
            ClassTree getEnclosingClass() {
                TreePath p = getCurrentPath();
                while (p != null) {
                    if (p.getLeaf() instanceof ClassTree) return (ClassTree) p.getLeaf();
                    p = p.getParentPath();
                }
                return finalPrimaryClass;
            }
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
                int start = start(node);
                int end = end(node);
                if (isInsideReplaced.test(start, end)) return super.visitVariable(node, unused);
                Element symbol = trees.getElement(getCurrentPath());
                if (rename && !escapedSyntax && SymbolRenamer.canRename(symbol, renameMembers) && !node.getName().contentEquals("this")) {
                    if (node.getInitializer() != null) {
                        int initializer = start(node.getInitializer());
                        if (initializer >= 0) end = Math.min(end, initializer);
                    }
                    bindings.add(new Binding(symbol, node.getName().toString(), start, end, false));
                }
                if (typeObf && !escapedSyntax && symbol != null && symbol.getKind() == ElementKind.LOCAL_VARIABLE) {
                    Tree typeNode = node.getType();
                    if (typeNode instanceof PrimitiveTypeTree) {
                        TypeKind tk = ((PrimitiveTypeTree) typeNode).getPrimitiveTypeKind();
                        String boxed = null;
                        switch (tk) {
                            case INT: boxed = "Integer"; break;
                            case BOOLEAN: boxed = "Boolean"; break;
                            case LONG: boxed = "Long"; break;
                            case DOUBLE: boxed = "Double"; break;
                            case FLOAT: boxed = "Float"; break;
                            case BYTE: boxed = "Byte"; break;
                            case SHORT: boxed = "Short"; break;
                            case CHAR: boxed = "Character"; break;
                            default: break;
                        }
                        if (boxed != null) {
                            int tStart = start(typeNode);
                            int tEnd = end(typeNode);
                            if (tStart >= 0 && tEnd > tStart && !isInsideReplaced.test(tStart, tEnd) && typeObfAppliedStarts.add(tStart)) {
                                edits.add(new Span(tStart, tEnd, boxed, "edit"));
                            }
                        }
                    }
                }
                return super.visitVariable(node, unused);
            }
            @Override public Void visitIdentifier(IdentifierTree node, Void unused) {
                occupied.add(node.getName().toString());
                int a = start(node), b = end(node);
                if (a >= 0 && b > a && !isInsideReplaced.test(a, b)) references.add(new Reference(trees.getElement(getCurrentPath()), a, b));
                return super.visitIdentifier(node, unused);
            }
            @Override public Void visitClass(ClassTree node, Void unused) {
                occupied.add(node.getSimpleName().toString());
                int a = start(node), b = end(node);
                if (renameClasses && !escapedSyntax && !isInsideReplaced.test(a, b)) {
                    Element symbol = trees.getElement(getCurrentPath());
                    if (symbol instanceof TypeElement && SymbolRenamer.canRenameClass((TypeElement) symbol, hostClassName)) {
                        String simpleName = node.getSimpleName().toString();
                        int cur = Lexer.tokenStart(tokens, a);
                        Span matched = null;
                        for (int i = cur; i < tokens.size(); i++) {
                            Span t = tokens.get(i);
                            if (t.start >= b || t.text.equals("{")) break;
                            if (t.kind.equals("identifier") && t.text.equals(simpleName)) {
                                matched = t;
                                break;
                            }
                        }
                        if (matched != null) {
                            bindings.add(new Binding(symbol, simpleName, matched.start, matched.end, false));
                        }
                    }
                }
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
                if (renameClasses && !escapedSyntax && node.getName().contentEquals("<init>")) {
                    Element owner = symbol != null ? symbol.getEnclosingElement() : null;
                    if (owner instanceof TypeElement && SymbolRenamer.canRenameClass((TypeElement) owner, hostClassName)) {
                        String className = owner.getSimpleName().toString();
                        int mStart = start(node);
                        int mEnd = node.getBody() != null ? start(node.getBody()) : end(node);
                        int cur = Lexer.tokenStart(tokens, mStart);
                        Span matched = null;
                        for (int i = cur; i < tokens.size(); i++) {
                            Span t = tokens.get(i);
                            if (t.start >= mEnd || t.text.equals("(")) break;
                            if (t.kind.equals("identifier") && t.text.equals(className)) {
                                matched = t;
                                break;
                            }
                        }
                        if (matched != null && !isInsideReplaced.test(matched.start, matched.end)) {
                            references.add(new Reference(owner, matched.start, matched.end));
                        }
                    }
                }
                boolean virtualized = false;
                if (vm && !escapedSyntax) {
                    virtualized = RcVmEngine.virtualizeMethod(unit, node, getCurrentPath(), trees, positions, edits, random, vmMethodName, rename, symbols, vmRegistry);
                    if (virtualized) {
                        ClassTree enc = getTopClass();
                        if (enc != null && enc.getKind() == Tree.Kind.CLASS) classesWithVm.add(enc);
                        if (node.getBody() != null) {
                            int bStart = (int) positions.getStartPosition(unit, node.getBody());
                            int bEnd = (int) positions.getEndPosition(unit, node.getBody());
                            replacedBodySpans.add(new Span(bStart, bEnd, "", ""));
                        }
                    }
                }
                boolean flattened = false;
                if (!virtualized && cff && !escapedSyntax) {
                    flattened = ControlFlowFlattener.flattenMethod(unit, node, getCurrentPath(), trees, source, positions, edits, random, tokens,
                            rename, renameMembers, escapedSyntax, numbers, strings, symbols, generatedSymbols, occupied, idStyle);
                    if (flattened && node.getBody() != null) {
                        int bStart = (int) positions.getStartPosition(unit, node.getBody());
                        int bEnd = (int) positions.getEndPosition(unit, node.getBody());
                        replacedBodySpans.add(new Span(bStart, bEnd, "", ""));
                    }
                }
                if (!virtualized && !flattened && dead && !escapedSyntax && activeDeadMethodName != null) {
                    ClassTree enc = getTopClass();
                    if (enc != null && enc.getKind() == Tree.Kind.CLASS) classesWithDeadCode.add(enc);
                    DeadCode.injectMethodDeadCode(unit, node, source, positions, edits, random, activeDeadMethodName, generatedSymbols, occupied, idStyle);
                }
                return super.visitMethod(node, unused);
            }
            @Override public Void visitMemberSelect(MemberSelectTree node, Void unused) {
                occupied.add(node.getIdentifier().toString());
                int a = start(node), b = end(node);
                if (a >= 0 && b > a && !isInsideReplaced.test(a, b)) {
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
                if (a >= 0 && b > a && !isInsideReplaced.test(a, b)) {
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
                if (a >= 0 && b > a && !isInsideReplaced.test(a, b)) {
                    if (strings && node.getValue() instanceof String) {
                        if (escapedSyntax || StringCrypto.isConstantContext(getCurrentPath(), node)) {
                            edits.add(new Span(a, b, StringCrypto.encodedString((String) node.getValue()), "edit"));
                        } else {
                            ClassTree enc = getTopClass();
                            if (enc != null && enc.getKind() == Tree.Kind.CLASS) {
                                boolean[] engines = classStringEngines.computeIfAbsent(enc, k -> new boolean[3]);
                                engines[0] = true;
                                int scheme = random.nextInt(3);
                                if (scheme == 1) engines[1] = true;
                                if (scheme == 2) engines[2] = true;
                                int k = random.nextInt();
                                edits.add(new Span(a, b, StringCrypto.formatByteCall(null, decMethodName, (String) node.getValue(), k, scheme), "edit"));
                            } else {
                                edits.add(new Span(a, b, StringCrypto.encodedString((String) node.getValue()), "edit"));
                            }
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
                DeadCode.injectClassDeadCode(ct, unit, positions, source, edits, activeDeadMethodName, generatedSymbols, random, occupied, idStyle);
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
                int cur = Lexer.tokenStart(tokens, binding.start);
                for (int cursor = cur; cursor < tokens.size(); cursor++) {
                    Span token = tokens.get(cursor);
                    if (binding.end > binding.start && token.start >= binding.end) break;
                    if (token.text.equals(";") || token.text.equals("{") || token.text.equals(")") || token.text.equals(":")) {
                        if (binding.end <= binding.start) break;
                    }
                    if (binding.end > binding.start && token.end > binding.end) continue;
                    if (!token.kind.equals("identifier") || !token.text.equals(binding.name)) continue;
                    if (!referenceStarts.contains(token.start)) candidates.add(token);
                }
                if (candidates.isEmpty()) {
                    for (int cursor = cur; cursor < tokens.size(); cursor++) {
                        Span token = tokens.get(cursor);
                        if (token.text.equals(";") || token.text.equals("{") || token.text.equals(")")) break;
                        if (token.kind.equals("identifier") && token.text.equals(binding.name)) {
                            candidates.add(token);
                            break;
                        }
                    }
                }
                if (!candidates.isEmpty()) declaration = candidates.get(candidates.size() - 1);
            }
            if (declaration == null || removedDeclarationStarts.contains(declaration.start) || isInsideReplaced.test(declaration.start, declaration.end)) continue;
            String name = symbols.get(binding.symbol);
            if (name == null) {
                name = symbols.getOrRegister(binding.symbol, () -> IdentifierGenerator.nextName(random, occupied, idStyle));
            }
            if (name != null && appliedStarts.add(declaration.start)) {
                edits.add(new Span(declaration.start, declaration.end, name, "edit"));
            }
        }
        for (Reference reference : references) {
            if (isInsideReplaced.test(reference.start, reference.end)) continue;
            String name = symbols.get(reference.symbol);
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

        for (ClassTree ct : classesWithVm) {
            int classEnd = (int) positions.getEndPosition(unit, ct);
            int closeBrace = source.lastIndexOf('}', classEnd - 1);
            if (closeBrace >= 0) {
                edits.add(new Span(closeBrace, closeBrace, RcVmEngine.generateRuntimeInterpreter(vmMethodName), "edit"));
            }
        }

        context.getState().setPhase(ObfuscationContext.Phase.EMITTED);
        context.assertConsistent();

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
                    flags.contains("v"),
                    flags.contains("C"),
                    flags.contains("T"),
                    idStyle,
                    flags.contains("c"),
                    seed);
        }
    }
}
