# L1 Meet the bulb

Laptop only. No ESP32, no firmware, nothing to flash.

`commands.ps1` holds the `curl.exe` calls for the Shelly RGBCCT bulb: who it is, what it can do, switching it on and off, and turning the Shelly cloud off so it only talks on your own network.

1. Find the bulb's IP (router client list or the Shelly app).
2. Open `commands.ps1`, put the IP in `$bulb`, and run the commands one at a time in PowerShell.
3. Use `curl.exe`, not `curl`: in Windows PowerShell 5.1 `curl` is an alias for `Invoke-WebRequest`.
4. Check `Shelly.GetDeviceInfo` and `Shelly.ListMethods` on your own bulb before L2. The shop name and the API docs name differ.

Test the bulb in the first week, while the 30-day return window is still open.
