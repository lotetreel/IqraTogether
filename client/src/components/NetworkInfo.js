// This file helps you identify your network information for testing
import React, { useEffect, useState } from 'react';

const NetworkInfo = () => {
  const [info, setInfo] = useState({
    origin: '',
    hostname: '',
    protocol: '',
    port: ''
  });

  useEffect(() => {
    setInfo({
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
    });
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Network Information</h2>
      <div className="space-y-2">
        <div><strong>Origin:</strong> {info.origin}</div>
        <div><strong>Hostname:</strong> {info.hostname}</div>
        <div><strong>Protocol:</strong> {info.protocol}</div>
        <div><strong>Port:</strong> {info.port}</div>
      </div>
      <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
        <p className="text-sm">
          If testing with mobile devices, use your computer's IP address instead of 'localhost'.
        </p>
      </div>
    </div>
  );
};

export default NetworkInfo;