import React from 'react';

export type UseSidebarResizeProps = {
  direction?: 'left' | 'right';
  currentWidth: string;
  onResize: (width: string) => void;
  onToggle?: () => void;
  isCollapsed?: boolean;
  minResizeWidth?: string;
  maxResizeWidth?: string;
  enableAutoCollapse?: boolean;
  autoCollapseThreshold?: number;
  expandThreshold?: number;
  enableDrag?: boolean;
  setIsDraggingRail?: (isDragging: boolean) => void;
  widthCookieName?: string;
  widthCookieMaxAge?: number;
  isNested?: boolean;
  enableToggle?: boolean;
};

type WidthUnit = {
  value: number;
  unit: 'rem' | 'px';
};

/**
 * Parse width string into value and unit
 */
function parseWidth(width: string): WidthUnit {
  const unit = width.endsWith('rem') ? 'rem' : 'px';
  const value = Number.parseFloat(width);
  return { value, unit };
}

/**
 * Convert any width to pixels for calculations
 */
function toPx(width: string): number {
  const { value, unit } = parseWidth(width);
  // biome-ignore lint: simple multiplication
  return unit === 'rem' ? value * 16 : value;
}

/**
 * Format width value with unit
 */
function formatWidth(value: number, unit: 'rem' | 'px'): string {
  return `${unit === 'rem' ? value.toFixed(1) : Math.round(value)}${unit}`;
}

/**
 * A versatile hook for handling resizable sidebar (or inset) panels
 * Works for both sidebar (left side) and artifacts (right side) panels
 * Supports VS Code-like continuous drag to collapse/expand
 */
export function useSidebarResize({
  direction = 'right',
  currentWidth,
  onResize,
  onToggle,
  isCollapsed = false,
  minResizeWidth = '14rem',
  maxResizeWidth = '24rem',
  enableToggle = true,
  enableAutoCollapse = true,
  autoCollapseThreshold = 1.5, // Default to collapsing at minWidth + 50%
  expandThreshold = 0.2,
  enableDrag = true,
  // biome-ignore lint: no-empty-function
  setIsDraggingRail = () => {},
  widthCookieName,
  // biome-ignore lint: reasonable-number-constant
  widthCookieMaxAge = 60 * 60 * 24 * 7, // 1 week default
  isNested = false,
}: UseSidebarResizeProps) {
  // Refs for tracking drag state
  const dragRef = React.useRef<HTMLButtonElement>(null);
  const startWidth = React.useRef(0);
  const startX = React.useRef(0);
  const isDragging = React.useRef(false);
  const isInteractingWithRail = React.useRef(false);
  const lastWidth = React.useRef(0);
  const lastLoggedWidth = React.useRef(0);
  const dragStartPoint = React.useRef(0);
  const lastDragDirection = React.useRef<'expand' | 'collapse' | null>(null);
  const lastTogglePoint = React.useRef(0);
  const lastToggleWidth = React.useRef(0);
  const toggleCooldown = React.useRef(false);
  const lastToggleTime = React.useRef(0);
  const dragDistanceFromToggle = React.useRef(0);
  const dragOffset = React.useRef(0);
  const railRect = React.useRef<DOMRect | null>(null);

  // Refs for auto-collapse threshold
  const autoCollapseThresholdPx = React.useRef(0);

  // Memoize min/max width calculations for performance
  const minWidthPx = React.useMemo(
    () => toPx(minResizeWidth),
    [minResizeWidth]
  );
  const maxWidthPx = React.useMemo(
    () => toPx(maxResizeWidth),
    [maxResizeWidth]
  );

  // Helper function to determine if width is increasing based on direction and mouse movement
  const isIncreasingWidth = React.useCallback(
    (currentX: number, referenceX: number): boolean => {
      return direction === 'left'
        ? currentX < referenceX // For left-positioned handle, moving left increases width
        : currentX > referenceX; // For right-positioned handle, moving right increases width
    },
    [direction]
  );

  // Helper function to calculate width based on mouse position and direction
  const calculateWidth = React.useCallback(
    (
      e: MouseEvent,
      initialX: number,
      initialWidth: number,
      currentRailRect: DOMRect | null
    ): number => {
      if (isNested && currentRailRect) {
        // For nested sidebars, use the delta from start position for precise tracking
        const deltaX = e.clientX - initialX;

        if (direction === 'left') {
          // For left-positioned handle (right panel)
          // Width increases as mouse moves left (negative deltaX)
          return initialWidth - deltaX;
        }
        // For right-positioned handle (left panel)
        // Width increases as mouse moves right (positive deltaX)
        return initialWidth + deltaX;
      }
      // For standard sidebars at window edges
      if (direction === 'left') {
        // For left-positioned handle (right panel)
        return window.innerWidth - e.clientX;
      }
      // For right-positioned handle (left panel)
      return e.clientX;
    },
    [direction, isNested]
  );

  // Update auto-collapse threshold when dependencies change
  React.useEffect(() => {
    autoCollapseThresholdPx.current = enableAutoCollapse
      ? minWidthPx * autoCollapseThreshold
      : 0;
  }, [minWidthPx, enableAutoCollapse, autoCollapseThreshold]);

  // Persist width to cookie if cookie name is provided
  const persistWidth = React.useCallback(
    (width: string) => {
      if (widthCookieName) {
        // biome-ignore lint: cookie-string
        document.cookie = `${widthCookieName}=${width}; path=/; max-age=${widthCookieMaxAge}`;
      }
    },
    [widthCookieName, widthCookieMaxAge]
  );

  // Handle mouse down on resize handle
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      isInteractingWithRail.current = true;

      if (!enableDrag) {
        return;
      }

      // Store initial state
      const currentWidthPx = isCollapsed ? 0 : toPx(currentWidth);
      startWidth.current = currentWidthPx;
      startX.current = e.clientX;
      dragStartPoint.current = e.clientX;
      lastWidth.current = currentWidthPx;
      lastLoggedWidth.current = currentWidthPx;
      lastTogglePoint.current = e.clientX;
      lastToggleWidth.current = currentWidthPx;
      lastDragDirection.current = null;
      toggleCooldown.current = false;
      lastToggleTime.current = 0;
      dragDistanceFromToggle.current = 0;

      // Reset drag offset
      dragOffset.current = 0;

      // Store the rail element's position for nested sidebars
      if (isNested && dragRef.current) {
        railRect.current = dragRef.current.getBoundingClientRect();
      } else {
        railRect.current = null;
      }

      e.preventDefault();
    },
    [enableDrag, isCollapsed, currentWidth, isNested]
  );

  // Handle mouse movement and resizing
  React.useEffect(() => {
    // biome-ignore lint: no-inner-declarations
    const handleMouseMove = (e: MouseEvent) => {
      // biome-ignore lint: early-return
      if (!isInteractingWithRail.current) return;

      const deltaX = Math.abs(e.clientX - startX.current);
      // biome-ignore lint: no-lonely-if
      if (!isDragging.current && deltaX > 5) {
        isDragging.current = true;
        setIsDraggingRail(true);
      }

      if (isDragging.current) {
        // Get unit for width calculations
        const { unit } = parseWidth(currentWidth);

        // Get current rail position for ultra-precise tracking
        let currentRailRect = railRect.current;
        if (isNested && dragRef.current) {
          currentRailRect = dragRef.current.getBoundingClientRect();
        }

        // Determine current drag direction
        const currentDragDirection = isIncreasingWidth(
          e.clientX,
          lastTogglePoint.current
        )
          ? 'expand'
          : 'collapse';

        // Update direction tracking
        if (lastDragDirection.current !== currentDragDirection) {
          lastDragDirection.current = currentDragDirection;
        }

        // Calculate distance from last toggle point
        dragDistanceFromToggle.current = Math.abs(
          e.clientX - lastTogglePoint.current
        );

        // Check for toggle cooldown (prevent rapid toggling)
        const now = Date.now();
        // biome-ignore lint: early-return
        if (toggleCooldown.current && now - lastToggleTime.current > 200) {
          toggleCooldown.current = false;
        }

        // Handle toggling between collapsed and expanded states
        if (!toggleCooldown.current) {
          // Handle collapsing when expanded
          if (enableAutoCollapse && onToggle && !isCollapsed) {
            // Calculate precise width based on mouse position
            const currentDragWidth = calculateWidth(
              e,
              startX.current,
              startWidth.current,
              currentRailRect
            );

            // Determine if we should collapse based on threshold
            let shouldCollapse = false;
            // For thresholds <= 1.0, collapse when width is below minWidth * threshold
            // biome-ignore lint: reasonable-number-constant
            if (autoCollapseThreshold <= 1.0) {
              shouldCollapse =
                currentDragWidth <= minWidthPx * autoCollapseThreshold;
              // For thresholds > 1.0, we need to drag beyond minWidth by a certain amount
            } else if (currentDragWidth <= minWidthPx) {
              // Calculate how much beyond minWidth we need to drag
              const extraDragNeeded =
                // biome-ignore lint: reasonable-number-constant
                minWidthPx * (autoCollapseThreshold - 1.0);
              // Only collapse if we've dragged far enough beyond minWidth
              const distanceBeyondMin = minWidthPx - currentDragWidth;
              shouldCollapse = distanceBeyondMin >= extraDragNeeded;
            }

            if (currentDragDirection === 'collapse' && shouldCollapse) {
              onToggle(); // Collapse
              lastTogglePoint.current = e.clientX;
              lastToggleWidth.current = 0; // Width is 0 when collapsed
              toggleCooldown.current = true;
              lastToggleTime.current = now;
              return;
            }
          }

          // Handle expanding when collapsed
          if (
            onToggle &&
            isCollapsed &&
            currentDragDirection === 'expand' &&
            dragDistanceFromToggle.current > minWidthPx * expandThreshold
          ) {
            onToggle(); // Expand

            // Calculate initial width based on exact mouse position
            const initialWidth = calculateWidth(
              e,
              startX.current,
              startWidth.current,
              currentRailRect
            );

            // Clamp to min/max
            const clampedWidth = Math.max(
              minWidthPx,
              Math.min(maxWidthPx, initialWidth)
            );

            // Set initial width when expanding
            const formattedWidth = formatWidth(
              // biome-ignore lint: simple multiplication
              unit === 'rem' ? clampedWidth / 16 : clampedWidth,
              unit
            );
            onResize(formattedWidth);
            persistWidth(formattedWidth);

            lastTogglePoint.current = e.clientX;
            lastToggleWidth.current = clampedWidth;
            toggleCooldown.current = true;
            lastToggleTime.current = now;
            return;
          }
        }

        // Skip width calculations if panel is collapsed
        if (isCollapsed) {
          return;
        }

        // Calculate new width based on mouse position and drag direction
        const newWidthPx = calculateWidth(
          e,
          startX.current,
          startWidth.current,
          currentRailRect
        );

        // Clamp width between min and max
        const clampedWidthPx = Math.max(
          minWidthPx,
          Math.min(maxWidthPx, newWidthPx)
        );

        // Convert to the target unit
        // biome-ignore lint: simple multiplication
        const newWidth = unit === 'rem' ? clampedWidthPx / 16 : clampedWidthPx;

        // Format and update width
        const formattedWidth = formatWidth(newWidth, unit);
        onResize(formattedWidth);
        persistWidth(formattedWidth);

        // Update last width
        lastWidth.current = clampedWidthPx;
      }
    };

    const handleMouseUp = () => {
      // biome-ignore lint: early-return
      if (!isInteractingWithRail.current) return;

      // Handle click (not drag) behavior
      if (!isDragging.current && onToggle && enableToggle) {
        onToggle();
      }

      // Reset all state
      isDragging.current = false;
      isInteractingWithRail.current = false;
      lastWidth.current = 0;
      lastLoggedWidth.current = 0;
      lastDragDirection.current = null;
      lastTogglePoint.current = 0;
      lastToggleWidth.current = 0;
      toggleCooldown.current = false;
      lastToggleTime.current = 0;
      dragDistanceFromToggle.current = 0;
      dragOffset.current = 0;
      railRect.current = null;
      setIsDraggingRail(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    onResize,
    onToggle,
    isCollapsed,
    currentWidth,
    persistWidth,
    setIsDraggingRail,
    minWidthPx,
    maxWidthPx,
    isIncreasingWidth,
    calculateWidth,
    isNested,
    enableAutoCollapse,
    autoCollapseThreshold,
    expandThreshold,
    enableToggle,
  ]);

  return {
    dragRef,
    isDragging,
    handleMouseDown,
  };
}
