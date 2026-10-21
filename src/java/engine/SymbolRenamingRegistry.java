package engine;

import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.function.Supplier;

public final class SymbolRenamingRegistry {

    public static final class Entry {
        private final Element element;
        private final String originalName;
        private String renamedName;

        public Entry(Element element) {
            this.element = element;
            String orig = null;
            if (element != null) {
                try {
                    orig = element.getSimpleName().toString();
                } catch (Throwable ignored) {}
            }
            this.originalName = orig != null ? orig : "";
        }

        public Element getElement() {
            return element;
        }

        public String getOriginalName() {
            return originalName;
        }

        public String getRenamedName() {
            return renamedName;
        }

        public void setRenamedName(String renamedName) {
            this.renamedName = renamedName;
        }

        @Override
        public String toString() {
            return originalName + " -> " + renamedName;
        }
    }

    private final Map<Element, Entry> entries = new IdentityHashMap<>();
    private final SymbolRenamer.OverrideManager overrideManager;

    public SymbolRenamingRegistry(SymbolRenamer.OverrideManager overrideManager) {
        this.overrideManager = overrideManager;
    }

    public SymbolRenamer.OverrideManager getOverrideManager() {
        return overrideManager;
    }

    private Element normalize(Element element) {
        if (element == null) return null;
        if (element instanceof ExecutableElement && overrideManager != null) {
            return overrideManager.find(element);
        }
        return element;
    }

    public void register(Element element, String newName) {
        if (element == null || newName == null) return;

        Element key = normalize(element);

        Entry entry = entries.get(key);
        if (entry == null) {
            entry = new Entry(key);
            entries.put(key, entry);
            entry.setRenamedName(newName);
        } else {
            String existing = entry.getRenamedName();
            if (existing != null && !existing.equals(newName)) {
                throw new ObfuscationConsistencyException(
                        "Symbol rename conflict for '" + entry.getOriginalName() + "': existing='" + existing + "', attempted='" + newName + "'"
                );
            }
            entry.setRenamedName(newName);
        }

        if (key != element) {
            Entry alias = entries.get(element);
            if (alias == null) {
                alias = new Entry(element);
                entries.put(element, alias);
                alias.setRenamedName(newName);
            } else {
                String existing = alias.getRenamedName();
                if (existing != null && !existing.equals(newName)) {
                    throw new ObfuscationConsistencyException(
                            "Symbol rename conflict for alias '" + alias.getOriginalName() + "': existing='" + existing + "', attempted='" + newName + "'"
                    );
                }
                alias.setRenamedName(newName);
            }
        }
    }

    public void registerFamily(Iterable<? extends Element> family, String newName) {
        if (family == null || newName == null) return;
        for (Element e : family) {
            register(e, newName);
        }
    }

    public String get(Element element) {
        if (element == null) return null;

        Element key = normalize(element);
        Entry entry = entries.get(key);

        return entry != null ? entry.getRenamedName() : null;
    }

    public String getOrOriginal(Element element) {
        if (element == null) return null;

        String renamed = get(element);
        if (renamed != null) {
            return renamed;
        }

        try {
            return element.getSimpleName().toString();
        } catch (Throwable ignored) {
            return "";
        }
    }

    public String getOrOriginal(Element element, String fallback) {
        if (element == null) return fallback;
        String renamed = get(element);
        if (renamed != null) return renamed;
        try {
            return element.getSimpleName().toString();
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    public String getOrRegister(Element element, Supplier<String> generator) {
        String existing = get(element);
        if (existing != null) {
            return existing;
        }
        String name = generator.get();
        register(element, name);
        return name;
    }

    public boolean contains(Element element) {
        return get(element) != null;
    }

    public Map<Element, Entry> snapshot() {
        return Collections.unmodifiableMap(new IdentityHashMap<>(entries));
    }
}
