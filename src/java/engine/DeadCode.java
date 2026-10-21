package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import java.util.List;
import java.util.Set;
import java.util.SplittableRandom;
import java.util.concurrent.atomic.AtomicInteger;

public final class DeadCode {

    private static final AtomicInteger SEQ = new AtomicInteger(1);

    public static void injectMethodDeadCode(CompilationUnitTree unit, MethodTree node, String source,
            SourcePositions positions, List<Span> edits, SplittableRandom random, String activeDeadMethodName,
            GeneratedSymbolRegistry generatedSymbols, Set<String> occupied, String idStyle) {
        if (node.getBody() == null || node.getName().contentEquals("<init>")) return;
        BlockTree body = node.getBody();
        int start = (int) positions.getStartPosition(unit, body);
        if (start >= 0 && source.charAt(start) == '{') {
            int seq = SEQ.getAndIncrement();
            String id = Integer.toHexString(seq);

            java.util.function.Function<String, String> genSym = (logicalKey) -> {
                if (generatedSymbols != null) {
                    return generatedSymbols.getOrCreate(logicalKey, () ->
                            IdentifierGenerator.nextName(random, occupied, idStyle));
                }
                return "_0x" + Long.toUnsignedString(random.nextLong(), 16);
            };

            int pick = random.nextInt(4);
            String snippet;
            switch (pick) {
                case 0: {
                    // Property: consecutive integers product is always even: (v * (v + 1)) & 1 == 0
                    String vA = genSym.apply("dead.local." + id + ".a");
                    String vB = genSym.apply("dead.local." + id + ".b");
                    String vV = genSym.apply("dead.local." + id + ".v");
                    snippet = "{int " + vA + "=java.lang.System.identityHashCode(java.lang.System.out);int "
                            + vB + "=java.lang.Runtime.getRuntime().availableProcessors();int "
                            + vV + "=(" + vA + "^(" + vB + "<<16));if((((" + vV + "*(" + vV + "+1))&1)!=0)){throw new java.lang.Error();}}";
                    break;
                }
                case 1: {
                    // Property: odd integer squared modulo 8 is always 1: ((2m + 1)^2) & 7 == 1
                    String vH = genSym.apply("dead.local." + id + ".h");
                    String vK = genSym.apply("dead.local." + id + ".k");
                    snippet = "{int " + vH + "=java.lang.System.identityHashCode(java.lang.System.out);int "
                            + vK + "=(" + vH + "<<1)|1;if((((" + vK + "*" + vK + ")&7)!=1)){throw new java.lang.Error();}}";
                    break;
                }
                case 2: {
                    // Boolean ring identity: (x ^ y) == ((x | y) - (x & y))
                    String vX = genSym.apply("dead.local." + id + ".x");
                    String vY = genSym.apply("dead.local." + id + ".y");
                    snippet = "{int " + vX + "=(int)java.lang.System.nanoTime();int "
                            + vY + "=java.lang.System.identityHashCode(java.lang.System.out);if(("
                            + vX + "^" + vY + ")!=((" + vX + "|" + vY + ")-(" + vX + "&" + vY + "))){throw new java.lang.Error();}}";
                    break;
                }
                default: {
                    // 64-bit parity identity on consecutive integers
                    String vT = genSym.apply("dead.local." + id + ".t");
                    String vC = genSym.apply("dead.local." + id + ".c");
                    String vM = genSym.apply("dead.local." + id + ".m");
                    snippet = "{long " + vT + "=java.lang.System.nanoTime();int "
                            + vC + "=java.lang.Runtime.getRuntime().availableProcessors();long "
                            + vM + "=(" + vT + "|((long)" + vC + "<<32))|1L;if((((" + vM + "*(" + vM + "+1L))&1L)!=0L)){throw new java.lang.Error();}}";
                    break;
                }
            }

            if (activeDeadMethodName != null) {
                String vRet = genSym.apply("dead.local." + id + ".ret");
                int randVal = random.nextInt(0x1000, 0xffff);
                snippet += "{int " + vRet + "=" + activeDeadMethodName + "(0x" + Integer.toHexString(randVal) + ",0x37);if(" + vRet + "==0xdead)throw new java.lang.Error();}";
            }
            edits.add(new Span(start + 1, start + 1, snippet, "edit"));
        }
    }

    public static void injectMethodDeadCode(CompilationUnitTree unit, MethodTree node, String source,
            SourcePositions positions, List<Span> edits, SplittableRandom random, String activeDeadMethodName) {
        injectMethodDeadCode(unit, node, source, positions, edits, random, activeDeadMethodName, null, new java.util.HashSet<>(), "hex");
    }

    public static void injectClassDeadCode(ClassTree clazz, CompilationUnitTree unit,
            SourcePositions positions, String source, List<Span> edits, String methodName,
            GeneratedSymbolRegistry generatedSymbols, SplittableRandom random, Set<String> occupied, String idStyle) {
        int end = (int) positions.getEndPosition(unit, clazz);
        if (end > 0) {
            int brace = source.lastIndexOf('}', end - 1);
            if (brace >= 0) {
                String pA = IdentifierGenerator.nextName(random, occupied, idStyle);
                String pB = IdentifierGenerator.nextName(random, occupied, idStyle);
                String vC = IdentifierGenerator.nextName(random, occupied, idStyle);
                String vI = IdentifierGenerator.nextName(random, occupied, idStyle);
                String vK = IdentifierGenerator.nextName(random, occupied, idStyle);
                String deadMethod = "private static int " + methodName + "(int " + pA + ",int " + pB + "){int " + vC + "=" + pA + "^" + pB + ";for(int " + vI + "=0;" + vI + "<16;" + vI + "++){" + vC + "=((" + vC + "<<5)|(" + vC + ">>>27))^" + pB + ";int " + vK + "=" + vC + "+0x9e3779b9;" + vC + "^=(" + vK + "<<6)+(" + vK + ">>>2);}return " + vC + ";}";
                edits.add(new Span(brace, brace, deadMethod, "edit"));
            }
        }
    }

    public static void injectClassDeadCode(ClassTree clazz, CompilationUnitTree unit,
            SourcePositions positions, String source, List<Span> edits, String methodName) {
        injectClassDeadCode(clazz, unit, positions, source, edits, methodName, null, new SplittableRandom(), new java.util.HashSet<>(), "hex");
    }
}
