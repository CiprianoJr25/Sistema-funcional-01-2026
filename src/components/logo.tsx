
"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useOptionalSidebar } from './ui/sidebar';
import { useTheme } from 'next-themes';

export function Logo() {
  const sidebar = useOptionalSidebar();
  const { resolvedTheme } = useTheme(); 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  useEffect(() => {
    setLogoSrc(resolvedTheme === 'dark' ? '/logo.png' : '/logo-dark.png');
  }, [resolvedTheme]);
  
  useEffect(() => {
    if (sidebar?.state) {
      setIsCollapsed(sidebar.state === 'collapsed');
    }
  }, [sidebar?.state]);


  return (
    <div className="flex items-center justify-center gap-3">
      <Image 
        src={logoSrc}
        alt="Euroinfo Logo" 
        width={36} 
        height={36}
        className="text-primary"
        key={logoSrc} 
      />
      {!isCollapsed && (
        <span className="text-lg font-bold leading-none tracking-tight text-foreground">
            Euroinfo
        </span>
      )}
    </div>
  );
}
