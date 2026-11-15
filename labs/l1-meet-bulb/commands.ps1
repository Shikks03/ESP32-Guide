# L1 Meet the bulb: talk to the Shelly bulb from your laptop over its local HTTP API.
# No ESP32 and no cloud. Run these one at a time in Windows PowerShell or PowerShell 7.
#
# Why "curl.exe" and not "curl": in Windows PowerShell 5.1, "curl" is an alias for
# Invoke-WebRequest, which prints a different thing and takes different options.
# Typing the .exe makes sure you get the real curl that ships with Windows.

# Your bulb's IP address. Replace the placeholder.
# Find it in your router's client list (look for a device named like "shelly...")
# or in the Shelly app under the bulb's device information.
$bulb = "192.168.1.50"

# Optional: list the devices your laptop has talked to recently. This only reads your
# laptop's own address table, it sends nothing to the network. Look for the bulb's IP.
# arp -a

# 1. Who are you? Returns the device id, model, firmware version and whether
#    a password is on (auth_en). Check "model" and "app" here: they name your bulb.
#    --max-time 5 means "give up after 5 seconds" so a wrong IP does not hang the window.
curl.exe --max-time 5 "http://$bulb/rpc/Shelly.GetDeviceInfo"

# 1b. Same call, but pretty-printed as a list of fields (easier to read).
# curl.exe -s --max-time 5 "http://$bulb/rpc/Shelly.GetDeviceInfo" | ConvertFrom-Json | Format-List

# 2. What can you do? Lists every method this bulb understands.
#    Look for names that start with "RGBCCT." (the light component). The shop calls
#    the bulb "Multicolor Bulb E27 Gen3", the API docs call it "RGBCCT Bulb Gen3",
#    so confirm on your own bulb before you rely on the names.
curl.exe --max-time 5 "http://$bulb/rpc/Shelly.ListMethods"

# 3. What is the light doing right now? id=0 is the first (and only) light.
#    You get on/off (output), brightness (0-100), mode ("rgb" or "cct"), rgb and ct.
curl.exe --max-time 5 "http://$bulb/rpc/RGBCCT.GetStatus?id=0"

# 4. Turn it on as a warm white at 40 % brightness.
#    mode=cct means "white light, set by colour temperature in Kelvin" (ct=3000 is warm).
#    We always send mode explicitly, because the docs do not say whether sending ct
#    alone switches the bulb out of colour mode.
#    The URL is in double quotes so PowerShell does not treat the & as its own operator.
curl.exe --max-time 5 "http://$bulb/rpc/RGBCCT.Set?id=0&on=true&brightness=40&mode=cct&ct=3000"

# 5. A colour instead: mode=rgb with a [red,green,blue] list, each 0-255.
#    The brackets and commas are percent-encoded (%5B %2C %5D) so curl and the bulb
#    both read them as plain text. This one is pure red.
curl.exe --max-time 5 "http://$bulb/rpc/RGBCCT.Set?id=0&on=true&brightness=60&mode=rgb&rgb=%5B255%2C0%2C0%5D"

# 6. Flip it: on becomes off, off becomes on.
curl.exe --max-time 5 "http://$bulb/rpc/RGBCCT.Toggle?id=0"

# 7. Turn it off.
curl.exe --max-time 5 "http://$bulb/rpc/RGBCCT.Set?id=0&on=false"

# 8. Is the bulb connected to the Shelly cloud right now? "connected": true means yes.
curl.exe --max-time 5 "http://$bulb/rpc/Cloud.GetStatus"

# 9. Turn the cloud connection off, so the bulb only talks on your own network.
#    The setting is JSON ({"enable":false}). Typing JSON into a native command from
#    PowerShell is a quoting trap, so we percent-encode it first. That turns it into
#    plain letters and % signs that survive any PowerShell version.
$cfg = [uri]::EscapeDataString('{"enable":false}')

# 9a. Dry run: print the exact URL that step 9b will send. Nothing goes to the bulb.
#     You should see ...Cloud.SetConfig?config=%7B%22enable%22%3Afalse%7D
Write-Output "http://$bulb/rpc/Cloud.SetConfig?config=$cfg"

# 9b. Send it. The reply has a "restart_required" field. The docs show false for the
#     enable:true example; read what your bulb says for enable:false.
curl.exe --max-time 5 "http://$bulb/rpc/Cloud.SetConfig?config=$cfg"

# 9c. Check it took effect: "connected" should read false.
curl.exe --max-time 5 "http://$bulb/rpc/Cloud.GetStatus"

# Alternative to 9b: the POST form, with the JSON in a file so there is no quoting at all.
# This writes the file without a byte-order mark, which some JSON parsers reject.
# $body = '{"id":1,"method":"Cloud.SetConfig","params":{"config":{"enable":false}}}'
# [IO.File]::WriteAllText("$PWD\body.json", $body, (New-Object System.Text.UTF8Encoding $false))
# curl.exe --max-time 5 -X POST "http://$bulb/rpc" -H "Content-Type: application/json" --data "@body.json"

# Only if step 1 showed "auth_en": true (a password is set). The user name is always
# "admin". The bulb uses digest authentication with SHA-256; curl's --digest handles it.
# Not checked against a real bulb.
# curl.exe --max-time 5 --digest -u admin:YOUR-PASSWORD "http://$bulb/rpc/Shelly.GetDeviceInfo"
