package engine;

import javax.lang.model.element.Element;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Shared registry binding variable identity (Element), obfuscated names, and VM registers.
 */
public final class VMRegistry {

    private static final AtomicInteger ID_SEQ = new AtomicInteger(1);

    public static final class SymbolId {
        private final int id;
        private final Element element;
        private final String originalName;
        private String renamedName;
        private int vmRegister;
        private String typeName;

        public SymbolId(Element element, String originalName, String renamedName, int vmRegister, String typeName) {
            this.id = ID_SEQ.getAndIncrement();
            this.element = element;
            this.originalName = originalName != null ? originalName : "";
            this.renamedName = renamedName != null ? renamedName : this.originalName;
            this.vmRegister = vmRegister;
            this.typeName = typeName != null ? typeName : "Object";
        }

        public int getId() { return id; }
        public Element getElement() { return element; }
        public String getOriginalName() { return originalName; }
        public String getRenamedName() { return renamedName; }
        public void setRenamedName(String renamedName) { this.renamedName = renamedName; }
        public int getVmRegister() { return vmRegister; }
        public void setVmRegister(int vmRegister) { this.vmRegister = vmRegister; }
        public String getTypeName() { return typeName; }
        public void setTypeName(String typeName) { this.typeName = typeName; }

        @Override
        public String toString() {
            return "SymbolId#" + id + "{" + originalName + " -> " + renamedName + ", reg=R" + vmRegister + "}";
        }
    }

    private final Map<Element, SymbolId> elementMap = new IdentityHashMap<>();
    private final Map<String, SymbolId> nameMap = new LinkedHashMap<>();
    private final List<SymbolId> allSymbols = new ArrayList<>();

    public synchronized SymbolId registerVar(Element element, String originalName, String renamedName, int reg, String type) {
        SymbolId sid = new SymbolId(element, originalName, renamedName, reg, type);
        if (element != null) {
            elementMap.put(element, sid);
        }
        if (originalName != null && !originalName.isEmpty()) {
            nameMap.put(originalName, sid);
        }
        if (renamedName != null && !renamedName.isEmpty()) {
            nameMap.put(renamedName, sid);
        }
        allSymbols.add(sid);
        return sid;
    }

    public synchronized SymbolId getSymbolId(Element element) {
        if (element == null) return null;
        return elementMap.get(element);
    }

    public synchronized SymbolId getSymbolIdByName(String name) {
        if (name == null) return null;
        return nameMap.get(name);
    }

    public synchronized Integer getRegister(Element element) {
        if (element == null) return null;
        SymbolId sid = elementMap.get(element);
        return sid != null ? sid.getVmRegister() : null;
    }

    public synchronized Integer getRegisterByName(String name) {
        if (name == null) return null;
        SymbolId sid = nameMap.get(name);
        return sid != null ? sid.getVmRegister() : null;
    }

    public synchronized Integer resolveReg(Element element, String nameFallback) {
        if (element != null) {
            SymbolId sid = elementMap.get(element);
            if (sid != null) return sid.getVmRegister();
        }
        if (nameFallback != null) {
            SymbolId sid = nameMap.get(nameFallback);
            if (sid != null) return sid.getVmRegister();
        }
        return null;
    }

    public synchronized List<SymbolId> getAllSymbols() {
        return Collections.unmodifiableList(new ArrayList<>(allSymbols));
    }
}
