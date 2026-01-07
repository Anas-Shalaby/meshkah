import { motion } from 'framer-motion';
import { Sparkles, Moon, Star } from 'lucide-react';

const RamadanFloatingElements = () => {
  const floatingElements = [
    { Icon: Moon, delay: 0, duration: 8, x: '10%', y: '20%', color: '#fbbf24', size: 40 },
    { Icon: Star, delay: 2, duration: 10, x: '80%', y: '15%', color: '#d4af37', size: 30 },
    { Icon: Sparkles, delay: 1, duration: 7, x: '20%', y: '70%', color: '#fbbf24', size: 35 },
    { Icon: Moon, delay: 3, duration: 9, x: '75%', y: '60%', color: '#d4af37', size: 25 },
    { Icon: Star, delay: 1.5, duration: 11, x: '50%', y: '30%', color: '#fbbf24', size: 20 },
    { Icon: Sparkles, delay: 2.5, duration: 8, x: '15%', y: '45%', color: '#d4af37', size: 28 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          initial={{ 
            opacity: 0,
            scale: 0,
            x: element.x,
            y: element.y
          }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360],
            y: [element.y, `calc(${element.y} - 30px)`, element.y]
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            left: element.x,
            top: element.y,
          }}
        >
          <element.Icon 
            size={element.size} 
            style={{ 
              color: element.color,
              filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))'
            }} 
          />
        </motion.div>
      ))}
      
      {/* Gold particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          initial={{ 
            opacity: 0,
            x: `${Math.random() * 100}%`,
            y: `${100 + Math.random() * 20}%`
          }}
          animate={{ 
            opacity: [0, 0.6, 0],
            y: `${-20 - Math.random() * 20}%`,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)',
            boxShadow: '0 0 10px #d4af37'
          }}
        />
      ))}
    </div>
  );
};

export default RamadanFloatingElements;

