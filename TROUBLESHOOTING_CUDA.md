# Troubleshooting CUDA & Local Whisper Issues

This guide helps you fix common issues with local Whisper transcription on Windows.

## ✅ Current Solution: Physical DLL Copy (Simplified)

**As of January 2026, we use a simplified approach:**

The CUDA DLLs are now **physically copied** to the Python script directory:
- `apps/electron/python/cublas64_11.dll`
- `apps/electron/python/cublasLt64_11.dll`
- `apps/electron/python/cudnn64_9.dll`
- `apps/electron/python/cudnn_ops64_9.dll`
- `apps/electron/python/cudnn_cnn64_9.dll`

**Benefits:**
- ✅ Windows automatically finds DLLs in the same directory as the script
- ✅ No complex ctypes preloading needed
- ✅ More stable than dynamic DLL loading
- ✅ Uses `int8` compute type for maximum stability

**If you need to refresh the DLLs:**
```bash
python -c "import shutil, os; src = r'C:\Users\rathj\AppData\Local\Programs\Python\Python311\Lib\site-packages\nvidia'; dest = r'apps\electron\python'; [shutil.copy2(os.path.join(src, p), dest) for p in ['cublas\\bin\\cublas64_11.dll', 'cublas\\bin\\cublasLt64_11.dll', 'cudnn\\bin\\cudnn64_9.dll', 'cudnn\\bin\\cudnn_ops64_9.dll', 'cudnn\\bin\\cudnn_cnn64_9.dll']]"
```

---

## 🔍 Error: Python Process Exit Code 3221226505

**Symptoms:**
- Error message: `[Transcribe Local] Python process exited with code: 3221226505`
- stdout length: 0 (no JSON output)
- stderr shows CUDA setup logs but crashes before completion
- Automatically falls back to cloud mode

**What this means:**
Exit code `3221226505` (hex: `0xC0000409`) is a Windows `STATUS_STACK_BUFFER_OVERRUN` error. This typically occurs when:
1. **Missing CUDA DLLs** - PyTorch/faster-whisper can't find required NVIDIA libraries
2. **Incompatible DLL versions** - Mixing CUDA 11.x and 12.x libraries
3. **Corrupted DLL files** - Incomplete or damaged CUDA installations

**New Solution:** The DLLs are now physically copied to the script directory. If this still happens:
1. Ensure the DLLs exist in `apps/electron/python/`
2. Run `python diagnose_cuda.py` to check CUDA status
3. The simplified script now uses `int8` compute type which is more stable

---

## 🛠️ Quick Fix Steps

### Step 1: Run the Diagnostic Tool

Open Command Prompt and run:
```bash
cd C:\Users\rathj\Desktop\ghost-llm\apps\electron\python
python diagnose_cuda.py
```

This will check your Python, PyTorch, CUDA, and faster-whisper installation.

### Step 2: Install Missing CUDA Libraries

Based on your PyTorch version, install the matching CUDA libraries:

**For PyTorch with CUDA 11.8 (most common):**
```bash
pip install nvidia-cublas-cu11 nvidia-cudnn-cu11
```

**For PyTorch with CUDA 12.x:**
```bash
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12
```

**Not sure which version?** Run:
```bash
python -c "import torch; print(torch.version.cuda)"
```

### Step 3: Verify Installation

Run the diagnostic tool again to verify:
```bash
python diagnose_cuda.py
```

You should see:
- ✅ cuBLAS library found
- ✅ cuDNN library found
- ✅ Multiple DLL files detected

### Step 4: Restart the Application

Close and restart Ghost LLM completely. The CUDA libraries are loaded at startup, so a restart is required.

---

## 🔧 Advanced Troubleshooting

### Issue: "nvidia-cublas-cu11 not found via import"

**Solution 1: Install CUDA libraries**
```bash
pip install nvidia-cublas-cu11 nvidia-cudnn-cu11
```

**Solution 2: Check your PyTorch installation**
```bash
# Uninstall existing PyTorch
pip uninstall torch torchvision torchaudio

# Reinstall with CUDA 11.8 support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Issue: "CUDA not available" despite having NVIDIA GPU

**Possible causes:**
1. **GPU drivers outdated** - Update from [nvidia.com/drivers](https://www.nvidia.com/drivers)
2. **CPU-only PyTorch installed** - Reinstall PyTorch with CUDA support
3. **GPU not detected** - Run `nvidia-smi` to verify GPU is working

**Solution:**
```bash
# Check if nvidia-smi works
nvidia-smi

# If it works, reinstall PyTorch with CUDA
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install nvidia-cublas-cu11 nvidia-cudnn-cu11
```

### Issue: Process crashes after "Model loaded successfully"

**This is usually CUDA cleanup issue** - the transcription actually succeeded!

The improved error handling now:
1. ✅ Outputs JSON result BEFORE CUDA cleanup
2. ✅ Forces flush to ensure data is written
3. ✅ Node.js reads the successful result even if exit code is non-zero

**No action needed** - the system will work correctly even with this warning.

### Issue: Mix of CUDA 11 and CUDA 12 libraries

**Symptoms:**
- Both `cublas64_11.dll` and `cublas64_12.dll` found
- Inconsistent behavior

**Solution:**
```bash
# Remove all CUDA packages
pip uninstall nvidia-cublas-cu11 nvidia-cublas-cu12 nvidia-cudnn-cu11 nvidia-cudnn-cu12

# Reinstall matching versions (use CUDA 11.8 for best compatibility)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install nvidia-cublas-cu11 nvidia-cudnn-cu11
```

---

## 📊 Understanding the Logs

### Normal Startup (Success):
```
[CUDA] ✅ Found cuBLAS: C:\...\nvidia\cublas\bin
[CUDA] ✅ Found cuDNN: C:\...\nvidia\cudnn\bin
[CUDA] ✅ Preloaded: cublas64_11.dll
[CUDA] ✅ Preloaded: cublasLt64_11.dll
[CUDA] ✅ Preloaded: cudnn64_9.dll
[Whisper Local] 🚀 GPU: NVIDIA GeForce RTX 3060 (12.0GB VRAM)
[Whisper Local] Model loaded successfully
```

### Failed Startup (DLL Missing):
```
[CUDA] ⚠️ nvidia-cublas-cu12/nvidia-cudnn-cu12 not found via import
[CUDA] ⚠️ No CUDA libraries found
[Transcribe Local] Python process exited with code: 3221226505
[Transcribe Local] ☁️ Cloud-Modus aktiv (Prozess-Fehler)
```

### Silent Fallback (Expected):
```
[Whisper Local] ☁️ Cloud-Modus aktiv (keine GPU gefunden)
```
This is normal if you don't have an NVIDIA GPU.

---

## 🎯 Prevention Tips

1. **Always match PyTorch and CUDA versions**
   - PyTorch 2.x with CUDA 11.8 → use cu11 packages
   - PyTorch 2.x with CUDA 12.x → use cu12 packages

2. **Keep GPU drivers updated**
   - Visit [nvidia.com/drivers](https://www.nvidia.com/drivers)
   - Recommended: Driver 520+ for CUDA 11.8

3. **Use virtual environments**
   - Prevents package conflicts
   - Makes cleanup easier

4. **Check after Windows updates**
   - Windows updates can break CUDA installations
   - Re-run diagnostic tool after major updates

---

## 📝 System Requirements

### Minimum for GPU Acceleration:
- ✅ NVIDIA GPU with 4GB+ VRAM
- ✅ NVIDIA Driver 520+
- ✅ Python 3.8+
- ✅ PyTorch with CUDA support
- ✅ faster-whisper
- ✅ nvidia-cublas-cu11 + nvidia-cudnn-cu11

### Verified Configurations:
| GPU | VRAM | Model | Status |
|-----|------|-------|--------|
| RTX 3060 | 12GB | large-v3 | ✅ Optimal |
| RTX 3060 | 12GB | medium | ✅ Fast |
| GTX 1660 Ti | 6GB | medium | ✅ Good |
| GTX 1650 | 4GB | small | ⚠️ Limited |

---

## 🆘 Still Having Issues?

1. **Run the diagnostic tool and save output:**
   ```bash
   python diagnose_cuda.py > diagnostic_output.txt
   ```

2. **Check application logs** in the console output

3. **Verify GPU is working:**
   ```bash
   nvidia-smi
   ```

4. **Create an issue** with:
   - Diagnostic tool output
   - Application logs
   - GPU model
   - Windows version
   - Python version

---

## ✅ Success Indicators

You know it's working when you see:
1. No exit code errors in logs
2. Transcription completes successfully
3. GPU name shown in logs: `🚀 GPU: NVIDIA ...`
4. Local transcription badge appears in UI
5. Faster transcription times (< 2s for short audio)

---

## 🔄 Complete Clean Reinstall

If all else fails, start fresh:

```bash
# 1. Uninstall everything
pip uninstall torch torchvision torchaudio faster-whisper
pip uninstall nvidia-cublas-cu11 nvidia-cublas-cu12 nvidia-cudnn-cu11 nvidia-cudnn-cu12

# 2. Reinstall in correct order
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install nvidia-cublas-cu11 nvidia-cudnn-cu11
pip install faster-whisper

# 3. Verify
python diagnose_cuda.py

# 4. Test
python apps/electron/python/whisper_local.py test.wav large-v3 de 8
```

---

**Last Updated:** January 31, 2026  
**Compatible with:** Ghost LLM v1.0+  
**Platform:** Windows 10/11 with NVIDIA GPU
