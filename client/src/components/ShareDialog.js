import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../contexts/ThemeContext';

// Utility function to find the local IP address
const getLocalIpAddress = () => {
  // This function runs in the browser and tries to find the local IP
  return new Promise((resolve, reject) => {
    // Use WebRTC to detect local IP address - this works in most modern browsers
    const RTCPeerConnection = window.RTCPeerConnection ||
                           window.webkitRTCPeerConnection ||
                           window.mozRTCPeerConnection;
                           
    if (!RTCPeerConnection) {
      reject(new Error('WebRTC not supported by browser'));
      return;
    }
    
    const pc = new RTCPeerConnection({ iceServers: [] });
    const noop = () => {};
    
    // Create a bogus data channel
    pc.createDataChannel("");
    
    // Create an offer to set local description
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(reject);
      
    // When ICE candidate is generated, look for the IP address
    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return;
      
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
      const ipMatch = ipRegex.exec(ice.candidate.candidate);
      
      if (ipMatch) {
        const ip = ipMatch[1];
        // Filter out local addresses that are not useful for LAN access
        if (ip.indexOf('192.168.') === 0 || 
            ip.indexOf('10.') === 0 || 
            ip.indexOf('172.16.') === 0 || 
            ip.indexOf('172.17.') === 0 || 
            ip.indexOf('172.18.') === 0 ||
            ip.indexOf('172.19.') === 0 ||
            ip.indexOf('172.20.') === 0 ||
            ip.indexOf('172.21.') === 0 ||
            ip.indexOf('172.22.') === 0) {
          resolve(ip);
          pc.onicecandidate = noop;
          pc.close();
        }
      }
    };
    
    // If we didn't find an IP after 2 seconds, reject
    setTimeout(() => {
      pc.close();
      reject(new Error('Could not find local IP address'));
    }, 2000);
  });
};

const ShareDialog = ({ sessionId, sessionUrl, onClose }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [mobileSessionUrl, setMobileSessionUrl] = useState(sessionUrl);
  const [localIpAddress, setLocalIpAddress] = useState("192.168.1.109"); // Default to your detected IP
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  
  // Try to detect the IP address automatically
  useEffect(() => {
    // Only try to detect IP if we're using localhost
    if (sessionUrl.includes('localhost')) {
      setIsLoadingIp(true);
      
      // First create a URL with your known IP address
      const port = window.location.port || '3000';
      const knownIpUrl = `http://192.168.1.109:${port}?session=${sessionId}`;
      setMobileSessionUrl(knownIpUrl);
      
      // Then try to detect automatically as a backup
      getLocalIpAddress()
        .then(ip => {
          setLocalIpAddress(ip);
          // Update the URL with the detected IP if different
          if (ip !== "192.168.1.109") {
            const mobileUrl = `http://${ip}:${port}?session=${sessionId}`;
            setMobileSessionUrl(mobileUrl);
          }
          console.log('Detected local IP address:', ip);
        })
        .catch(err => {
          console.error('Failed to detect local IP address:', err);
          // We already set the URL with the known IP, so no need to update
        })
        .finally(() => {
          setIsLoadingIp(false);
        });
    }
  }, [sessionId, sessionUrl]);
  
  const copySessionLink = () => {
    navigator.clipboard.writeText(mobileSessionUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold dark:text-dark-text-primary">Share Session</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="mb-6 text-gray-600 dark:text-dark-text-secondary">
            Share this QR code or link with others to join the same session:
          </p>
          
          <div className="mb-6">
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 mx-auto flex items-center justify-center bg-white dark:bg-dark-bg-secondary max-w-xs transition-all duration-300 hover:shadow-lg">
              {isLoadingIp ? (
                <div className="flex items-center justify-center h-[200px] w-[200px]">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Generating QR code...</span>
                </div>
              ) : (
                <QRCodeSVG 
                  value={mobileSessionUrl} 
                  size={200} 
                  bgColor={theme === 'dark' ? '#1f2937' : '#ffffff'}
                  fgColor={theme === 'dark' ? '#d1d5db' : '#000000'}
                />
              )}
            </div>
          </div>
          
          <div className="mb-3 text-center animate-slide-in">
            <span className="text-sm text-gray-500 dark:text-dark-text-muted block mb-1">Session ID</span>
            <span className="badge-primary text-base px-4 py-1">{sessionId}</span>
          </div>
          
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-300">
            <p><strong>Mobile QR Code Ready</strong></p>
            <p className="mt-1">Using IP address: {localIpAddress}</p>
            <p className="mt-1">Make sure your mobile device is on the same WiFi network.</p>
          </div>
          
          <div className="flex items-center mb-6">
            <input 
              type="text" 
              value={mobileSessionUrl} 
              onChange={(e) => setMobileSessionUrl(e.target.value)}
              className="input rounded-r-none"
              style={{ width: 'calc(100% - 3rem)' }}
            />
            <button 
              onClick={copySessionLink}
              className="btn-primary h-full rounded-l-none px-3 flex items-center justify-center"
              aria-label="Copy link"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={onClose}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
