package engine;

import com.sun.source.tree.*;
import com.sun.source.util.SourcePositions;
import java.util.*;

public final class ClassWrapper {
    public static String wrapAndSplit(String source, String hostClassName, boolean hasMain,
            String mainThrows, List<String> constructors, SplittableRandom random, boolean compact) {
        String hex = Integer.toHexString(random.nextInt(0x1000, 0xffff));
        String workerName = "_0xW" + hex;
        String proxyName = "_0xP" + hex;
        String guardName = "_0xG" + hex;
        String stateName = "_0xS" + hex;

        String routerName = "_0xQ" + hex;

        String workerSource = source.replaceFirst("\\bpublic\\s+(?:final\\s+|abstract\\s+)?class\\s+" + hostClassName + "\\b", "class " + workerName);
        if (workerSource.equals(source)) {
            workerSource = source.replaceFirst("\\b(?:final\\s+)?class\\s+" + hostClassName + "\\b", "class " + workerName);
        }
        workerSource = workerSource.replaceAll("(?<!\\bnew\\s)\\b(?:(?:public|protected|private)\\s+)?" + hostClassName + "\\s*\\(", "protected " + workerName + "(");
        workerSource = workerSource.replaceAll("\\bprivate\\s+(?!class\\b|interface\\b|enum\\b|record\\b)", "protected ");

        StringBuilder sb = new StringBuilder();
        sb.append(workerSource).append("\n");

        sb.append("public class ").append(hostClassName).append(" extends ").append(workerName).append(" {");
        for (String ctor : constructors) {
            sb.append(ctor);
        }
        if (hasMain) {
            sb.append("public static void main(String[] _0xargs)").append(mainThrows).append("{");
            sb.append(proxyName).append("._0xroute(0,new Object[]{_0xargs});");
            sb.append("}");
        } else {
            sb.append("static{try{").append(proxyName).append("._0xroute(-1,null);}catch(Throwable _0xe){}}");
        }
        sb.append("}\n");

        sb.append("class ").append(proxyName).append("{\n");
        sb.append("static Object _0xroute(int _0xid,Object[] _0xargs){\n");
        sb.append("try{return ").append(routerName).append("._0xdispatch(_0xid,_0xargs);}\n");
        sb.append("catch(Throwable _0xe){\n");
        sb.append("if(_0xe instanceof RuntimeException)throw (RuntimeException)_0xe;\n");
        sb.append("if(_0xe instanceof Error)throw (Error)_0xe;\n");
        sb.append("throw new RuntimeException(_0xe);\n");
        sb.append("}\n");
        sb.append("}}\n");

        sb.append("class ").append(routerName).append("{\n");
        sb.append("static Object _0xdispatch(int _0xid,Object[] _0xargs) throws Throwable {\n");
        sb.append(guardName).append("._0xverify();\n");
        if (hasMain) {
            sb.append("if(_0xid==0){").append(workerName).append(".main((String[])_0xargs[0]);}\n");
        }
        sb.append("return null;\n");
        sb.append("}}\n");

        sb.append("class ").append(guardName).append("{\n");
        sb.append("static void _0xverify(){\n");
        sb.append("if(java.lang.Runtime.getRuntime().availableProcessors()<=0)throw new java.lang.Error();\n");
        sb.append("long _0xt=java.lang.System.nanoTime();\n");
        sb.append("if(_0xt==0)throw new java.lang.Error();\n");
        sb.append("try{\n");
        sb.append("Class<?> _0xdbg=Class.forName(\"android.os.Debug\");\n");
        sb.append("java.lang.reflect.Method _0xm=_0xdbg.getMethod(\"isDebuggerConnected\");\n");
        sb.append("if(Boolean.TRUE.equals(_0xm.invoke(null))){java.lang.Runtime.getRuntime().halt(1);}\n");
        sb.append("}catch(Throwable _0xign){}\n");
        sb.append("}}\n");

        sb.append("class ").append(stateName).append("{");
        sb.append("static final int _0xkey=0x").append(hex).append(";");
        sb.append("}\n");

        return sb.toString();
    }
}