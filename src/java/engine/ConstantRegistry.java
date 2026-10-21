package engine;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Tracks obfuscated and masked constants across the pipeline.
 */
public final class ConstantRegistry {

    private final Map<Integer, String> integerMasks = new LinkedHashMap<>();
    private final Map<Long, String> longMasks = new LinkedHashMap<>();
    private final Map<String, String> encryptedStrings = new LinkedHashMap<>();

    public synchronized void recordIntMask(int value, String expression) {
        integerMasks.put(value, expression);
    }

    public synchronized void recordLongMask(long value, String expression) {
        longMasks.put(value, expression);
    }

    public synchronized void recordEncryptedString(String raw, String encryptedCall) {
        encryptedStrings.put(raw, encryptedCall);
    }

    public synchronized Map<Integer, String> getIntegerMasks() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(integerMasks));
    }

    public synchronized Map<Long, String> getLongMasks() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(longMasks));
    }

    public synchronized Map<String, String> getEncryptedStrings() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(encryptedStrings));
    }
}
