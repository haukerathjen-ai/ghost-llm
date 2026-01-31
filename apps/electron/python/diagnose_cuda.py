#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ghost LLM - CUDA Diagnostic Tool
Helps identify and fix CUDA DLL issues on Windows

This script checks:
1. Python version and availability
2. PyTorch installation and CUDA support
3. faster-whisper installation
4. CUDA DLL paths and availability
5. GPU detection
"""

import sys
import os

def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def check_python():
    """Check Python version"""
    print_section("1. Python Version")
    print(f"✅ Python {sys.version}")
    print(f"✅ Executable: {sys.executable}")

def check_torch():
    """Check PyTorch installation"""
    print_section("2. PyTorch Installation")
    try:
        import torch
        print(f"✅ PyTorch installed: {torch.__version__}")
        
        # Check CUDA availability
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            print(f"✅ CUDA available: {torch.version.cuda}")
            print(f"✅ cuDNN version: {torch.backends.cudnn.version()}")
            device_count = torch.cuda.device_count()
            print(f"✅ GPU count: {device_count}")
            
            for i in range(device_count):
                props = torch.cuda.get_device_properties(i)
                vram_gb = props.total_memory / (1024**3)
                print(f"   GPU {i}: {props.name} ({vram_gb:.1f}GB VRAM)")
        else:
            print("⚠️  CUDA not available")
            print("   This could be because:")
            print("   - No NVIDIA GPU installed")
            print("   - GPU drivers not installed")
            print("   - PyTorch CPU-only version installed")
            print("   - CUDA libraries missing")
        
        return True, cuda_available
    except ImportError:
        print("❌ PyTorch NOT installed")
        print("   Install with: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")
        return False, False
    except Exception as e:
        print(f"❌ Error checking PyTorch: {e}")
        return False, False

def check_faster_whisper():
    """Check faster-whisper installation"""
    print_section("3. faster-whisper Installation")
    try:
        import faster_whisper
        print(f"✅ faster-whisper installed: {faster_whisper.__version__}")
        return True
    except ImportError:
        print("❌ faster-whisper NOT installed")
        print("   Install with: pip install faster-whisper")
        return False
    except Exception as e:
        print(f"❌ Error importing faster-whisper: {e}")
        print(f"   This might be a DLL loading issue!")
        return False

def check_cuda_dlls():
    """Check CUDA DLL availability"""
    print_section("4. CUDA DLL Paths")
    
    import ctypes
    cuda_paths = []
    
    # Check nvidia.cublas.lib and nvidia.cudnn.lib
    try:
        import nvidia.cublas.lib
        cublas_path = os.path.dirname(nvidia.cublas.lib.__file__)
        cuda_paths.append(('cuBLAS', cublas_path))
        print(f"✅ cuBLAS library: {cublas_path}")
    except ImportError:
        print("⚠️  nvidia-cublas-cu11/cu12 not found")
    
    try:
        import nvidia.cudnn.lib
        cudnn_path = os.path.dirname(nvidia.cudnn.lib.__file__)
        cuda_paths.append(('cuDNN', cudnn_path))
        print(f"✅ cuDNN library: {cudnn_path}")
    except ImportError:
        print("⚠️  nvidia-cudnn-cu11/cu12 not found")
    
    # Check for DLL files
    if cuda_paths:
        print("\n📂 Checking for DLL files:")
        
        # CUDA 11.8 DLLs
        dlls_cu11 = [
            'cublas64_11.dll',
            'cublasLt64_11.dll',
            'cudnn64_9.dll',
            'cudnn_ops64_9.dll',
            'cudnn_cnn64_9.dll'
        ]
        
        # CUDA 12.x DLLs
        dlls_cu12 = [
            'cublas64_12.dll',
            'cublasLt64_12.dll',
            'cudnn64_8.dll',
            'cudnn_ops64_8.dll',
            'cudnn_cnn64_8.dll'
        ]
        
        found_dlls = []
        for name, path in cuda_paths:
            # Check both bin and lib subdirectories
            for subfolder in ['bin', 'lib', '']:
                check_path = os.path.join(path, subfolder) if subfolder else path
                
                if os.path.exists(check_path):
                    for dll_set_name, dll_set in [('CUDA 11.x', dlls_cu11), ('CUDA 12.x', dlls_cu12)]:
                        for dll in dll_set:
                            dll_path = os.path.join(check_path, dll)
                            if os.path.exists(dll_path):
                                found_dlls.append(dll)
                                print(f"   ✅ {dll} ({dll_set_name})")
        
        if not found_dlls:
            print("   ❌ No CUDA DLLs found!")
            print("      Install with:")
            print("      pip install nvidia-cublas-cu11 nvidia-cudnn-cu11")
            print("      OR")
            print("      pip install nvidia-cublas-cu12 nvidia-cudnn-cu12")
    else:
        print("\n❌ No CUDA library paths found!")
        print("   Install with:")
        print("   pip install nvidia-cublas-cu11 nvidia-cudnn-cu11")

def check_system_cuda():
    """Check system CUDA installation"""
    print_section("5. System CUDA Installation")
    
    # Check CUDA_PATH environment variable
    cuda_path = os.environ.get('CUDA_PATH')
    if cuda_path:
        print(f"✅ CUDA_PATH: {cuda_path}")
        
        # Check for CUDA DLLs in system path
        cuda_bin = os.path.join(cuda_path, 'bin')
        if os.path.exists(cuda_bin):
            print(f"✅ CUDA bin directory: {cuda_bin}")
        else:
            print(f"⚠️  CUDA bin directory not found: {cuda_bin}")
    else:
        print("⚠️  CUDA_PATH not set (this is OK if using pip packages)")
    
    # Check PATH for CUDA
    path_dirs = os.environ.get('PATH', '').split(os.pathsep)
    cuda_in_path = [d for d in path_dirs if 'cuda' in d.lower() or 'nvidia' in d.lower()]
    
    if cuda_in_path:
        print("\n📂 CUDA/NVIDIA directories in PATH:")
        for d in cuda_in_path[:5]:  # Show first 5
            print(f"   {d}")
    else:
        print("\n⚠️  No CUDA directories found in PATH")

def main():
    """Run all diagnostics"""
    print("=" * 60)
    print("  Ghost LLM - CUDA Diagnostic Tool")
    print("=" * 60)
    
    check_python()
    torch_ok, cuda_ok = check_torch()
    whisper_ok = check_faster_whisper()
    check_cuda_dlls()
    check_system_cuda()
    
    # Summary
    print_section("Summary")
    
    if torch_ok and cuda_ok and whisper_ok:
        print("✅ All checks passed! Your system should work with local Whisper.")
        print("\nIf you're still having issues, try:")
        print("1. Restart your application")
        print("2. Check GPU drivers are up to date")
        print("3. Verify NVIDIA GPU is working (run 'nvidia-smi' in command prompt)")
    else:
        print("⚠️  Some checks failed. Please address the issues above.")
        
        if not torch_ok:
            print("\n📋 TO FIX: Install PyTorch with CUDA support:")
            print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")
        
        if not whisper_ok:
            print("\n📋 TO FIX: Install faster-whisper:")
            print("   pip install faster-whisper")
        
        if torch_ok and not cuda_ok:
            print("\n📋 TO FIX: CUDA not available. This could mean:")
            print("   1. No NVIDIA GPU installed")
            print("   2. GPU drivers need updating (visit nvidia.com/drivers)")
            print("   3. PyTorch CPU version installed (reinstall with CUDA)")
            print("   4. Missing CUDA DLL libraries:")
            print("      pip install nvidia-cublas-cu11 nvidia-cudnn-cu11")
    
    print("\n" + "=" * 60)
    print("  Diagnostic complete!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nDiagnostic cancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
