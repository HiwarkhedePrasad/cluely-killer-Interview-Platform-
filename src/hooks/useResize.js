import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for resizable panel dimensions.
 * Returns size state, start/resize/end handlers for a single resize axis.
 */
export function useResizePanel({ initialSize, minSize, maxSize, direction = 'horizontal' }) {
  const [size, setSize] = useState(initialSize);
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(initialSize);

  const onMouseDown = useCallback((e) => {
    isDragging.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSize.current = size;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [size, direction]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      const newSize = direction === 'horizontal'
        ? startSize.current + delta
        : startSize.current - delta; // vertical: dragging up = increase height
      setSize(Math.min(Math.max(newSize, minSize), maxSize));
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [direction, minSize, maxSize]);

  return { size, setSize, onMouseDown };
}

/**
 * Hook for resizing the sidebar (horizontal) and bottom panel (vertical)
 * in the coding workspace simultaneously.
 */
export function useWorkspaceResize() {
  // Sidebar width (left panel with questions)
  const sidebar = useResizePanel({
    initialSize: 300,
    minSize: 220,
    maxSize: 500,
    direction: 'horizontal',
  });

  // Bottom panel height (output / test results)
  const bottomHeight = useResizePanel({
    initialSize: 240,
    minSize: 120,
    maxSize: 500,
    direction: 'vertical',
  });

  return { sidebar, bottomHeight };
}

export default useWorkspaceResize;
