# 00 Setup

No firmware here. This lesson gets the toolchain talking to the board.

1. Plug a **data** USB-C cable into the board. A charge-only cable powers it but never shows up as a COM port.
2. Open VS Code's **PlatformIO Core CLI** terminal (`pio` is not on PATH in a normal terminal).
3. Run:

   ```
   pio device list
   ```

4. Look for a port with `CH340` in its description. On this bench it is `COM5` (`USB-SERIAL CH340`).

No port? Install the CH340 driver (WCH CH341SER, from the official WCH site), replug the board and run the command again.

Each later lab is its own PlatformIO project in a folder next to this one (`labs/01-hello`, `labs/02-touch`, ...). Open the lab folder on its own in VS Code.
