#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ghost LLM - Local Whisper Transcription
Copyright (c) 2026 Ghost LLM by haukerathjen-ai
Licensed under the GNU General Public License v3.0

Uses faster-whisper for efficient local transcription with GPU/CPU support

SIMPLIFIED VERSION: DLLs are now co-located with this script.
Windows automatically finds DLLs in the same directory as the executable.
No complex ctypes preloading needed.
"""

import sys
import json
import os
from pathlib import Path

# CRITICAL: Disable stdout buffering to ensure JSON output before CUDA crash
# Without this, the JSON might be buffered and lost when CUDA cleanup crashes
sys.stdout = open(sys.stdout.fileno(), mode='w', buffering=1, encoding='utf-8', closefd=False)

# SIMPLE CUDA SETUP: Just add script directory to PATH
# DLLs (cublas64_11.dll, cublasLt64_11.dll, cudnn64_9.dll, etc.) 
# are now physically copied to this script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.environ['PATH'] = script_dir + os.pathsep + os.environ.get('PATH', '')

# Also use add_dll_directory for Python 3.8+
if hasattr(os, 'add_dll_directory'):
    try:
        os.add_dll_directory(script_dir)
        print(f"[CUDA] ✅ DLL directory set: {script_dir}", file=sys.stderr)
    except Exception as e:
        print(f"[CUDA] ⚠️ Could not add DLL directory: {e}", file=sys.stderr)

def check_gpu():
    """Check if CUDA GPU is available with VRAM info"""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            vram_total = torch.cuda.get_device_properties(0).total_memory / (1024**3)  # GB
            return True, gpu_name, vram_total
        return False, None, 0
    except ImportError:
        # torch not installed, no GPU
        return False, None, 0
    except Exception as e:
        # CUDA initialization failed
        print(f"[CUDA] ⚠️ GPU check failed: {e}", file=sys.stderr)
        return False, None, 0

def transcribe_audio(audio_path, model_size='large-v3', language='de', cpu_threads=8):
    """
    Transcribe audio file using faster-whisper
    
    Args:
        audio_path: Path to WAV file (16kHz, mono, 16-bit)
        model_size: Model size (tiny, base, small, medium, large, large-v3)
        language: Language code (de for German)
        cpu_threads: Number of CPU threads to use
    
    Returns:
        dict with transcription result and metadata
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        # Silent fallback - no error message needed
        print("[Whisper Local] ☁️ Cloud-Modus aktiv (faster-whisper nicht installiert)", file=sys.stderr)
        return {
            'success': False,
            'error': 'faster-whisper not installed',
            'fallback_to_cloud': True
        }
    except OSError as e:
        # DLL loading error (common on Windows with CUDA issues)
        error_str = str(e)
        if 'DLL' in error_str or 'library' in error_str:
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (CUDA DLL Fehler)", file=sys.stderr)
            print(f"[Whisper Local] Details: {error_str}", file=sys.stderr)
        else:
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (Import-Fehler: {error_str})", file=sys.stderr)
        return {
            'success': False,
            'error': f'Import error: {error_str}',
            'fallback_to_cloud': True
        }
    except Exception as e:
        # Any other import error
        print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (Import-Fehler: {str(e)})", file=sys.stderr)
        return {
            'success': False,
            'error': f'Import error: {str(e)}',
            'fallback_to_cloud': True
        }
    
    # Check if audio file exists
    if not os.path.exists(audio_path):
        return {
            'success': False,
            'error': f'Audio file not found: {audio_path}',
            'fallback_to_cloud': False
        }
    
    try:
        # Check GPU availability with VRAM info
        has_gpu, gpu_name, vram_total = check_gpu()
        device = "cuda" if has_gpu else "cpu"
        
        # STABILITY FIX: Always use int8 for maximum stability
        # int8 is extremely stable and reduces VRAM pressure on RTX 2060 SUPER
        # This avoids memory corruption issues during CUDA initialization
        compute_type = "int8"
        
        # Log GPU status with elegant formatting
        if has_gpu:
            print(f"[Whisper Local] 🚀 GPU: {gpu_name} ({vram_total:.1f}GB VRAM)", file=sys.stderr)
            print(f"[Whisper Local] ⚡ Compute Type: {compute_type} (Stability Mode)", file=sys.stderr)
        else:
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (keine GPU gefunden)", file=sys.stderr)
            return {
                'success': False,
                'error': 'No GPU available',
                'fallback_to_cloud': True
            }
        
        # Initialize model - Add special message for large-v3
        if model_size == 'large-v3':
            print(f"[Whisper Local] 📥 Lade Large-v3 Modell (High Precision) - Dies kann einen Moment dauern...", file=sys.stderr)
        else:
            print(f"[Whisper Local] Loading {model_size} model...", file=sys.stderr)
        model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
            cpu_threads=cpu_threads if device == "cpu" else 0,
            num_workers=1
        )
        print(f"[Whisper Local] Model loaded successfully", file=sys.stderr)
        
        # Transcribe
        print(f"[Whisper Local] Starting transcription...", file=sys.stderr)
        segments, info = model.transcribe(
            audio_path,
            language=language,
            beam_size=5,  # Maximum precision: checks 5 paths for sentence completion
            best_of=5,    # Maximum precision: generates 5 candidates
            temperature=0.2,  # Changed from 0.0 - allows more flexibility in transcription
            vad_filter=False,  # Disable VAD - was filtering out too much audio
            word_timestamps=False,  # Keep disabled for speed
        )
        
        # Collect all segments with improved logging
        transcription_text = ""
        segment_list = []
        segment_count = 0
        
        for segment in segments:
            segment_count += 1
            segment_text = segment.text.strip()
            
            # Log each segment for debugging
            print(f"[Whisper Local] Segment {segment_count}: [{segment.start:.2f}s - {segment.end:.2f}s] \"{segment_text}\"", file=sys.stderr)
            
            # Add segment text with space separator
            if segment_text:
                transcription_text += segment_text + " "
                segment_list.append({
                    'start': segment.start,
                    'end': segment.end,
                    'text': segment_text
                })
        
        # Clean up text (remove extra whitespace)
        transcription_text = transcription_text.strip()
        
        print(f"[Whisper Local] Total segments collected: {segment_count}", file=sys.stderr)
        print(f"[Whisper Local] Transcription text length: {len(transcription_text)} characters", file=sys.stderr)
        
        print(f"[Whisper Local] Transcription completed", file=sys.stderr)
        print(f"[Whisper Local] Detected language: {info.language} (probability: {info.language_probability:.2%})", file=sys.stderr)
        print(f"[Whisper Local] Duration: {info.duration:.2f}s", file=sys.stderr)
        
        # Build result BEFORE any cleanup
        result = {
            'success': True,
            'text': transcription_text,
            'segments': segment_list,
            'language': info.language,
            'language_probability': info.language_probability,
            'duration': info.duration,
            'device': device,
            'gpu_name': gpu_name if has_gpu else None,
            'model_size': model_size,
            'fallback_to_cloud': False
        }
        
        # NUCLEAR: Write JSON to file IMMEDIATELY before any CUDA cleanup
        # The CUDA cleanup can crash - so we must save results first!
        result_file = audio_path.replace('.wav', '.json')
        json_output = json.dumps(result, ensure_ascii=False)
        
        try:
            with open(result_file, 'w', encoding='utf-8') as f:
                f.write(json_output)
                f.flush()
                os.fsync(f.fileno())
            print(f"[Whisper Local] ✅ Result saved to: {result_file}", file=sys.stderr)
        except Exception as e:
            print(f"[Whisper Local] ⚠️ Could not save result file: {e}", file=sys.stderr)
        
        # Also write to stdout (may or may not work)
        print(json_output)
        sys.stdout.flush()
        sys.stderr.flush()
        
        # NOW do CUDA cleanup (may crash - but result is already saved!)
        try:
            del model
        except:
            pass
        try:
            import torch
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        except:
            pass
        
        # Exit immediately
        os._exit(0)
        
    except Exception as e:
        error_msg = str(e)
        
        # Silent fallback for common issues
        if 'cuda' in error_msg.lower() or 'gpu' in error_msg.lower():
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (GPU-Fehler)", file=sys.stderr)
        elif 'download' in error_msg.lower() or 'http' in error_msg.lower():
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (Modell-Download fehlgeschlagen)", file=sys.stderr)
        elif 'memory' in error_msg.lower():
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (Nicht genug VRAM)", file=sys.stderr)
        else:
            print(f"[Whisper Local] ☁️ Cloud-Modus aktiv ({error_msg})", file=sys.stderr)
        
        return {
            'success': False,
            'error': error_msg,
            'fallback_to_cloud': True
        }

def main():
    """Main entry point - wrapped in try-except to ensure JSON output even on crash"""
    result_file = None
    
    try:
        if len(sys.argv) < 2:
            result = {
                'success': False,
                'error': 'Usage: whisper_local.py <audio_file> [model_size] [language] [cpu_threads]',
                'fallback_to_cloud': False
            }
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(1)
        
        audio_path = sys.argv[1]
        model_size = sys.argv[2] if len(sys.argv) > 2 else 'large-v3'
        language = sys.argv[3] if len(sys.argv) > 3 else 'de'
        cpu_threads = int(sys.argv[4]) if len(sys.argv) > 4 else 8
        
        # Create result file path (same as audio but with .json extension)
        result_file = audio_path.replace('.wav', '.json')
        
        # Transcribe
        result = transcribe_audio(audio_path, model_size, language, cpu_threads)
        
        # NUCLEAR OPTION: Write JSON to FILE instead of stdout
        # Windows loses stdout when process crashes, but file writes are atomic
        json_output = json.dumps(result, ensure_ascii=False)
        
        # Write to result file FIRST (most reliable)
        with open(result_file, 'w', encoding='utf-8') as f:
            f.write(json_output)
            f.flush()
            os.fsync(f.fileno())  # Force write to disk
        
        print(f"[Whisper Local] Result written to: {result_file}", file=sys.stderr)
        
        # Also try stdout (may or may not work)
        print(json_output)
        sys.stdout.flush()
        sys.stderr.flush()
        
        # CRITICAL: Use os._exit() instead of sys.exit() to avoid Python cleanup
        os._exit(0)
        
    except Exception as e:
        # Catastrophic error - ensure we always output valid JSON
        print(f"[Whisper Local] ☁️ Cloud-Modus aktiv (Kritischer Fehler: {str(e)})", file=sys.stderr)
        result = {
            'success': False,
            'error': f'Critical error: {str(e)}',
            'fallback_to_cloud': True
        }
        json_output = json.dumps(result, ensure_ascii=False)
        
        # Try to write to file if we have the path
        if result_file:
            try:
                with open(result_file, 'w', encoding='utf-8') as f:
                    f.write(json_output)
                    f.flush()
                    os.fsync(f.fileno())
            except:
                pass
        
        print(json_output)
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(1)

if __name__ == '__main__':
    main()
