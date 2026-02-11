const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the root directory for Turbopack
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

module.exports = nextConfig;
