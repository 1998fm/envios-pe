# Windows: "An Application Control policy has blocked this file"

On Windows 11, `npm run dev` can fail even after a clean `npm install`. The cause is Windows refusing to load
the native `.node` binaries that Next.js and Tailwind need. This guide covers how to confirm it and how to fix it.

## Symptoms

`npm run dev` prints `✓ Ready`, then one or both of these:

```
⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred: An Application Control policy has blocked this file.
\\?\C:\...\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node
...
Error: Turbopack is not supported on this platform (win32/x64) because native bindings are not available.
```

If you try `next dev --webpack`, the server starts but every page returns **500**:

```
Error: Cannot find native binding. npm has a bug related to optional dependencies ...
    at ...\node_modules\@tailwindcss\oxide\index.js
```

The Tailwind message is misleading. The file **is** installed, but Windows won't let `node.exe` load it.
Deleting `node_modules` and reinstalling does **not** help.

## Which files are blocked

| File | Package | Needed by |
|---|---|---|
| `node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node` | `@next/swc-win32-x64-msvc` | Next.js compiler / Turbopack |
| `node_modules\@tailwindcss\oxide-win32-x64-msvc\tailwindcss-oxide.win32-x64-msvc.node` | `@tailwindcss/oxide-win32-x64-msvc` | Tailwind CSS v4 |

Other packages that ship `.node` files can hit the same block. Get the full list with:

```powershell
Get-ChildItem node_modules -Recurse -Filter *.node | Select-Object FullName
```

## Step 1: Confirm the cause

Run in PowerShell:

```powershell
# Smart App Control: On / Evaluation / Off
(Get-MpComputerStatus).SmartAppControlState

# Recent Code Integrity blocks (3077 = blocked, 3033 = signing level not met)
Get-WinEvent -LogName 'Microsoft-Windows-CodeIntegrity/Operational' -MaxEvents 200 |
  Where-Object { $_.Id -in 3033, 3077 } |
  Select-Object -First 5 TimeCreated, Id, Message | Format-List
```

You can also find these events in **Event Viewer → Applications and Services Logs → Microsoft → Windows → CodeIntegrity → Operational**.

How to read the results:

- **`SmartAppControlState` is `On`**, and events mention `node.exe` loading a `.node` file: Smart App Control is the
  cause. Use [Option A](#option-a-turn-off-smart-app-control-personal-pcs) or
  [Option B](#option-b-develop-inside-wsl-2-recommended-if-you-want-to-keep-protection-on).
- **`SmartAppControlState` is `Off`, but 3077 events still appear:** the device is managed by your organization
  (App Control for Business / WDAC). Go to [Option C](#option-c-managed-work-device-ask-it-for-an-allow-rule).

> Smart App Control blocks unsigned code with no known reputation. The npm prebuilt binaries are unsigned, and each
> new version is new to Microsoft's reputation service. That's why an upgrade (for example, Next 16.2 → 16.4) can
> start getting blocked even though the old version worked. **Smart App Control has no per-file allow list**, so you
> can't "unblock" just these files.

## Option A: Turn off Smart App Control (personal PCs)

1. Open **Windows Security** (Start → "Windows Security").
2. Go to **App & browser control → Smart App Control settings**.
3. Select **Off**.
4. Restart your terminal, clear the build cache, and start again:

   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

**Before you do this:** Smart App Control is an extra protection layer on top of Microsoft Defender, which stays on.
On many Windows 11 builds, Smart App Control **can't be turned back on without resetting or reinstalling Windows**.
Newer builds may allow it, but don't count on it. If you want to keep it on, use Option B.

## Option B: Develop inside WSL 2 (recommended if you want to keep protection on)

Linux binaries run inside the WSL virtual machine, so Windows Code Integrity doesn't check them. Smart App Control
stays on for the rest of Windows. On a work device, check with IT that WSL is allowed first.

```powershell
wsl --install -d Ubuntu      # once; reboot if prompted
```

Then inside the Ubuntu shell:

```bash
# Install Node via nvm (LTS 22 or newer)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22

# Clone into the Linux filesystem (NOT /mnt/c/... — much slower and shares the Windows node_modules)
cd ~
git clone https://github.com/1998fm/envios-pe.git
cd envios-pe
cp .env.local.sample .env.local     # then fill in values
npm install
npm run dev
```

Open http://localhost:3000 in your Windows browser. WSL forwards the port automatically.
VS Code (**WSL** extension) and JetBrains (WSL remote) can both open the project directly inside WSL.

**Don't share one `node_modules` between Windows and WSL.** Each OS needs its own platform binaries
(`win32-x64-msvc` vs `linux-x64-gnu`).

Other ways to get the same isolation: a Dev Container (Docker Desktop + VS Code "Dev Containers"), or GitHub Codespaces.

## Option C: Managed work device (ask IT for an allow rule)

If your organization enforces App Control for Business (WDAC), **don't try to get around it.** Send IT the following:

- The Code Integrity event IDs **3077 / 3033 / 3089** from the log above. Event 3089 contains the file hash and signature details.
- The blocked file paths from the table above, loaded by `node.exe`.
- The fact that these are unsigned prebuilt binaries from the public npm packages `@next/swc-win32-x64-msvc` and
  `@tailwindcss/oxide-win32-x64-msvc`.

IT usually adds them to a **supplemental policy** with hash rules. For example (IT should adapt this to their own
base policy):

```powershell
$rules = Get-ChildItem C:\Projects\envios-pe\node_modules -Recurse -Filter *.node |
  ForEach-Object { New-CIPolicyRule -DriverFilePath $_.FullName -Level Hash }
New-CIPolicy -FilePath .\envios-pe-node-modules.xml -Rules $rules -UserPEs
```

Hash rules break whenever these packages are upgraded, because the new binaries have new hashes. Ask IT how they
want to handle updates. If allow-listing isn't possible, Option B (WSL) is the usual approved path for developers.

## After fixing it

```powershell
Remove-Item -Recurse -Force .next   # drop any cache built with WASM fallback
npm run dev
```

You should see `✓ Ready` with **no** `Attempted to load @next/swc-...` warning, and http://localhost:3000 should
return 200. Run the Code Integrity query from Step 1 again. There should be no new 3077 events.
