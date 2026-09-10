/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "56c9cb41032858dc9ab39fc80b32e76a"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3e02306d394a73c122f0cd30f6fc30d9"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d0bfbe3e16cf8dc155415df7e0571a55"
  }, {
    "url": "index.html",
    "revision": "10313149801b9ad4f55f78110f9ab360"
  }, {
    "url": "icon.svg",
    "revision": "a52ca83dc6a45c5cff7a90dd817816d5"
  }, {
    "url": "favicon.ico",
    "revision": "e228e55025c5a85590765d437107ab08"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "bc7123aca4a6fa5ebb6036789c32b913"
  }, {
    "url": "404.html",
    "revision": "4d78c35993fc33c9bf906c182e43ffa9"
  }, {
    "url": "assets/vendor-pdf-B41rQDZ6.js",
    "revision": null
  }, {
    "url": "assets/vendor-icons-BXom3i38.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-ChSy0d_A.js",
    "revision": null
  }, {
    "url": "assets/index.es-B5HaLyqY.js",
    "revision": null
  }, {
    "url": "assets/index-qUYt6A8n.css",
    "revision": null
  }, {
    "url": "assets/index--9OokP4B.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "bc7123aca4a6fa5ebb6036789c32b913"
  }, {
    "url": "favicon.ico",
    "revision": "e228e55025c5a85590765d437107ab08"
  }, {
    "url": "icon.svg",
    "revision": "a52ca83dc6a45c5cff7a90dd817816d5"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d0bfbe3e16cf8dc155415df7e0571a55"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3e02306d394a73c122f0cd30f6fc30d9"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "56c9cb41032858dc9ab39fc80b32e76a"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f5e1f75686a166a22d6fa5f2df389396"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
