import React, { useState, useEffect } from 'react';
import DeadlockPreventionButton from './components/DeadlockPreventionButton ';

const DeadlockDetectionSimulator = () => {
 
  const [processes, setProcesses] = useState([
    { id: 'P1', color: 'bg-blue-500', resources: [], needsResource: null, status: 'running' },
    { id: 'P2', color: 'bg-green-500', resources: [], needsResource: null, status: 'running' },
    { id: 'P3', color: 'bg-yellow-500', resources: [], needsResource: null, status: 'running' },
    { id: 'P4', color: 'bg-purple-500', resources: [], needsResource: null, status: 'running' }
  ]);
  
  const [resources, setResources] = useState([
    { id: 'R1', instances: 1, allocatedTo: [], color: 'bg-red-500' },
    { id: 'R2', instances: 1, allocatedTo: [], color: 'bg-orange-500' },
    { id: 'R3', instances: 1, allocatedTo: [], color: 'bg-pink-500' },
    { id: 'R4', instances: 2, allocatedTo: [], color: 'bg-indigo-500' }
  ]);
  
  const [simulationSpeed, setSimulationSpeed] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [deadlockDetected, setDeadlockDetected] = useState(false);
  const [waitForGraph, setWaitForGraph] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [predictiveMode, setPredictiveMode] = useState(true);
  const [newProcessName, setNewProcessName] = useState('');
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceInstances, setNewResourceInstances] = useState(1);
  const [showAddProcessModal, setShowAddProcessModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);

  // Available colors for new processes and resources
  const processColors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
  ];
  
  const resourceColors = [
    'bg-red-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-rose-500', 'bg-amber-500', 'bg-fuchsia-500', 'bg-violet-500'
  ];

  const detectDeadlock = () => {
 
    const waitForEdges = [];
    processes.forEach(process => {
      if (process.needsResource) {
        const blockedBy = resources.find(r => r.id === process.needsResource)?.allocatedTo || [];
        blockedBy.forEach(blockerId => {
          if (blockerId !== process.id) {
            waitForEdges.push({
              from: process.id,
              to: blockerId,
              resource: process.needsResource
            });
          }
        });
      }
    });
    
    setWaitForGraph(waitForEdges);
    
  
    const visited = new Set();
    const recStack = new Set();
    
    const hasCycle = (node, graph) => {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);
        
        const neighbors = graph.filter(edge => edge.from === node).map(edge => edge.to);
        
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && hasCycle(neighbor, graph)) {
            return true;
          } else if (recStack.has(neighbor)) {
          
            return true;
          }
        }
      }
      
      recStack.delete(node);
      return false;
    };
    

    let hasDeadlock = false;
    for (const process of processes) {
      if (!visited.has(process.id) && hasCycle(process.id, waitForEdges)) {
        hasDeadlock = true;
        break;
      }
    }
    
    if (hasDeadlock) {
      setDeadlockDetected(true);
      addAiLog("⚠️ Deadlock detected in the system. Initiating resolution strategy.");
      return true;
    }
    
    setDeadlockDetected(false);
    return false;
  };
  
 
  const predictDeadlock = () => {
    if (!predictiveMode) return false;
    
    setAiThinking(true);
    setTimeout(() => {
    
      
      const waitingProcesses = processes.filter(p => p.needsResource !== null).length;
      const resourceSaturation = resources.filter(r => 
        r.allocatedTo.length >= r.instances
      ).length / resources.length;
      
      const deadlockProbability = waitingProcesses / processes.length * resourceSaturation;
      
      if (deadlockProbability > 0.5 && waitingProcesses >= 2) {
        addAiLog(`🔮 AI predicts ${Math.round(deadlockProbability * 100)}% chance of deadlock. Recommending preemptive action.`);
        preventDeadlock();
      } else if (deadlockProbability > 0) {
        addAiLog(`🔮 AI predicts ${Math.round(deadlockProbability * 100)}% chance of deadlock. Monitoring situation.`);
      }
      
      setAiThinking(false);
    }, 800);
  };
  
 
  const preventDeadlock = () => {
   
    const processesCopy = [...processes];
    const resourcesCopy = [...resources];
    
  
    const processesInDeadlock = processes.filter(p => p.needsResource !== null);
    
    if (processesInDeadlock.length === 0) return;
    
   
    processesInDeadlock.sort((a, b) => b.resources.length - a.resources.length);
    
    if (processesInDeadlock[0].resources.length === 0) {
     
      const targetProcess = processesInDeadlock[0];
      const idx = processesCopy.findIndex(p => p.id === targetProcess.id);
      processesCopy[idx] = {
        ...processesCopy[idx],
        resources: [],
        needsResource: null,
        status: 'aborted'
      };
      
      addAiLog(`🛑 AI Resolution: Process ${targetProcess.id} has been aborted to prevent deadlock.`);
    } else {
     
      const targetProcess = processesInDeadlock[0];
      const resourceToRelease = targetProcess.resources[0];
      
    
      const processIdx = processesCopy.findIndex(p => p.id === targetProcess.id);
      processesCopy[processIdx] = {
        ...processesCopy[processIdx],
        resources: processesCopy[processIdx].resources.filter(r => r !== resourceToRelease)
      };
      
    
      const resourceIdx = resourcesCopy.findIndex(r => r.id === resourceToRelease);
      resourcesCopy[resourceIdx] = {
        ...resourcesCopy[resourceIdx],
        allocatedTo: resourcesCopy[resourceIdx].allocatedTo.filter(p => p !== targetProcess.id)
      };
      
      addAiLog(`🔄 AI Resolution: Released resource ${resourceToRelease} from ${targetProcess.id} to prevent deadlock.`);
    }
    
    setProcesses(processesCopy);
    setResources(resourcesCopy);
    setDeadlockDetected(false);
  };
  
  const simulateStep = () => {
    if (deadlockDetected) {
      preventDeadlock();
      return;
    }
    
    const processesCopy = [...processes];
    const resourcesCopy = [...resources];
    
   
    processes.forEach((process, idx) => {
      if (process.status !== 'running') return;
      
      if (process.needsResource) {
        const resourceIdx = resourcesCopy.findIndex(r => r.id === process.needsResource);
        if (resourceIdx >= 0) {
          const resource = resourcesCopy[resourceIdx];
          
         
          if (resource.allocatedTo.length < resource.instances) {
           
            processesCopy[idx] = {
              ...process,
              resources: [...process.resources, resource.id],
              needsResource: null
            };
            
            resourcesCopy[resourceIdx] = {
              ...resource,
              allocatedTo: [...resource.allocatedTo, process.id]
            };
            
            addAiLog(`✅ Process ${process.id} acquired ${resource.id}`);
          }
        }
      }
    });
    
   
    processesCopy.forEach((process, idx) => {
      if (process.status !== 'running') return;
      
     
      if (process.resources.length > 0 && Math.random() < 0.2) {
        const releasedResource = process.resources[Math.floor(Math.random() * process.resources.length)];
        processesCopy[idx] = {
          ...process,
          resources: process.resources.filter(r => r !== releasedResource)
        };
        
        const resourceIdx = resourcesCopy.findIndex(r => r.id === releasedResource);
        resourcesCopy[resourceIdx] = {
          ...resourcesCopy[resourceIdx],
          allocatedTo: resourcesCopy[resourceIdx].allocatedTo.filter(p => p !== process.id)
        };
        
        addAiLog(`📤 Process ${process.id} released ${releasedResource}`);
      }
      
     
      if (process.needsResource === null && Math.random() < 0.3) {
     
        const availableResources = resourcesCopy
          .filter(r => !process.resources.includes(r.id))
          .map(r => r.id);
        
        if (availableResources.length > 0) {
          const requestedResource = availableResources[Math.floor(Math.random() * availableResources.length)];
          processesCopy[idx] = {
            ...process,
            needsResource: requestedResource
          };
          
          addAiLog(`📥 Process ${process.id} requested ${requestedResource}`);
        }
      }
    });
    
    setProcesses(processesCopy);
    setResources(resourcesCopy);
    
   
    const hasDeadlock = detectDeadlock();
    
    
    if (!hasDeadlock) {
      predictDeadlock();
    }
  };
  
  const addAiLog = (message) => {
    setAiLogs(prev => [
      { id: Date.now(), message, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9)
    ]);
  };
  

  const resetSimulation = () => {
    setIsRunning(false);
    setDeadlockDetected(false);
    setWaitForGraph([]);
    setAiLogs([]);
    setProcesses([
      { id: 'P1', color: 'bg-blue-500', resources: [], needsResource: null, status: 'running' },
      { id: 'P2', color: 'bg-green-500', resources: [], needsResource: null, status: 'running' },
      { id: 'P3', color: 'bg-yellow-500', resources: [], needsResource: null, status: 'running' },
      { id: 'P4', color: 'bg-purple-500', resources: [], needsResource: null, status: 'running' }
    ]);
    setResources([
      { id: 'R1', instances: 1, allocatedTo: [], color: 'bg-red-500' },
      { id: 'R2', instances: 1, allocatedTo: [], color: 'bg-orange-500' },
      { id: 'R3', instances: 1, allocatedTo: [], color: 'bg-pink-500' },
      { id: 'R4', instances: 2, allocatedTo: [], color: 'bg-indigo-500' }
    ]);
    addAiLog("🔄 Simulation reset");
  };
  
  // New functions for adding and removing processes and resources
  const addProcess = () => {
    if (!newProcessName.trim()) {
      addAiLog("⚠️ Process name cannot be empty");
      return;
    }
    
    // Check if process name already exists
    if (processes.some(p => p.id === newProcessName)) {
      addAiLog(`⚠️ Process ${newProcessName} already exists`);
      return;
    }
    
    // Select a color for the new process
    const colorIndex = processes.length % processColors.length;
    const newColor = processColors[colorIndex];
    
    const newProcess = {
      id: newProcessName,
      color: newColor,
      resources: [],
      needsResource: null,
      status: 'running'
    };
    
    setProcesses([...processes, newProcess]);
    addAiLog(`➕ Process ${newProcessName} added to simulation`);
    setNewProcessName('');
    setShowAddProcessModal(false);
  };
  
  const removeProcess = (processId) => {
    // Check if process has any allocated resources and release them
    const processCopy = processes.find(p => p.id === processId);
    if (processCopy) {
      const resourcesCopy = [...resources];
      
      processCopy.resources.forEach(resId => {
        const resourceIdx = resourcesCopy.findIndex(r => r.id === resId);
        if (resourceIdx >= 0) {
          resourcesCopy[resourceIdx] = {
            ...resourcesCopy[resourceIdx],
            allocatedTo: resourcesCopy[resourceIdx].allocatedTo.filter(pid => pid !== processId)
          };
        }
      });
      
      setResources(resourcesCopy);
    }
    
    // Remove the process
    setProcesses(processes.filter(p => p.id !== processId));
    addAiLog(`➖ Process ${processId} removed from simulation`);
  };
  
  const addResource = () => {
    if (!newResourceName.trim()) {
      addAiLog("⚠️ Resource name cannot be empty");
      return;
    }
    
    // Check if resource name already exists
    if (resources.some(r => r.id === newResourceName)) {
      addAiLog(`⚠️ Resource ${newResourceName} already exists`);
      return;
    }
    
    // Validate instances
    const instances = parseInt(newResourceInstances);
    if (isNaN(instances) || instances < 1) {
      addAiLog("⚠️ Resource instances must be a positive number");
      return;
    }
    
    // Select a color for the new resource
    const colorIndex = resources.length % resourceColors.length;
    const newColor = resourceColors[colorIndex];
    
    const newResource = {
      id: newResourceName,
      instances: instances,
      allocatedTo: [],
      color: newColor
    };
    
    setResources([...resources, newResource]);
    addAiLog(`➕ Resource ${newResourceName} (${instances} instances) added to simulation`);
    setNewResourceName('');
    setNewResourceInstances(1);
    setShowAddResourceModal(false);
  };
  
  const removeResource = (resourceId) => {
    // Check if any process is using or waiting for this resource
    const processesCopy = [...processes];
    let resourceInUse = false;
    
    processesCopy.forEach((process, idx) => {
      // Remove from resources list if process has it
      if (process.resources.includes(resourceId)) {
        processesCopy[idx] = {
          ...process,
          resources: process.resources.filter(r => r !== resourceId)
        };
        resourceInUse = true;
      }
      
      // Remove from needsResource if process is waiting for it
      if (process.needsResource === resourceId) {
        processesCopy[idx] = {
          ...process,
          needsResource: null
        };
        resourceInUse = true;
      }
    });
    
    if (resourceInUse) {
      setProcesses(processesCopy);
      addAiLog(`⚠️ Resource ${resourceId} was in use and has been released from all processes`);
    }
    
    // Remove the resource
    setResources(resources.filter(r => r.id !== resourceId));
    addAiLog(`➖ Resource ${resourceId} removed from simulation`);
  };
 
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(simulateStep, simulationSpeed);
    }
    return () => clearInterval(interval);
  }, [isRunning, processes, resources, simulationSpeed, deadlockDetected]);
  
  // Modal component for adding processes
  const AddProcessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add New Process</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Process ID</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded"
            placeholder="e.g. P5"
            value={newProcessName}
            onChange={(e) => setNewProcessName(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => setShowAddProcessModal(false)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={addProcess}
          >
            Add Process
          </button>
        </div>
      </div>
    </div>
  );
  
  // Modal component for adding resources
  const AddResourceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add New Resource</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded"
            placeholder="e.g. R5"
            value={newResourceName}
            onChange={(e) => setNewResourceName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Instances</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded"
            min="1"
            value={newResourceInstances}
            onChange={(e) => setNewResourceInstances(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => setShowAddResourceModal(false)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={addResource}
          >
            Add Resource
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h1 className="text-2xl font-bold">AI-Based Deadlock Detection Simulator</h1>
          <p className="text-sm">Visualizing how AI can predict and prevent deadlocks in multi-threaded applications</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Left panel - Controls */}
          <div className="col-span-1 bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Simulation Controls</h2>
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Simulation:</span>
                <button 
                  className={`px-4 py-2 rounded font-medium ${isRunning ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? 'Pause' : 'Start'}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Speed:</span>
                <select 
                  className="border rounded p-2"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                >
                  <option value="2000">Slow</option>
                  <option value="1000">Normal</option>
                  <option value="500">Fast</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">AI Prediction:</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={predictiveMode}
                    onChange={() => setPredictiveMode(!predictiveMode)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="pt-2">
                <button 
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                  onClick={resetSimulation}
                >
                  Reset Simulation
                </button>
              </div>
              
              <div className="pt-2">
                <button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                  onClick={simulateStep}
                  disabled={isRunning}
                >
                  Step Forward
                </button>
              </div>
              
              {/* New buttons for adding processes and resources */}
              <div className="pt-2">
                <button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded"
                  onClick={() => setShowAddProcessModal(true)}
                  disabled={isRunning}
                >
                  Add Process
                </button>
              </div>
              
              <div className="pt-2">
                <button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded"
                  onClick={() => setShowAddResourceModal(true)}
                  disabled={isRunning}
                >
                  Add Resource
                </button>
              </div>
            
            </div>
            <div>
            {/* Prevention Button Component */}
            <DeadlockPreventionButton 
                deadlockDetected={deadlockDetected} 
                onPreventDeadlock={preventDeadlock}
                processes={processes}
                resources={resources}
              />
              
              {deadlockDetected && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                  <p className="font-bold">Deadlock Detected!</p>
                  <p className="text-sm">Use the prevention button to resolve it.</p>
                </div>
              )}
              
              {aiThinking && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
                  <p className="font-bold">AI is analyzing...</p>
                  <p className="text-sm">Predicting potential deadlocks.</p>
                </div>
              )}
            </div>
            
            {/* Process Management Section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Processes</h3>
              <div className="space-y-1">
                {processes.map(process => (
                  <div key={process.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div className="flex items-center">
                      <span className={`${process.color} w-3 h-3 rounded-full mr-2`}></span>
                      <span className="font-medium">{process.id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                        process.status === 'running' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {process.status}
                      </span>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeProcess(process.id)}
                        disabled={isRunning}
                        title="Remove Process"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Resource Management Section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Resources</h3>
              <div className="space-y-1">
                {resources.map(resource => (
                  <div key={resource.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div className="flex items-center">
                      <span className={`${resource.color} w-3 h-3 rounded mr-2`}></span>
                      <span className="font-medium">{resource.id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">
                        {resource.allocatedTo.length}/{resource.instances} used
                      </span>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeResource(resource.id)}
                        disabled={isRunning}
                        title="Remove Resource"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Middle panel - Resource Allocation Graph */}
          <div className="col-span-1 lg:col-span-2 bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Resource Allocation Graph</h2>
            
            // Inside the DeadlockDetectionSimulator component, replace the Resource Allocation Graph SVG section with this:

<div className="relative bg-white rounded border" style={{ height: `${Math.max(400, (Math.max(processes.length, resources.length) * 80) + 120)}px` }}>
  <svg className="w-full h-full" viewBox={`0 0 800 ${Math.max(400, (Math.max(processes.length, resources.length) * 80) + 120)}`}>
    {/* Draw processes */}
    {processes.map((process, i) => (
      <g key={`process-${process.id}`} transform={`translate(200, ${100 + i * 80})`}>
        <circle 
          r="20" 
          className={`${process.color} ${process.status === 'aborted' ? 'opacity-50' : ''}`} 
          stroke={deadlockDetected && process.needsResource ? "red" : "white"} 
          strokeWidth="2"
        />
        <text 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="white" 
          fontWeight="bold"
        >
          {process.id}
        </text>
        
        {/* Show resource request if any */}
        {process.needsResource && (
          <g>
            <line 
              x1="25" 
              y1="0" 
              x2="70" 
              y2="0" 
              stroke={deadlockDetected ? "red" : "#666"} 
              strokeWidth="2" 
              strokeDasharray="4 2"
            />
            <polygon 
              points="65,5 75,0 65,-5" 
              fill={deadlockDetected ? "red" : "#666"} 
            />
            <text 
              x="50" 
              y="-10" 
              textAnchor="middle" 
              fill={deadlockDetected ? "red" : "#666"} 
              fontSize="10"
            >
              wants {process.needsResource}
            </text>
          </g>
        )}
      </g>
    ))}
    
    {/* Draw resources */}
    {resources.map((resource, i) => (
      <g key={`resource-${resource.id}`} transform={`translate(400, ${100 + i * 80})`}>
        <rect 
          x="-20" 
          y="-20" 
          width="40" 
          height="40" 
          className={resource.color} 
          stroke="white" 
          strokeWidth="2"
        />
        <text 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="white" 
          fontWeight="bold"
        >
          {resource.id}
        </text>
        
        {/* Show instances count if more than 1 */}
        {resource.instances > 1 && (
          <text 
            x="25" 
            y="-25" 
            textAnchor="middle" 
            fill="black" 
            fontSize="10"
            className="bg-white px-1 rounded"
          >
            {resource.instances} instances
          </text>
        )}
      </g>
    ))}
    
    {/* Draw allocation edges */}
    {resources.map(resource => (
      resource.allocatedTo.map(processId => {
        const process = processes.find(p => p.id === processId);
        if (!process) return null;
        
        const processIndex = processes.findIndex(p => p.id === processId);
        const resourceIndex = resources.findIndex(r => r.id === resource.id);
        
        return (
          <g key={`edge-${resource.id}-${processId}`}>
            <line 
              x1="400" 
              y1={100 + resourceIndex * 80} 
              x2="220" 
              y2={100 + processIndex * 80} 
              stroke="#333" 
              strokeWidth="2" 
            />
            <polygon 
              points={`225,${97 + processIndex * 80} 215,${100 + processIndex * 80} 225,${103 + processIndex * 80}`} 
              fill="#333" 
            />
            <text 
              x="310" 
              y={95 + (resourceIndex + processIndex) * 40} 
              textAnchor="middle" 
              fill="#333" 
              fontSize="10"
            >
              allocated
            </text>
          </g>
        );
      })
    ))}
    
    {/* Draw wait-for edges */}
    {waitForGraph.map((edge, index) => {
      const fromProcess = processes.findIndex(p => p.id === edge.from);
      const toProcess = processes.findIndex(p => p.id === edge.to);
      
      if (fromProcess === -1 || toProcess === -1) return null;
      
      const fromY = 100 + fromProcess * 80;
      const toY = 100 + toProcess * 80;
      
      // Create a curved path for the wait-for edge
      const path = `M 200 ${fromY} C 150 ${fromY}, 150 ${toY}, 200 ${toY}`;
      
      return (
        <g key={`wait-edge-${index}`}>
          <path 
            d={path} 
            fill="none" 
            stroke="red" 
            strokeWidth="2" 
            strokeDasharray="4 2" 
          />
          <polygon 
            points={`195,${toY-5} 205,${toY} 195,${toY+5}`} 
            fill="red" 
          />
          <text 
            x="120" 
            y={(fromY + toY) / 2} 
            textAnchor="middle" 
            fill="red" 
            fontSize="10"
          >
            waiting for {edge.resource}
          </text>
        </g>
      );
    })}
  </svg>
</div>
            
            {/* Process Resources Table */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Process Resource Status</h3>
              <div className="bg-white rounded border overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium">Process</th>
                      <th className="py-2 px-4 text-left font-medium">Status</th>
                      <th className="py-2 px-4 text-left font-medium">Resources Held</th>
                      <th className="py-2 px-4 text-left font-medium">Waiting For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map(process => (
                      <tr key={process.id} className="border-t">
                        <td className="py-2 px-4">
                          <span className={`inline-block ${process.color} w-3 h-3 rounded-full mr-2`}></span>
                          {process.id}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            process.status === 'running' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {process.status}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {process.resources.length === 0 ? (
                            <span className="text-gray-400">None</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {process.resources.map(resId => {
                                const resource = resources.find(r => r.id === resId);
                                return (
                                  <span 
                                    key={resId}
                                    className={`${resource?.color} text-white px-2 py-1 rounded text-xs`}
                                  >
                                    {resId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {process.needsResource ? (
                            <span className={`${resources.find(r => r.id === process.needsResource)?.color} text-white px-2 py-1 rounded text-xs`}>
                              {process.needsResource}
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* AI Logs */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">AI Activity Log</h3>
              <div className="bg-black text-green-400 rounded p-2 h-48 overflow-y-auto font-mono text-sm">
                {aiLogs.length === 0 ? (
                  <p className="opacity-50">No activity yet. Start the simulation...</p>
                ) : (
                  aiLogs.map(log => (
                    <div key={log.id} className="py-1 border-b border-gray-800">
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showAddProcessModal && <AddProcessModal />}
      {showAddResourceModal && <AddResourceModal />}
    </div>
  );
};

export default DeadlockDetectionSimulator;