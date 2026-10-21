package engine;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;

/**
 * Central registry for synthetic/generated identifiers across obfuscation phases.
 * Prevents modules from inventing uncoordinated ad-hoc identifier strings.
 */
public final class GeneratedSymbolRegistry {

    private final Map<String, String> symbols = new LinkedHashMap<>();

    public synchronized String create(String logicalKey, Supplier<String> generator) {
        Objects.requireNonNull(logicalKey, "logicalKey must not be null");
        Objects.requireNonNull(generator, "generator must not be null");

        if (symbols.containsKey(logicalKey)) {
            throw new ObfuscationConsistencyException("Duplicate generated symbol key: '" + logicalKey + "' already mapped to '" + symbols.get(logicalKey) + "'");
        }
        String generated = generator.get();
        if (generated == null || generated.trim().isEmpty()) {
            throw new ObfuscationConsistencyException("Generated symbol name for '" + logicalKey + "' was empty or null");
        }
        symbols.put(logicalKey, generated);
        return generated;
    }

    public synchronized String require(String logicalKey) {
        Objects.requireNonNull(logicalKey, "logicalKey must not be null");
        String name = symbols.get(logicalKey);
        if (name == null) {
            throw new ObfuscationConsistencyException("Required generated symbol missing for logical key: '" + logicalKey + "'");
        }
        return name;
    }

    public synchronized String get(String logicalKey) {
        if (logicalKey == null) return null;
        return symbols.get(logicalKey);
    }

    public synchronized String getOrCreate(String logicalKey, Supplier<String> generator) {
        Objects.requireNonNull(logicalKey, "logicalKey must not be null");
        String existing = symbols.get(logicalKey);
        if (existing != null) {
            return existing;
        }
        return create(logicalKey, generator);
    }

    public synchronized boolean contains(String logicalKey) {
        return logicalKey != null && symbols.containsKey(logicalKey);
    }

    public synchronized Map<String, String> snapshot() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(symbols));
    }
}
