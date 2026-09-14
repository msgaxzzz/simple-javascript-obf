package engine;

import com.sun.source.tree.*;
import com.sun.source.util.TreePath;
import java.util.List;
import java.util.SplittableRandom;

public final class NumberObfuscator {
    public static boolean isSafeContext(TreePath path, LiteralTree node) {
        TreePath p = path.getParentPath();
        while (p != null) {
            Tree leaf = p.getLeaf();
            if (leaf instanceof AnnotationTree) return false;
            if (leaf instanceof ClassTree && ((ClassTree) leaf).getKind() == Tree.Kind.ANNOTATION_TYPE) return false;
            if (leaf instanceof MethodTree && ((MethodTree) leaf).getDefaultValue() == node) return false;
            if (leaf instanceof CaseTree) {
                CaseTree ct = (CaseTree) leaf;
                try {
                    List<? extends ExpressionTree> exprs = ct.getExpressions();
                    if (exprs != null && exprs.contains(node)) return false;
                } catch (Throwable t) {
                    if (ct.getExpression() == node) return false;
                }
            }
            p = p.getParentPath();
        }
        return true;
    }

    public static String obfuscateInt(int val, SplittableRandom random) {
        int k = 1 + random.nextInt(0x7fff);
        String hexK = "0x" + Integer.toHexString(k);
        return "(((" + val + " ^ " + hexK + ") + (2 * (" + val + " & " + hexK + "))) - " + hexK + ")";
    }
}
