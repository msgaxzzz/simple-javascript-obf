package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import java.util.List;
import java.util.SplittableRandom;

public final class DeadCode {
    private static final String[] DEAD_TEMPLATES = new String[]{
        "{int _0xda$V=java.lang.System.identityHashCode(java.lang.System.out);if(_0xda$V==0){throw new java.lang.Error();}}",
        "{int _0xpt$V=java.lang.Thread.currentThread().getPriority();if(_0xpt$V<0||_0xpt$V>10){int _0xs$V=0;for(int _0xj$V=0;_0xj$V<8;_0xj$V++)_0xs$V=(_0xs$V^(_0xj$V*31));throw new java.lang.IllegalStateException(java.lang.String.valueOf(_0xs$V));}}",
        "{int _0xqa$V=java.lang.Runtime.getRuntime().availableProcessors();if(_0xqa$V<=0){throw new java.lang.AssertionError();}}",
        "{long _0xrt$V=java.lang.System.currentTimeMillis();if(_0xrt$V<1000000000000L){byte[] _0xbuf$V=new byte[16];for(int _0xk$V=0;_0xk$V<16;_0xk$V++)_0xbuf$V[_0xk$V]=(byte)(_0xk$V*7);throw new java.lang.RuntimeException(new java.lang.String(_0xbuf$V));}}"
    };

    public static void injectMethodDeadCode(CompilationUnitTree unit, MethodTree node, String source,
            SourcePositions positions, List<Span> edits, SplittableRandom random, String activeDeadMethodName) {
        if (node.getBody() == null || node.getName().contentEquals("<init>")) return;
        BlockTree body = node.getBody();
        int start = (int) positions.getStartPosition(unit, body);
        if (start >= 0 && source.charAt(start) == '{') {
            String id = Integer.toHexString(random.nextInt(0x1000, 0xffff));
            String snippet = DEAD_TEMPLATES[random.nextInt(DEAD_TEMPLATES.length)].replace("$V", id);
            if (activeDeadMethodName != null) {
                snippet += "{int _0xdr" + id + "=" + activeDeadMethodName + "(0x" + id + ",0x37);if(_0xdr" + id + "==0xdead)throw new java.lang.Error();}";
            }
            edits.add(new Span(start + 1, start + 1, snippet, "edit"));
        }
    }

    public static void injectClassDeadCode(ClassTree clazz, CompilationUnitTree unit,
            SourcePositions positions, String source, List<Span> edits, String methodName) {
        int end = (int) positions.getEndPosition(unit, clazz);
        if (end > 0) {
            int brace = source.lastIndexOf('}', end - 1);
            if (brace >= 0) {
                String deadMethod = "private static int " + methodName + "(int _0xa,int _0xb){int _0xc=_0xa^_0xb;for(int _0xi=0;_0xi<16;_0xi++){_0xc=((_0xc<<5)|(_0xc>>>27))^_0xb;int _0xk=_0xc+0x9e3779b9;_0xc^=(_0xk<<6)+(_0xk>>>2);}return _0xc;}";
                edits.add(new Span(brace, brace, deadMethod, "edit"));
            }
        }
    }
}