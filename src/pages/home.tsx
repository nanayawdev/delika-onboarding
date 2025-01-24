import { Navbar } from "@/components/layout/navbar"
import heroImage from '@/assets/hero-image.jpg'
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function Home() {
  const [text, setText] = useState("")
  const [subText, setSubText] = useState("")
  const fullText = "Welcome to Delika"
  const fullSubText = "Streamlining restaurants management with our comprehensive platform."
  
  useEffect(() => {
    // Type main heading
    const timeout = setTimeout(() => {
      if (text.length < fullText.length) {
        setText(fullText.slice(0, text.length + 1))
      }
    }, 100)

    // Start typing subtext after main heading is done
    if (text === fullText) {
      const subTimeout = setTimeout(() => {
        if (subText.length < fullSubText.length) {
          setSubText(fullSubText.slice(0, subText.length + 1))
        }
      }, 50)
      return () => clearTimeout(subTimeout)
    }

    return () => clearTimeout(timeout)
  }, [text, subText])

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Hero background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <Navbar />
      
      {/* Hero Section */}
      <main className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
            >
              {text}
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block ml-1"
              >
                |
              </motion.span>
            </motion.h1>
            <motion.p 
              className="mt-6 text-lg leading-8 text-gray-200"
            >
              {subText}
              {text === fullText && subText !== fullSubText && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block ml-1"
                >
                  |
                </motion.span>
              )}
            </motion.p>
          </div>
        </div>
      </main>
    </div>
  )
} 