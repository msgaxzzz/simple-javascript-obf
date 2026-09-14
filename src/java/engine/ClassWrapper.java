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

        sb.append("class ").append(proxyName).append("{");
        sb.append("@SuppressWarnings(\"unchecked\") static <T extends Throwable> void _0xsneak(Throwable t) throws T { throw (T) t; }");
        sb.append("static Object _0xroute(int _0xid,Object[] _0xargs){");
        sb.append("try{return ").append(routerName).append("._0xdispatch(_0xid,_0xargs);}");
        sb.append("catch(Throwable _0xe){_0xsneak(_0xe);return null;}");
        sb.append("}}\n");

        sb.append("class ").append(routerName).append("{");
        sb.append("static Object _0xdispatch(int _0xid,Object[] _0xargs) throws Throwable {");
        sb.append("((java.util.function.Supplier<Boolean>)()->{").append(guardName).append("._0xverify();return Boolean.TRUE;}).get();");
        if (hasMain) {
            sb.append("if(_0xid==0){").append(workerName).append(".main((String[])_0xargs[0]);}");
        }
        sb.append("return null;");
        sb.append("}}\n");

        sb.append("class ").append(guardName).append("{");
        sb.append("static void _0xverify(){");
        sb.append("((java.lang.Runnable)()->{");
        sb.append("if(java.lang.Runtime.getRuntime().availableProcessors()<=0)throw new java.lang.Error();");
        sb.append("try{for(String _0xa:java.lang.management.ManagementFactory.getRuntimeMXBean().getInputArguments()){String _0xs=_0xa.toLowerCase();if(_0xs.contains(\"jdwp\")||_0xs.contains(\"xdebug\")){java.lang.Thread _0xth=new java.lang.Thread(()->{try{java.lang.Thread.sleep(80);java.lang.Runtime.getRuntime().halt(1);}catch(Throwable _0xe){}});_0xth.setDaemon(true);_0xth.start();}}}catch(Throwable _0xtt){}");
        sb.append("}).run();");
        sb.append("}}\n");

        sb.append("class ").append(stateName).append("{");
        sb.append("static final int _0xkey=0x").append(hex).append(";");
        sb.append("}\n");

        return sb.toString();
    }
}