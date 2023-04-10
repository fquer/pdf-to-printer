import execFileAsync from "../utils/exec-file-async";
import execAsync from "../utils/exec-async";
import isValidPrinter from "../utils/windows-printer-valid";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import { Printer } from "..";
import os from "os";
const release = os.release();

async function getPrinters(): Promise<Printer[]> {
  function stdoutHandler(stdout: string) {
    const printers: Printer[] = [];

    if (release.startsWith('6.1')) {
      let splittedPrinters: string[] = stdout.split("\n")
      splittedPrinters.forEach((printerName: string) => {
        printerName = printerName.replaceAll("\r", "").trim()
        if (printerName != "Name" && printerName != "") {
          const printerData: Printer = {
            deviceId: printerName,
            name: printerName,
            paperSizes: [],
          };
          printers.push(printerData)
        }
      })
    }
    else {
      stdout
        .split(/(\r?\n){2,}/)
        .map((printer) => printer.trim())
        .filter((printer) => !!printer)
        .forEach((printer) => {
          const { isValid, printerData } = isValidPrinter(printer);

          if (!isValid) return;

          printers.push(printerData);
        });
    }
    return printers;
  }

  try {
    throwIfUnsupportedOperatingSystem();
    // not tested with windows 8 & 8.1 
    if (release.startsWith('6.1')) {
      const { stdout } = await execAsync('wmic printer get name');
			return stdoutHandler(stdout);
    }
    else {
      const { stdout } = await execFileAsync("Powershell.exe", [
        "-Command",
        "Get-CimInstance Win32_Printer -Property DeviceID,Name,PrinterPaperNames",
      ]);
      return stdoutHandler(stdout);
    }
  } catch (error) {
    throw error;
  }
}

export default getPrinters;
