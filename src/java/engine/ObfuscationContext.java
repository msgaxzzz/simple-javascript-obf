package engine;

import javax.lang.model.element.Element;
import java.util.*;

/**
 * Top-level context unifying all registries, pipeline states, and cross-module integrity validation.
 */
public final class ObfuscationContext {

    public enum Phase {
        INIT,
        PARSED,
        RENAMED,
        CONSTANTS_OBFUSCATED,
        CFG_FLATTENED,
        DEAD_CODE_INJECTED,
        VM_VIRTUALIZED,
        EMITTED
    }

    public static final class TransformState {
        private Phase phase = Phase.INIT;
        private int sourceVersion = 1;
        private int symbolVersion = 0;
        private int cfgVersion = 0;
        private int vmVersion = 0;

        public Phase getPhase() { return phase; }
        public void setPhase(Phase phase) { this.phase = phase; }

        public int getSourceVersion() { return sourceVersion; }
        public void bumpSourceVersion() { this.sourceVersion++; }

        public int getSymbolVersion() { return symbolVersion; }
        public void bumpSymbolVersion() { this.symbolVersion++; }

        public int getCfgVersion() { return cfgVersion; }
        public void bumpCfgVersion() { this.cfgVersion++; }

        public int getVmVersion() { return vmVersion; }
        public void bumpVmVersion() { this.vmVersion++; }

        @Override
        public String toString() {
            return "TransformState[phase=" + phase + ", src=" + sourceVersion + ", sym=" + symbolVersion
                    + ", cfg=" + cfgVersion + ", vm=" + vmVersion + "]";
        }
    }

    private final SymbolRenamingRegistry symbolRegistry;
    private final GeneratedSymbolRegistry generatedSymbols;
    private final VMRegistry vmRegistry;
    private final ConstantRegistry constantRegistry;
    private final TransformState state;
    private final Set<String> registeredDeadCodeMethods = new HashSet<>();

    public ObfuscationContext(SymbolRenamer.OverrideManager overrideManager) {
        this.symbolRegistry = new SymbolRenamingRegistry(overrideManager);
        this.generatedSymbols = new GeneratedSymbolRegistry();
        this.vmRegistry = new VMRegistry();
        this.constantRegistry = new ConstantRegistry();
        this.state = new TransformState();
    }

    public SymbolRenamingRegistry getSymbolRegistry() {
        return symbolRegistry;
    }

    public GeneratedSymbolRegistry getGeneratedSymbols() {
        return generatedSymbols;
    }

    public VMRegistry getVmRegistry() {
        return vmRegistry;
    }

    public ConstantRegistry getConstantRegistry() {
        return constantRegistry;
    }

    public TransformState getState() {
        return state;
    }

    public void registerDeadCodeMethod(String methodName) {
        if (methodName != null && !methodName.isEmpty()) {
            registeredDeadCodeMethods.add(methodName);
        }
    }

    public boolean isDeadCodeMethodRegistered(String methodName) {
        return registeredDeadCodeMethods.contains(methodName);
    }

    /**
     * Performs comprehensive pipeline integrity validation.
     * Throws ObfuscationConsistencyException if any invariant is violated.
     */
    public void assertConsistent() {
        // 1. Validate Symbol Registry
        Map<Element, SymbolRenamingRegistry.Entry> symMap = symbolRegistry.snapshot();
        for (Map.Entry<Element, SymbolRenamingRegistry.Entry> entry : symMap.entrySet()) {
            SymbolRenamingRegistry.Entry val = entry.getValue();
            if (val == null || val.getRenamedName() == null || val.getRenamedName().trim().isEmpty()) {
                throw new ObfuscationConsistencyException(
                        "SymbolRenamingRegistry contains unmapped or empty renamed symbol for: " + (val != null ? val.getOriginalName() : entry.getKey())
                );
            }
        }

        // 2. Validate Override Families
        SymbolRenamer.OverrideManager om = symbolRegistry.getOverrideManager();
        if (om != null) {
            for (Element el : symMap.keySet()) {
                Set<Element> family = om.getFamily(el);
                if (family != null && family.size() > 1) {
                    String targetName = symbolRegistry.get(el);
                    if (targetName != null) {
                        for (Element member : family) {
                            String memberName = symbolRegistry.get(member);
                            if (memberName != null && !targetName.equals(memberName)) {
                                throw new ObfuscationConsistencyException(
                                        "Override family naming inconsistency: element '" + el + "' mapped to '" + targetName
                                                + "' but family member '" + member + "' mapped to '" + memberName + "'"
                                );
                            }
                        }
                    }
                }
            }
        }

        // 3. Validate Generated Symbols
        for (Map.Entry<String, String> gen : generatedSymbols.snapshot().entrySet()) {
            if (gen.getValue() == null || gen.getValue().trim().isEmpty()) {
                throw new ObfuscationConsistencyException("Generated symbol key '" + gen.getKey() + "' has null or empty identifier");
            }
        }

        // 4. Validate VM Registry
        for (VMRegistry.SymbolId sid : vmRegistry.getAllSymbols()) {
            if (sid.getVmRegister() < 0) {
                throw new ObfuscationConsistencyException("VM register allocation invariant violated: " + sid);
            }
        }
    }
}
