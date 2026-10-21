package engine;

import com.sun.source.tree.*;
import com.sun.source.util.TreePath;
import java.nio.charset.StandardCharsets;
import java.util.*;

public final class StringCrypto {
    public static byte[] encryptEngine1(byte[] buf, int k) {
        byte[] o = new byte[buf.length];
        int s = k;
        for (int i = 0; i < buf.length; i++) {
            s = (s ^ (s << 13));
            s = (s ^ (s >>> 17));
            s = (s ^ (s << 5));
            int m = (s + i) & 0xff;
            o[i] = (byte) (((buf[i] ^ m) - (i & 7)));
        }
        return o;
    }

    public static byte[] encryptEngine2(byte[] buf, int k) {
        byte[] o = new byte[buf.length];
        int s = k;
        for (int i = 0; i < buf.length; i++) {
            s = (s * 1664525 + 1013904223);
            int m = (Integer.rotateLeft(s, i & 15)) & 0xff;
            o[i] = (byte) ((buf[i] ^ m) ^ 0x5a);
        }
        return o;
    }

    public static byte[] encryptEngine3(byte[] buf, int k) {
        byte[] o = new byte[buf.length];
        int s = (k ^ 0x6a09e667) * 31;
        for (int i = 0; i < buf.length; i++) {
            s = (s ^ (s << 7)) ^ (s >>> 9);
            int m = (s + 0x7f) & 0xff;
            int val = (buf[i] & 0xff);
            int swapped = ((val << 4) | (val >>> 4)) & 0xff;
            o[i] = (byte) (swapped ^ m);
        }
        return o;
    }

    public static String formatByteCall(String hostClass, String decName, String rawStr, int key, int scheme) {
        byte[] raw = rawStr.getBytes(StandardCharsets.UTF_8);
        byte[] enc;
        String actualDec;
        if (scheme == 2) {
            enc = encryptEngine3(raw, key);
            actualDec = decName + "3";
        } else if (scheme == 1) {
            enc = encryptEngine2(raw, key);
            actualDec = decName + "2";
        } else {
            enc = encryptEngine1(raw, key);
            actualDec = decName;
        }
        StringBuilder sb = new StringBuilder();
        if (hostClass != null && !hostClass.isEmpty()) sb.append(hostClass).append(".");
        sb.append(actualDec).append("(new byte[]{");
        for (int i = 0; i < enc.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(enc[i]);
        }
        sb.append("},0x").append(Integer.toHexString(key)).append(")");
        return sb.toString();
    }

    public static String encodedString(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            int c = value.charAt(i);
            if (c <= 255) {
                out.append('\\');
                out.append((char) ('0' + ((c >> 6) & 7)));
                out.append((char) ('0' + ((c >> 3) & 7)));
                out.append((char) ('0' + (c & 7)));
            } else {
                out.append('\\').append('u');
                String hex = Integer.toHexString(c);
                for (int pad = hex.length(); pad < 4; pad++) out.append('0');
                out.append(hex);
            }
        }
        return out.append('"').toString();
    }

    public static boolean isConstantContext(TreePath path, LiteralTree node) {
        TreePath p = path.getParentPath();
        while (p != null) {
            Tree leaf = p.getLeaf();
            if (leaf instanceof AnnotationTree) return true;
            if (leaf instanceof ClassTree && ((ClassTree) leaf).getKind() == Tree.Kind.ANNOTATION_TYPE) return true;
            if (leaf instanceof MethodTree && ((MethodTree) leaf).getDefaultValue() == node) return true;
            if (leaf instanceof CaseTree) {
                CaseTree ct = (CaseTree) leaf;
                try {
                    List<? extends ExpressionTree> exprs = ct.getExpressions();
                    if (exprs != null && exprs.contains(node)) return true;
                } catch (Throwable t) {
                    if (ct.getExpression() == node) return true;
                }
                return true;
            }
            if (leaf instanceof VariableTree) {
                VariableTree vt = (VariableTree) leaf;
                Set<javax.lang.model.element.Modifier> flags = vt.getModifiers().getFlags();
                boolean isFinal = flags.contains(javax.lang.model.element.Modifier.FINAL);
                TreePath grandParent = p.getParentPath();
                if (grandParent != null && grandParent.getLeaf() instanceof ClassTree) {
                    ClassTree ct = (ClassTree) grandParent.getLeaf();
                    if (ct.getKind() == Tree.Kind.INTERFACE) isFinal = true;
                }
                if (isFinal) {
                    Tree typeTree = vt.getType();
                    if (typeTree == null || typeTree.toString().contains("String") || typeTree.toString().equals("var")) {
                        return true;
                    }
                }
            }
            if (leaf instanceof MethodTree || leaf instanceof LambdaExpressionTree) {
                break;
            }
            p = p.getParentPath();
        }
        return false;
    }
    public static String decryptorSource(String decName, boolean includeEngine2, boolean includeEngine3) {
        String antiHook = "";
        StringBuilder sb = new StringBuilder();
        sb.append("static String ").append(decName).append("(byte[] _0xb,int _0xk){").append(antiHook).append("byte[] _0xo=new byte[_0xb.length];int _0xs=_0xk;for(int _0xi=0;_0xi<_0xb.length;_0xi++){_0xs=(_0xs^(_0xs<<13));_0xs=(_0xs^(_0xs>>>17));_0xs=(_0xs^(_0xs<<5));int _0xm=(_0xs+_0xi)&0xff;_0xo[_0xi]=(byte)((_0xb[_0xi]+(_0xi&7))^_0xm);}return new String(_0xo,java.nio.charset.StandardCharsets.UTF_8).intern();}");
        if (includeEngine2) {
            sb.append("static String ").append(decName).append("2(byte[] _0xb,int _0xk){").append(antiHook).append("byte[] _0xo=new byte[_0xb.length];int _0xs=_0xk;for(int _0xi=0;_0xi<_0xb.length;_0xi++){_0xs=(_0xs*1664525+1013904223);int _0xm=(java.lang.Integer.rotateLeft(_0xs,_0xi&15))&0xff;_0xo[_0xi]=(byte)((_0xb[_0xi]^0x5a)^_0xm);}return new String(_0xo,java.nio.charset.StandardCharsets.UTF_8).intern();}");
        }
        if (includeEngine3) {
            sb.append("static String ").append(decName).append("3(byte[] _0xb,int _0xk){").append(antiHook).append("byte[] _0xo=new byte[_0xb.length];int _0xs=(_0xk^0x6a09e667)*31;for(int _0xi=0;_0xi<_0xb.length;_0xi++){_0xs=(_0xs^(_0xs<<7))^(_0xs>>>9);int _0xm=(_0xs+0x7f)&0xff;int _0xv=(_0xb[_0xi]&0xff)^_0xm;_0xo[_0xi]=(byte)(((_0xv<<4)|(_0xv>>>4))&0xff);}return new String(_0xo,java.nio.charset.StandardCharsets.UTF_8).intern();}");
        }
        return sb.toString();
    }
}