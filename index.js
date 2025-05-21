// ACEP InfoSec Website
// https://github.com/acep-uaf/infosec-acep-uaf-edu-website
// Author: John Haverlack <jehaverlack@alaska.edu>
// License: MIT License
// Copyright (c) 2022 Alaska Center for Energy and Power (ACEP)
// University of Alaska Fairbanks (UAF)

import express from 'express';
import fs from 'fs';
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
import ailib, { load_config, log, logStaticRequests } from './libs/acep-infosec-web-lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

let config = load_config();

console.log(JSON.stringify(config, null, 2));


log('Starting ACEP InfoSec Website...');
log('INFO: Loaded Config');
log('WEBAPI: ' + JSON.stringify(config, null, 2));

// API

// Serve config as JSON
app.get('/api/config', (req, res) => {
    res.json(config);

    let webreqmeta = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    log('WEBAPI: ' + JSON.stringify(webreqmeta))
});

// Serve nav as JSON
app.get('/api/nav', (req, res) => {
    const menuPath = (path.join(config.dirs.html, 'conf', 'nav.json'));
  
    try {
      const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
      res.json(menuData);
  
      log('INFO: GET /api/nav');
    } catch (err) {
      log(`ERROR: GET /api/nav failed: ${err}`);
      res.status(500).json({ error: 'Failed to load nav.json' });
    }
});

// API
app.get ('/api', (req, res) => {
   res.json(ailib.gen_api_usage(req));
   
   let webreqmeta = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    log('WEBAPI: ' + JSON.stringify(webreqmeta))
});


  
// Favicon
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(config.dirs.html, 'img', 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      res.status(204).end(); // No Content
    }
  
    log('WEBEXP: ' + JSON.stringify({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }));
  });
  

// /img
app.use('/img', logStaticRequests('img'), express.static(path.join(config.dirs.html, 'img')));

// /css
app.use('/css', logStaticRequests('css'), express.static(path.join(config.dirs.html, 'css')));

// /js
app.use('/js', logStaticRequests('js'), express.static(path.join(config.dirs.html, 'js')));


// md
app.use('/md', logStaticRequests('md'), express.static(path.join(config.dirs.html, 'md')));

// Serve Bootstrap
app.use('/bootstrap', logStaticRequests('bootstrap'), express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

// Serve Font Awesome
app.use('/fontawesome', logStaticRequests('fontawesome'), express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free')));

// Serve marked for client-side Markdown rendering
app.use('/marked', logStaticRequests('marked'), express.static(path.join(__dirname, 'node_modules', 'marked')));

// Top Level Website
app.use('/', logStaticRequests('html'), express.static(path.join(config.dirs.html)));

// Catch-all for 404 Not Found
app.use((req, res, next) => {
    const webreqmeta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
  
    log(`404 NOT FOUND: ${JSON.stringify(webreqmeta)}`);
  
    if (req.originalUrl.startsWith('/api/')) {
      res.status(404).json({ error: 'Not Found', path: req.originalUrl });
    } else {
      res.status(404).sendFile(path.join(config.dirs.html, '404.html'));
    }
  });
  
for (const ip of config.host.ips) {
    app.listen(config.web.port, ip, () => {
      console.log(`🌐 WebUI running at http://${ip}:${config.web.port}`);
      log(`INFO: WebUI started on ${ip}:${config.web.port}`);
    });
  }