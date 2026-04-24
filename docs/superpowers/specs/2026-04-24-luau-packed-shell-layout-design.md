# Luau Packed Shell Layout Design

**Date**

2026-04-24

**Status**

Approved in chat, pending written-spec review

## Goal

Re-layout the Luau packed shell so the key unpack/execute breakthrough point is not concentrated at the file head or tail.

The new layout should keep the current packed concealment and hard-project stability work, while redistributing the shell logic across the generated output in a lighter-touch way.

## User Intent

The user does not want a packed shell where:

- the head immediately exposes the loader selection path
- the tail immediately exposes the unpack/execute path

The user specifically chose **light dispersion**:

- only a small amount of shell logic should appear at the front
- some shell logic should appear later in the body
- the tail should remain low-signal
- avoid aggressive fragmentation that risks breaking the hard Luau project

## Non-Goals

This change does not aim to:

- redesign the payload encoding format again
- maximize obfuscation at any cost
- add another VM or another payload layer
- make the shell impossible to reverse

The goal is better information distribution, not a new cryptographic scheme.

## Current Problem

Even after recent improvements:

- the file head still reveals too much loader-related structure
- the file tail still provides a recognizable `payload + size + helper(...)` breakthrough point

This makes the shell easier to attack by scanning only the beginning or end of the file.

## Chosen Approach

Use a **three-zone light-dispersion shell layout**:

1. **Front zone**
   - keep only minimal shell primitives
   - avoid exposing a complete loader selection chain
   - avoid exposing a complete decode loop

2. **Middle zone**
   - place the decode primitive and the execution primitive in separate short blocks
   - do not keep the full decode/execute path as one contiguous region
   - let the shell require some navigation through the middle of the file

3. **Tail zone**
   - keep only payload-bearing data and a low-signal handoff call
   - avoid leaving a complete unpack/execute chain in the last screenful

## Architecture

### Front zone

The front should contain only:

- a minimal entry wrapper
- tiny string fragments or control primitives if needed
- no direct full loader path

### Middle zone

The middle should contain:

- one helper for decoding a payload block
- one helper for performing the execution handoff
- optional small state-routing logic

These pieces should be separated enough that the eye does not land on a single obvious unpacker block.

### Tail zone

The tail should contain:

- payload text
- payload size
- one low-signal helper invocation

The tail should not contain:

- a full decode loop
- a full concatenation-and-substring sequence
- a direct visible `loadstring` token

## Constraints

The shell must still satisfy all of these:

- hard-project output executes under `luau`
- no `sourceMappingURL` footer for packed hard-project output
- no `__obf_` loader identifiers
- no explicit numeric key table + reverse lookup map
- no direct visible `loadstring` token
- packed output remains under the current output-size ceiling for the hard project

## Testing

Keep using the packed shell regressions in [test/luau-vm.js](/root/project/test/luau-vm.js), especially the checks that reject:

- plaintext function bodies
- explicit numeric key tables
- direct visible `loadstring`
- straight-line decode tails

Verify with:

- `node test/generate-luau-hard-project.js`
- `luau dist/luau-hard-project.obf.lua`

## Files To Change

- [src/luau/index.js](/root/project/src/luau/index.js)
  - only the packed shell layout logic

## Recommendation

Implement the light-dispersion shell layout by keeping the head minimal, moving meaningful decode/execute helpers into the middle of the shell, and leaving only payload plus a low-signal handoff at the tail. This directly addresses the user’s “don’t put the breakthrough point all at the end or all at the front” requirement without taking on the risk of a much more fragmented loader.
