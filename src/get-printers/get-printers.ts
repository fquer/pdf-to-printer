import execFileAsync from "../utils/exec-file-async";
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
        if (printerName != "Name") {
          const printerData: Printer = {
            deviceId: printerName,
            name: printerName,
            paperSizes: [],
          };
          printers.push(printerData)
        }
      })
    }
    else if (release.startsWith('10')) {
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

  async function getPrintersViaCommandLine(command: string) {
    const { stdout } = await execFileAsync("Powershell.exe", [
      "-Command",
      command,
    ]);
    return stdout
  }

  try {
    let finalizedStdout;
    throwIfUnsupportedOperatingSystem();
    // not tested with windows 8 & 8.1 
    if (release.startsWith('6.1')) {
      finalizedStdout = await getPrintersViaCommandLine(`wmic printer get name`)
    }
    else if (release.startsWith('10')) {
      finalizedStdout = await getPrintersViaCommandLine(`Get-CimInstance Win32_Printer -Property DeviceID,Name,PrinterPaperNames`)
    }
    else {
      finalizedStdout = "This windows version unknown."
    }
    
    return stdoutHandler(finalizedStdout);
  } catch (error) {
    throw error;
  }
}

export default getPrinters;
