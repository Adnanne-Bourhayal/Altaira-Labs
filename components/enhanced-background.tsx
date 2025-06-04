"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

export default function EnhancedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 30

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    // Post-processing
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5, // strength
      0.4, // radius
      0.85, // threshold
    )
    composer.addPass(bloomPass)

    // Create neural network-like structure
    const nodesCount = 150
    const connectionsCount = 300

    // Nodes
    const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16)
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x4080ff })

    const nodes = []
    const nodePositions = []

    for (let i = 0; i < nodesCount; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial)

      // Position nodes in a sphere-like distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 15 + Math.random() * 10

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      node.position.set(x, y, z)
      nodePositions.push({ x, y, z })
      nodes.push(node)
      scene.add(node)
    }

    // Connections
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x4080ff,
      transparent: true,
      opacity: 0.3,
    })

    const connections = []

    for (let i = 0; i < connectionsCount; i++) {
      const nodeIndex1 = Math.floor(Math.random() * nodesCount)
      const nodeIndex2 = Math.floor(Math.random() * nodesCount)

      if (nodeIndex1 !== nodeIndex2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          nodes[nodeIndex1].position,
          nodes[nodeIndex2].position,
        ])

        const line = new THREE.Line(geometry, connectionMaterial)
        connections.push({
          line,
          node1: nodeIndex1,
          node2: nodeIndex2,
        })

        scene.add(line)
      }
    }

    // Pulsating nodes
    const pulseNodes = []
    for (let i = 0; i < 15; i++) {
      const index = Math.floor(Math.random() * nodesCount)
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.2 + Math.random() * 0.2, 0.4 + Math.random() * 0.2, 0.8 + Math.random() * 0.2),
        transparent: true,
        opacity: 0.8,
      })

      const pulseNode = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), pulseMaterial)

      pulseNode.position.copy(nodes[index].position)
      pulseNodes.push({
        mesh: pulseNode,
        baseSize: 0.2,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
      })

      scene.add(pulseNode)
    }

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
      composer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    // Mouse movement effect
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      })
    }

    document.addEventListener("mousemove", handleMouseMove)

    // Animation loop
    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()

      // Rotate entire scene based on mouse position
      scene.rotation.x += (mousePosition.y * 0.5 - scene.rotation.x) * 0.05
      scene.rotation.y += (mousePosition.x * 0.5 - scene.rotation.y) * 0.05

      // Animate nodes
      nodes.forEach((node, index) => {
        const pos = nodePositions[index]
        node.position.x = pos.x + Math.sin(elapsedTime * 0.3 + index) * 0.3
        node.position.y = pos.y + Math.cos(elapsedTime * 0.2 + index * 0.5) * 0.3
        node.position.z = pos.z + Math.sin(elapsedTime * 0.4 + index * 0.7) * 0.3
      })

      // Update connections
      connections.forEach((connection) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          nodes[connection.node1].position,
          nodes[connection.node2].position,
        ])

        connection.line.geometry.dispose()
        connection.line.geometry = geometry
      })

      // Animate pulsating nodes
      pulseNodes.forEach((pulseNode) => {
        const scale = pulseNode.baseSize + Math.sin(elapsedTime * pulseNode.pulseSpeed + pulseNode.pulsePhase) * 0.15

        pulseNode.mesh.scale.set(scale, scale, scale)

        // Also animate opacity
        const material = pulseNode.mesh.material as THREE.MeshBasicMaterial
        material.opacity = 0.4 + Math.sin(elapsedTime * pulseNode.pulseSpeed + pulseNode.pulsePhase) * 0.3
      })

      // Render scene with post-processing
      composer.render()
    }

    animate()

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }

      window.removeEventListener("resize", handleResize)
      document.removeEventListener("mousemove", handleMouseMove)

      // Dispose geometries and materials
      nodeGeometry.dispose()
      nodeMaterial.dispose()
      connectionMaterial.dispose()

      connections.forEach((connection) => {
        connection.line.geometry.dispose()
      })

      pulseNodes.forEach((pulseNode) => {
        ;(pulseNode.mesh.material as THREE.Material).dispose()
        pulseNode.mesh.geometry.dispose()
      })
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 z-0" />
}

