import fs from 'fs';
import path from 'path';
import os from 'os';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';
import { get } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = load_config();

function load_config() {
    let config = {};

    const argv = yargs(hideBin(process.argv))
    .usage('Usage: npm start -- <options>')
    .option('configfile', {
        alias: 'c',
        description: 'Path to config file',
        type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;

    // Default Config File
    if (!argv.configfile) {
        argv.configfile = path.join(__dirname, '..',  'config.json');
    }

    // Load Config
    try {
        config = JSON.parse(fs.readFileSync(argv.configfile, 'utf8'));
        config.dirs.base = config.dirs.base + '/..'
    } catch (err) {
        console.error(err);
    }

    // Expand Data Directory
    let search_replace = {}
    search_replace['DIRNAME'] = __dirname
    for (let d in config.dirs) {
        search_replace[d.toUpperCase()] = d
    }

    for (let d in config.dirs) {
        for (let s in search_replace) {
        switch (s) {
            case 'DIRNAME':
            config.dirs[d] = path.join(config.dirs[d].replace(s, __dirname))
            break
            default:
            config.dirs[d] = path.join(config.dirs[d].replace(s, config.dirs[search_replace[s]]))
            break
        }
        }
    }

    for (let s in search_replace) {
        switch (s) {
          case 'DIRNAME':
            break
          case 'CONF':
            config.acep.directory_json = path.join(config.acep.directory_json.replace(s, config.dirs.conf))
            break
        default:
            break
        }
      }


    // Create Directories
    for (const dir of Object.values(config.dirs)) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }


    // Get Host IP Addresses
    const networkInterfaces = os.networkInterfaces();
    config.host = {}
    config.host.ips = [];
    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        for (const address of addresses) {
            if (address.family === 'IPv4' && !address.internal) {
                config.host.ips.push(address.address);
            }
        }
    }

    config.host.ips.push('127.0.0.1');

    return config;
}


// Logger Function
function log(msg, cnsl=false) {
    const now = new Date();
    const ts_datetime = now.toISOString();                         // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const ts_date = ts_datetime.split('T')[0];                     // "YYYY-MM-DD"
  
    const logFile = path.join(config.dirs.logs, `acep-infosec-web_${ts_date}.log`);
  
    try {
      fs.appendFileSync(logFile, `${ts_datetime} : ${msg}\n`, 'utf8');
      if (cnsl) { console.log(msg); }
    } catch (err) {
      console.error(`Logger error: Could not write to ${logFile}`, err);
    }
  }

// API Usage
function gen_api_usage(req) {
    // let base_url = "http://localhost:" + config.web.port;
    const base_url = `${req.protocol}://${req.headers.host}`;
    let usage = {};

    usage['API'] = {}
    usage['API']['DESC']   = "ACEP InfoSec Website API"
    usage['API']['URL']    = base_url + '/api';

    usage['API']['CONFIG'] = {}
    usage['API']['CONFIG']['DESC'] = "API Config JSON"
    usage['API']['CONFIG']['URL'] = base_url + '/api/config';

    usage['API']['CONFIG']['CREDENTIALS'] = {}
    usage['API']['CONFIG']['CREDENTIALS']['DESC'] = "API Credentials JSON"
    usage['API']['CONFIG']['CREDENTIALS']['URL'] = base_url + '/api/config/credentials';

    return usage;
}


function logStaticRequests(subdir) {
  return (req, res, next) => {
    const webreqmeta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      type: subdir
    };
    log(`WEBEXP: ${JSON.stringify(webreqmeta)}`);
    next();
  };
}


export { load_config, log, logStaticRequests };

export default {
    gen_api_usage
  };