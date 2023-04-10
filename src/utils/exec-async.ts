import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export default execAsync;
