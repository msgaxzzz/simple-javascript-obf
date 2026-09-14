package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import java.util.List;

public final class AntiDebug {
    public static void injectStaticAntiDebug(ClassTree primaryClass, CompilationUnitTree unit,
            SourcePositions positions, String source, List<Span> edits) {
        if (primaryClass == null || primaryClass.getKind() != Tree.Kind.CLASS) return;
        int classEnd = (int) positions.getEndPosition(unit, primaryClass);
        int closeBrace = source.lastIndexOf('}', classEnd - 1);
        if (closeBrace >= 0) {
            String stub = "static{try{for(String _0xa:java.lang.management.ManagementFactory.getRuntimeMXBean().getInputArguments()){String _0xs=_0xa.toLowerCase();if(_0xs.contains(\"jdwp\")||_0xs.contains(\"xdebug\")){java.lang.Thread _0xth=new java.lang.Thread(()->{try{java.lang.Thread.sleep(80);java.lang.Runtime.getRuntime().halt(1);}catch(Throwable _0xe){}});_0xth.setDaemon(true);_0xth.start();}}}catch(Throwable _0xt){}}";
            edits.add(new Span(closeBrace, closeBrace, stub, "edit"));
        }
    }
}
