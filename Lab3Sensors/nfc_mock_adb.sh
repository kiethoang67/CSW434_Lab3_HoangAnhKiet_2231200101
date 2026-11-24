#!/usr/bin/env bash
# =============================================================================
# nfc_mock_adb.sh — Inject mock NFC NDEF intents vào Android Emulator qua ADB
#
# Dùng khi: không có thiết bị NFC thật, muốn test trên Android Emulator.
# Cách dùng:
#   chmod +x nfc_mock_adb.sh
#   ./nfc_mock_adb.sh [preset_number]
#
# Presets:
#   1 - Text record (plain text)
#   2 - URI record (https link)
#   3 - Custom MIME type
# =============================================================================

PACKAGE="com.lab3sensors"
ACTIVITY=".MainActivity"
ACTION="android.nfc.action.NDEF_DISCOVERED"

PRESET=${1:-1}

echo "========================================"
echo " NFC Mock Intent Injector"
echo " Target: $PACKAGE$ACTIVITY"
echo " Preset: $PRESET"
echo "========================================"

case $PRESET in
  1)
    echo "[+] Injecting: Text NDEF Record"
    adb shell am start \
      -a "$ACTION" \
      -t "text/plain" \
      -n "$PACKAGE/$ACTIVITY" \
      --es "mock_payload" "Hello NFC! CSW434 Lab3"
    ;;
  2)
    echo "[+] Injecting: URI NDEF Record (NDEF_DISCOVERED with URI)"
    adb shell am start \
      -a "$ACTION" \
      -d "https://developer.android.com/develop/connectivity/nfc/nfc" \
      -n "$PACKAGE/$ACTIVITY"
    ;;
  3)
    echo "[+] Injecting: TAG_DISCOVERED (generic)"
    adb shell am start \
      -a "android.nfc.action.TAG_DISCOVERED" \
      -n "$PACKAGE/$ACTIVITY"
    ;;
  *)
    echo "Unknown preset. Dùng: ./nfc_mock_adb.sh [1|2|3]"
    exit 1
    ;;
esac

echo ""
echo "[OK] Intent sent. Kiểm tra app trên emulator."
