import execFileAsync from "../utils/exec-file-async";
import execAsync from "../utils/exec-async";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import isValidPrinter from "../utils/windows-printer-valid";
import { Printer } from "..";
import os from "os";
const release = os.release();

async function getDefaultPrinter(): Promise<Printer | null> {
  try {
    throwIfUnsupportedOperatingSystem();

    if (release.startsWith('6.1')) {
      const { stdout } = await execAsync('wmic printer where default=TRUE get name');
      const printerName = stdout.split('\n')[1].replaceAll("\r", "").trim()
      const printerData: Printer = {
        deviceId: printerName,
        name: printerName,
        paperSizes: [],
      };
      return printerData;
    }
    else {
      const { stdout } = await execFileAsync("Powershell.exe", [
        "-Command",
        "Get-CimInstance Win32_Printer -Property DeviceID,Name,PrinterPaperNames -Filter Default=true",
      ]);
      const printer = stdout.trim();

      // If stdout is empty, there is no default printer
      if (!stdout) return null;

      const { isValid, printerData } = isValidPrinter(printer);

      // DeviceID or Name not found
      if (!isValid) return null;

      return printerData;
    }
  } catch (error) {
    throw error;
  }
}

export default getDefaultPrinter;
