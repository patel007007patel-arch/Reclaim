import React from 'react';

/**
 * Extracts the React component from an icon object
 * Handles different SVGR export formats
 */
export function getIconComponent(icon: any): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  if (!icon) {
    console.warn('getIconComponent: icon is null or undefined');
    return null;
  }
  
  // If it's already a function/component, return it
  if (typeof icon === 'function') {
    return icon;
  }
  
  // If it's an object, try to find the component
  if (typeof icon === 'object' && icon !== null) {
    // Check if it's an image object (has src property) - this means SVGR didn't process it
    if ('src' in icon && typeof icon.src === 'string') {
      console.warn('getIconComponent: Icon is an image object, not a React component. SVGR may not be processing SVGs correctly.', icon);
      // Return a fallback component that uses Next.js Image
      return ((props: React.SVGProps<SVGSVGElement>) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={icon.src} alt="" {...(props as any)} style={{ width: icon.width, height: icon.height }} />;
      }) as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    }
    
    // Try default export
    if ('default' in icon && typeof icon.default === 'function') {
      return icon.default;
    }
    // Try ReactComponent (common SVGR export)
    if ('ReactComponent' in icon && typeof icon.ReactComponent === 'function') {
      return icon.ReactComponent;
    }
    // Try to find any function property
    for (const key of Object.keys(icon)) {
      if (typeof icon[key] === 'function') {
        return icon[key];
      }
    }
  }
  
  console.warn('getIconComponent: Could not extract component from icon:', icon);
  return null;
}

/**
 * Renders an icon component from an icon object
 */
export function renderIcon(
  icon: any,
  props?: React.SVGProps<SVGSVGElement>
): React.ReactElement | null {
  const IconComponent = getIconComponent(icon);
  if (!IconComponent) {
    console.warn('Icon is not a valid React component:', icon);
    return null;
  }
  return <IconComponent {...props} />;
}

