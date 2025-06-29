/**
 * Globe Interaction Manual Test
 * 
 * This file creates a manual test interface that you can open in a browser
 * to verify that the drag/click detection is working correctly.
 */

export const createManualTestInterface = () => {
  const testContainer = document.createElement('div');
  testContainer.id = 'manual-test-container';
  testContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    height: 300px;
    background: #1a1a1a;
    border: 2px solid #00ff41;
    border-radius: 8px;
    padding: 20px;
    z-index: 10000;
    color: #00ff41;
    font-family: monospace;
    font-size: 14px;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Globe Interaction Test';
  title.style.cssText = 'margin: 0 0 15px 0; color: #00ff41;';

  const instructions = document.createElement('div');
  instructions.innerHTML = `
    <p><strong>Test Instructions:</strong></p>
    <ol>
      <li>Try short clicks (should detect as CLICK)</li>
      <li>Try drag movements (should detect as DRAG)</li>
      <li>Try long press (should detect as DRAG)</li>
    </ol>
    <p>Results will appear below:</p>
  `;

  const testArea = document.createElement('div');
  testArea.style.cssText = `
    width: 100%;
    height: 120px;
    background: #333;
    border: 1px solid #555;
    margin: 10px 0;
    cursor: crosshair;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
  `;
  testArea.textContent = 'Test Area - Click or Drag Here';

  const resultsArea = document.createElement('div');
  resultsArea.id = 'test-results';
  resultsArea.style.cssText = `
    height: 60px;
    background: #222;
    border: 1px solid #555;
    padding: 5px;
    overflow-y: auto;
    font-size: 12px;
    color: #0f0;
  `;

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close Test';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ff4444;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
  `;
  
  closeButton.onclick = () => {
    document.body.removeChild(testContainer);
  };

  // Interaction detection logic
  let interactionState = {
    isMouseDown: false,
    startPos: { x: 0, y: 0 },
    startTime: 0,
    dragThreshold: 5,
    timeThreshold: 300
  };

  const logResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    resultsArea.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    resultsArea.scrollTop = resultsArea.scrollHeight;
  };

  const handleMouseDown = (e: MouseEvent) => {
    interactionState = {
      ...interactionState,
      isMouseDown: true,
      startPos: { x: e.clientX, y: e.clientY },
      startTime: Date.now()
    };
    logResult(`🖱️ Mouse Down at (${e.clientX}, ${e.clientY})`);
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!interactionState.isMouseDown) return;

    const endTime = Date.now();
    const duration = endTime - interactionState.startTime;
    const distance = Math.sqrt(
      Math.pow(e.clientX - interactionState.startPos.x, 2) + 
      Math.pow(e.clientY - interactionState.startPos.y, 2)
    );

    const wasClick = distance <= interactionState.dragThreshold && 
                     duration <= interactionState.timeThreshold;

    const action = wasClick ? 'CLICK' : 'DRAG';
    const color = wasClick ? '#00ff00' : '#ffaa00';
    
    logResult(`<span style="color: ${color}; font-weight: bold;">${action}</span> detected - Distance: ${distance.toFixed(1)}px, Time: ${duration}ms`);

    interactionState.isMouseDown = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!interactionState.isMouseDown) return;

    const distance = Math.sqrt(
      Math.pow(e.clientX - interactionState.startPos.x, 2) + 
      Math.pow(e.clientY - interactionState.startPos.y, 2)
    );

    if (distance > interactionState.dragThreshold) {
      testArea.style.background = '#444400'; // Yellow tint during drag
    }
  };

  // Attach event listeners
  testArea.addEventListener('mousedown', handleMouseDown);
  testArea.addEventListener('mouseup', handleMouseUp);
  testArea.addEventListener('mousemove', handleMouseMove);
  testArea.addEventListener('mouseleave', handleMouseUp);

  // Touch support
  testArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown(new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    }));
  });

  testArea.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleMouseUp(new MouseEvent('mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY
    }));
  });

  testArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove(new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    }));
  });

  // Reset background on mouse leave
  testArea.addEventListener('mouseleave', () => {
    testArea.style.background = '#333';
  });

  // Assemble the interface
  testContainer.appendChild(closeButton);
  testContainer.appendChild(title);
  testContainer.appendChild(instructions);
  testContainer.appendChild(testArea);
  testContainer.appendChild(resultsArea);

  document.body.appendChild(testContainer);

  logResult('Test interface ready. Try clicking and dragging in the test area.');

  return testContainer;
};

// Auto-run when included in browser
if (typeof window !== 'undefined') {
  (window as any).createManualTest = createManualTestInterface;
}
