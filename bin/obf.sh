#!/usr/bin/env bash
set -euo pipefail

prompt() {
  local text="$1"
  local value=""
  read -r -p "$text" value
  printf "%s" "$value"
}

prompt_yes_no() {
  local text="$1"
  local value=""
  read -r -p "$text" value
  case "${value}" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

now_ms() {
  date +%s%3N
}

format_duration() {
  local ms="$1"
  awk -v ms="${ms}" 'BEGIN { printf "%.3f", ms / 1000 }'
}

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

input_path=$(prompt "Enter a JS file or directory path: ")
if [[ -z "${input_path}" ]]; then
  echo "No input path provided." >&2
  exit 1
fi

input_kind=""
if [[ -f "${input_path}" ]]; then
  input_kind="file"
elif [[ -d "${input_path}" ]]; then
  input_kind="dir"
else
  echo "Input path not found: ${input_path}" >&2
  exit 1
fi

abs_input=$(readlink -f "${input_path}")
if [[ "${input_kind}" == "dir" ]]; then
  input_dir="${abs_input}"
else
  input_dir=$(dirname "${abs_input}")
fi

echo "Input directory: ${input_dir}"
if [[ "${input_kind}" == "file" ]]; then
  output_dir=$(prompt "Output directory (default: ${input_dir}, use . for current dir): ")
  if [[ -z "${output_dir}" ]]; then
    output_dir="${input_dir}"
  fi
  output_dir=$(readlink -f "${output_dir}")
  mkdir -p "${output_dir}"
else
  output_dir="${input_dir}"
  if ! prompt_yes_no "This will overwrite all JS files in the directory. Continue? [y/N]: "; then
    echo "Cancelled." >&2
    exit 1
  fi
fi
echo "Output directory: ${output_dir}"

max_jobs=1
if [[ "${input_kind}" == "dir" ]]; then
  max_jobs=$(prompt "Concurrency (default 1): ")
  if [[ -z "${max_jobs}" ]]; then
    max_jobs=1
  fi
  if ! [[ "${max_jobs}" =~ ^[0-9]+$ ]] || [[ "${max_jobs}" -lt 1 ]]; then
    echo "Concurrency must be a positive integer." >&2
    exit 1
  fi
fi

preset=$(prompt "Preset strength (high/balanced/low, default high): ")
if [[ -z "${preset}" ]]; then
  preset="high"
fi

enable_rename=true
enable_strings=true
encode_object_keys=true
encode_jsx_attrs=true
encode_template_chunks=true
enable_cff=true
enable_cff_downlevel=false
enable_dead=true
enable_vm=false
enable_anti_hook=false
enable_anti_hook_lock=false

if ! prompt_yes_no "Enable variable renaming? [y/N]: "; then
  enable_rename=false
fi
if ! prompt_yes_no "Enable string encryption? [y/N]: "; then
  enable_strings=false
fi
if ${enable_strings}; then
  if prompt_yes_no "Skip encoding object literal keys? [y/N]: "; then
    encode_object_keys=false
  fi
  if prompt_yes_no "Skip encoding JSX attribute string values? [y/N]: "; then
    encode_jsx_attrs=false
  fi
  if prompt_yes_no "Skip encoding template literal static chunks? [y/N]: "; then
    encode_template_chunks=false
  fi
fi
if ! prompt_yes_no "Enable control-flow flattening? [y/N]: "; then
  enable_cff=false
fi
if ${enable_cff}; then
  if prompt_yes_no "Downlevel let/const to var for CFF? [y/N]: "; then
    enable_cff_downlevel=true
  fi
fi
if ! prompt_yes_no "Enable dead-code injection? [y/N]: "; then
  enable_dead=false
fi
if prompt_yes_no "Enable VM virtualization? [y/N]: "; then
  enable_vm=true
fi
if prompt_yes_no "Enable anti-hook runtime guard? [y/N]: "; then
  enable_anti_hook=true
  if prompt_yes_no "Freeze built-in prototype chains (anti-hook-lock)? [y/N]: "; then
    enable_anti_hook_lock=true
  fi
fi

vm_include=""
if ${enable_vm}; then
  vm_include=$(prompt "Only virtualize function names (comma-separated, optional): ")
fi

seed=$(prompt "PRNG seed (optional): ")
enable_sourcemap=false
enable_compact=false
enable_minify=true
enable_beautify=false
if prompt_yes_no "Generate source map? [y/N]: "; then
  enable_sourcemap=true
fi
if prompt_yes_no "Use compact output? [y/N]: "; then
  enable_compact=true
fi
if prompt_yes_no "Skip Terser minify? [y/N]: "; then
  enable_minify=false
fi
if ${enable_minify}; then
  if prompt_yes_no "Beautify output (multi-line)? [y/N]: "; then
    enable_beautify=true
  fi
fi

common_args=(--preset "${preset}")

if ! ${enable_rename}; then
  common_args+=(--no-rename)
fi
if ! ${enable_strings}; then
  common_args+=(--no-strings)
else
  if ! ${encode_object_keys}; then
    common_args+=(--no-strings-object-keys)
  fi
  if ! ${encode_jsx_attrs}; then
    common_args+=(--no-strings-jsx-attrs)
  fi
  if ! ${encode_template_chunks}; then
    common_args+=(--no-strings-template-chunks)
  fi
fi
if ! ${enable_cff}; then
  common_args+=(--no-cff)
elif ${enable_cff_downlevel}; then
  common_args+=(--cff-downlevel)
fi
if ! ${enable_dead}; then
  common_args+=(--no-dead)
fi
if ${enable_vm}; then
  common_args+=(--vm)
  if [[ -n "${vm_include}" ]]; then
    common_args+=(--vm-include "${vm_include}")
  fi
fi
if ${enable_anti_hook_lock}; then
  common_args+=(--anti-hook-lock)
elif ${enable_anti_hook}; then
  common_args+=(--anti-hook)
fi
if [[ -n "${seed}" ]]; then
  common_args+=(--seed "${seed}")
fi
if ${enable_sourcemap}; then
  common_args+=(--sourcemap)
fi
if ${enable_compact}; then
  common_args+=(--compact)
fi
if ! ${enable_minify}; then
  common_args+=(--no-minify)
fi
if ${enable_beautify}; then
  common_args+=(--beautify)
fi

if [[ "${input_kind}" == "file" ]]; then
  base_name=$(basename "${abs_input}")
  base_no_ext="${base_name%.*}"
  output_path="${output_dir}/${base_no_ext}.obf.js"
  cmd=(node "${root_dir}/bin/js-obf" "${abs_input}" -o "${output_path}" "${common_args[@]}")
  total_start_ms=$(now_ms)
  start_ms=$(now_ms)
  echo "Run: ${cmd[*]}"
  "${cmd[@]}"
  end_ms=$(now_ms)
  duration_ms=$((end_ms - start_ms))
  duration_sec=$(format_duration "${duration_ms}")
  echo "Done: ${output_path} (${duration_sec}s)"
  total_end_ms=$(now_ms)
  total_ms=$((total_end_ms - total_start_ms))
  total_sec=$(format_duration "${total_ms}")
  echo "Total time: ${total_sec}s"
else
  prune_paths=(
    -type d -name node_modules
    -o -type d -name node_packge
    -o -type d -name node_package
  )
  if [[ "${output_dir}" != "${input_dir}" && "${output_dir}" == "${input_dir}"/* ]]; then
    prune_paths+=(-o -path "${output_dir}")
  fi

  files=()
  while IFS= read -r -d '' file; do
    files+=("${file}")
  done < <(
    find "${input_dir}" \( "${prune_paths[@]}" \) -prune -o \
      -type f -name "*.js" ! -name "*.obf.js" -print0
  )

  if [[ ${#files[@]} -eq 0 ]]; then
    echo "No JS files found to obfuscate." >&2
    exit 1
  fi

  total_start_ms=$(now_ms)
  echo "Found ${#files[@]} JS files. Starting obfuscation..."
  failed=false
  run_file() {
    local file="$1"
    local rel_path="${file#${input_dir}/}"
    local output_path="${output_dir}/${rel_path}"
    mkdir -p "$(dirname "${output_path}")"
    local cmd=(node "${root_dir}/bin/js-obf" "${file}" -o "${output_path}" "${common_args[@]}")
    local start_ms
    local end_ms
    start_ms=$(now_ms)
    echo "Run: ${cmd[*]}"
    "${cmd[@]}"
    end_ms=$(now_ms)
    local duration_ms=$((end_ms - start_ms))
    local duration_sec
    duration_sec=$(format_duration "${duration_ms}")
    echo "Done: ${output_path} (${duration_sec}s)"
  }

  if [[ "${max_jobs}" -le 1 ]]; then
    for file in "${files[@]}"; do
      run_file "${file}"
    done
  else
    for file in "${files[@]}"; do
      run_file "${file}" &
      while (( $(jobs -pr | wc -l) >= max_jobs )); do
        if ! wait -n; then
          failed=true
        fi
      done
    done
    while (( $(jobs -pr | wc -l) > 0 )); do
      if ! wait -n; then
        failed=true
      fi
    done
    if ${failed}; then
      echo "Some files failed to obfuscate. Check the logs." >&2
      exit 1
    fi
  fi
  total_end_ms=$(now_ms)
  total_ms=$((total_end_ms - total_start_ms))
  total_sec=$(format_duration "${total_ms}")
  echo "All done: ${#files[@]} files in ${total_sec}s"
fi
