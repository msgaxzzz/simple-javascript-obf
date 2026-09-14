package engine;

import java.util.*;
import javax.lang.model.element.*;
import javax.lang.model.type.TypeMirror;
import javax.lang.model.util.Elements;
import javax.lang.model.util.Types;

public final class SymbolRenamer {
    public static final class OverrideManager {
        private final Map<Element, Element> parent = new HashMap<>();
        private final Set<Element> cannotRenameRoots = new HashSet<>();

        public Element find(Element e) {
            Element p = parent.get(e);
            if (p == null || p == e) return e;
            Element r = find(p);
            parent.put(e, r);
            return r;
        }

        public void union(Element a, Element b) {
            Element ra = find(a);
            Element rb = find(b);
            if (ra != rb) {
                parent.put(ra, rb);
                if (cannotRenameRoots.contains(ra)) cannotRenameRoots.add(rb);
            }
        }

        public void markCannotRename(Element e) {
            cannotRenameRoots.add(find(e));
        }

        public boolean canRename(Element e) {
            return !cannotRenameRoots.contains(find(e));
        }
    }

    public static OverrideManager buildOverrideManager(Set<Element> localMethods, Elements elements, Types types) {
        OverrideManager manager = new OverrideManager();
        for (Element elem : localMethods) {
            if (elem instanceof ExecutableElement) {
                ExecutableElement method = (ExecutableElement) elem;
                Element owner = method.getEnclosingElement();
                if (owner instanceof TypeElement) {
                    TypeElement type = (TypeElement) owner;
                    List<TypeElement> supertypes = new ArrayList<>();
                    collectSupertypes(type, types, supertypes);
                    for (TypeElement st : supertypes) {
                        for (Element member : st.getEnclosedElements()) {
                            if (member instanceof ExecutableElement) {
                                ExecutableElement superMethod = (ExecutableElement) member;
                                if (elements.overrides(method, superMethod, type)) {
                                    if (localMethods.contains(superMethod)) {
                                        manager.union(method, superMethod);
                                    } else {
                                        manager.markCannotRename(method);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return manager;
    }

    private static void collectSupertypes(TypeElement type, Types types, List<TypeElement> result) {
        for (TypeMirror tm : types.directSupertypes(type.asType())) {
            Element elem = types.asElement(tm);
            if (elem instanceof TypeElement) {
                TypeElement ste = (TypeElement) elem;
                result.add(ste);
                collectSupertypes(ste, types, result);
            }
        }
    }

    public static boolean canRename(Element element, boolean renameMembers) {
        if (element == null) return false;
        String kind = element.getKind().name();
        if (Arrays.asList("LOCAL_VARIABLE", "PARAMETER", "EXCEPTION_PARAMETER",
                "RESOURCE_VARIABLE", "BINDING_VARIABLE").contains(kind)) {
            Element owner = element.getEnclosingElement();
            if (kind.equals("PARAMETER") && owner != null && owner.getKind() == ElementKind.CONSTRUCTOR) {
                Element type = owner.getEnclosingElement();
                if (type != null && type.getKind().name().equals("RECORD")) return false;
            }
            return true;
        }
        if (renameMembers) {
            Set<Modifier> mods = element.getModifiers();
            if (mods.contains(Modifier.PRIVATE) || (!mods.contains(Modifier.PUBLIC) && !mods.contains(Modifier.PROTECTED))) {
                if (kind.equals("FIELD")) {
                    return !element.getSimpleName().contentEquals("serialVersionUID");
                }
                if (kind.equals("METHOD")) {
                    String name = element.getSimpleName().toString();
                    return !name.equals("<init>") && !name.equals("<clinit>") && !name.equals("main");
                }
            }
        }
        return false;
    }
}